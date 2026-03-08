# Web-Based Database Visualization Tool: Architecture Report

A comprehensive technical architecture guide for building a browser-based database management and visualization tool.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Database Connectivity Patterns](#1-database-connectivity-patterns)
3. [Supported Database Types](#2-supported-database-types)
4. [Query Execution Architecture](#3-query-execution-architecture)
5. [Frontend Architecture](#4-frontend-architecture)
6. [Backend Architecture Options](#5-backend-architecture-options)
7. [Real-time Features](#6-real-time-features)
8. [Reference Implementations](#7-reference-implementations)
9. [Recommended Architecture](#8-recommended-architecture)
10. [Security Considerations](#9-security-considerations)

---

## Executive Summary

Building a web-based database visualization tool requires careful architectural decisions across connectivity, security, performance, and user experience domains. This report synthesizes research from industry best practices, open-source implementations (DbGate, Beekeeper Studio, pgAdmin), and modern cloud-native patterns.

**Key Architectural Decisions:**
- **Backend proxy is mandatory** - Direct browser-to-database connections are a critical security risk
- **WebSocket for real-time** - Use WebSockets for streaming results and live updates
- **Connection pooling essential** - PgBouncer/ProxySQL for production workloads
- **Cursor-based pagination** - 17x faster than offset pagination for large datasets
- **AG Grid for enterprise** - Best performance for 100K+ rows; TanStack Table for flexibility

---

## 1. Database Connectivity Patterns

### 1.1 Direct Browser Connection vs Backend Proxy

#### Why Direct Browser Connections Are Dangerous

According to [Heroku's WebSocket Security guide](https://devcenter.heroku.com/articles/websocket-security), tunneling database connections directly to the browser is extremely risky. An XSS attack could escalate into complete database access, allowing attackers to execute arbitrary queries.

**Recommendation: Always use a backend proxy layer.**

```
┌─────────────┐     HTTPS/WSS      ┌─────────────┐     TCP        ┌──────────────┐
│   Browser   │ ←───────────────→  │   Backend   │ ←───────────→  │   Database   │
│   (React)   │                    │   Proxy     │                │   Server     │
└─────────────┘                    └─────────────┘                └──────────────┘
```

#### Backend Proxy Architecture

```typescript
// Example proxy architecture
interface DatabaseProxy {
  // Connection management
  connect(credentials: DBCredentials): Promise<ConnectionId>;
  disconnect(connectionId: ConnectionId): void;

  // Query execution
  executeQuery(connectionId: ConnectionId, sql: string): AsyncGenerator<Row>;
  cancelQuery(connectionId: ConnectionId, queryId: string): void;

  // Metadata
  getSchema(connectionId: ConnectionId): Promise<Schema>;
  getTables(connectionId: ConnectionId, schema: string): Promise<Table[]>;
}
```

### 1.2 Connection Pooling Strategies

#### PgBouncer for PostgreSQL

[PgBouncer](https://www.pgbouncer.org/) is the standard for PostgreSQL connection pooling. According to [pgDash](https://pgdash.io/blog/pgbouncer-connection-pool.html), it acts as a lightweight proxy that maintains connection pools.

**Pooling Modes:**

| Mode | Description | Use Case |
|------|-------------|----------|
| **Session** | Connection per client session | Legacy apps needing session state |
| **Transaction** | Connection per transaction | **Recommended for web apps** |
| **Statement** | Connection per statement | Maximum efficiency, no transactions |

**Architecture Options:**

1. **Client-side pooler** - PgBouncer on each app server
2. **Centralized pooler** - Single PgBouncer before database
3. **Hybrid** - Multiple poolers with HAProxy for HA

```yaml
# PgBouncer configuration for web apps
[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 5
```

#### ProxySQL for MySQL/MariaDB

[ProxySQL](https://proxysql.com/) provides connection pooling, load balancing, and query routing for MySQL. Key features per [ProxySQL documentation](https://proxysql.com/blog/database-proxy/):

- **Connection multiplexing** - Multiple frontend connections share backend connections
- **Read/write splitting** - Automatic routing to primary/replicas
- **Query rules engine** - Cache, block, rewrite, or reroute queries
- **Zero-downtime reconfiguration**

### 1.3 WebSocket vs HTTP Polling

#### WebSocket Advantages

Per [InfoQ's analysis](https://www.infoq.com/articles/Web-Sockets-Proxy-Servers/):

- **Bidirectional** - Full-duplex communication over single TCP connection
- **Lower latency** - No HTTP overhead for each message
- **Real-time streaming** - Ideal for query result streaming

#### Security Requirements

From [Bright Security](https://brightsec.com/blog/websocket-security-top-vulnerabilities/):

1. **Always use WSS** (WebSocket Secure over TLS)
2. **Implement ticket-based authentication** - Generate short-lived tokens via HTTP, validate on WS connection
3. **Validate Origin header** - Prevent cross-origin attacks
4. **Rate limiting** - Protect against DoS

```typescript
// Ticket-based WebSocket authentication
interface AuthTicket {
  userId: string;
  connectionId: string;
  timestamp: number;
  clientIp: string;
  signature: string;  // HMAC of above fields
}

// Generate ticket via HTTP endpoint
app.post('/api/ws-ticket', authenticate, (req, res) => {
  const ticket = generateTicket(req.user, req.ip);
  res.json({ ticket, expiresIn: 30 }); // 30 second validity
});

// Validate on WebSocket connection
wss.on('connection', (ws, req) => {
  const ticket = parseTicket(req.url);
  if (!validateTicket(ticket)) {
    ws.close(4001, 'Invalid ticket');
    return;
  }
});
```

### 1.4 Handling Long-Running Queries

#### Server-Side Timeout Configuration

Per [Crunchy Data](https://www.crunchydata.com/blog/control-runaway-postgres-queries-with-statement-timeout):

```sql
-- Database-level default (10 seconds for web apps)
ALTER DATABASE webapp SET statement_timeout = '10s';

-- Role-specific (longer for reports)
ALTER ROLE report_user SET statement_timeout = '5min';

-- Per-query override
SET LOCAL statement_timeout = '30s';
```

#### Query Cancellation

PostgreSQL provides `pg_cancel_backend()` and `pg_terminate_backend()`. Per [CYBERTEC](https://www.cybertec-postgresql.com/en/cancel-hanging-postgresql-query/):

```typescript
// Track running queries
interface RunningQuery {
  queryId: string;
  connectionPid: number;
  startTime: Date;
  sql: string;
}

// Cancel via separate connection
async function cancelQuery(pid: number): Promise<boolean> {
  const result = await adminPool.query(
    'SELECT pg_cancel_backend($1)', [pid]
  );
  return result.rows[0].pg_cancel_backend;
}
```

### 1.5 Connection Timeout and Retry Patterns

```typescript
interface ConnectionConfig {
  // Initial connection
  connectionTimeoutMs: 10000;

  // Query execution
  statementTimeoutMs: 30000;

  // Idle connection
  idleTimeoutMs: 60000;

  // Retry configuration
  retry: {
    maxAttempts: 3;
    initialDelayMs: 1000;
    maxDelayMs: 30000;
    backoffMultiplier: 2;
  };
}

// Exponential backoff with jitter
function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = Math.min(
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt),
    config.maxDelayMs
  );
  return delay + Math.random() * delay * 0.1; // 10% jitter
}
```

---

## 2. Supported Database Types

### 2.1 Relational Databases

| Database | Driver (Node.js) | Key Considerations |
|----------|------------------|-------------------|
| **PostgreSQL** | `pg`, `postgres` | Best ecosystem, use PgBouncer for pooling |
| **MySQL** | `mysql2` | Use ProxySQL, supports prepared statements |
| **MariaDB** | `mysql2`, `mariadb` | MySQL-compatible with extensions |
| **SQLite** | `better-sqlite3`, `sql.js` | In-browser via WASM, or server-side |
| **SQL Server** | `tedious`, `mssql` | Windows auth via Kerberos |
| **Oracle** | `oracledb` | Requires Oracle Client libraries |

### 2.2 NoSQL Databases

| Database | Driver | Data Model |
|----------|--------|------------|
| **MongoDB** | `mongodb` | Document store, BSON |
| **Redis** | `ioredis`, `redis` | Key-value, streams, pub/sub |
| **Cassandra** | `cassandra-driver` | Wide-column, CQL |
| **DynamoDB** | `@aws-sdk/client-dynamodb` | Key-value/document, AWS |

### 2.3 Cloud-Native Databases

Based on [Cloudflare's database integrations](https://blog.cloudflare.com/announcing-database-integrations/):

| Database | Connection Type | Serverless Optimized |
|----------|-----------------|---------------------|
| **Neon** | HTTP, WebSocket, TCP | Yes - separates compute/storage |
| **Supabase** | HTTP (PostgREST), TCP | Yes - built-in connection pooler |
| **PlanetScale** | HTTP, TCP | Yes - Vitess-based MySQL |
| **Turso** | HTTP, WebSocket | Yes - libSQL (SQLite fork) |
| **CockroachDB** | PostgreSQL wire protocol | Distributed PostgreSQL |

Per [serverless latency benchmarks](https://pilcrow.vercel.app/blog/serverless-database-latency):
- Neon + HTTP achieves sub-10ms latency
- PlanetScale HTTP/TCP performs equally well
- Supabase HTTP is slower due to auth middleware

### 2.4 Building a Unified Abstraction Layer

Based on [Effect SQL](https://deepwiki.com/Effect-TS/effect/6-data-management) and [TypeORM patterns](https://deepwiki.com/typeorm/typeorm/1-overview):

```typescript
// Core abstraction interface
interface DatabaseAdapter {
  // Connection lifecycle
  connect(config: ConnectionConfig): Promise<Connection>;
  disconnect(connection: Connection): Promise<void>;

  // Query execution
  query<T>(connection: Connection, sql: string, params?: any[]): Promise<QueryResult<T>>;
  stream<T>(connection: Connection, sql: string, params?: any[]): AsyncGenerator<T>;

  // Schema introspection
  getTables(connection: Connection): Promise<TableInfo[]>;
  getColumns(connection: Connection, table: string): Promise<ColumnInfo[]>;
  getRelationships(connection: Connection): Promise<Relationship[]>;

  // Database-specific
  getDialect(): SQLDialect;
  escapeIdentifier(name: string): string;
  escapeValue(value: any): string;
}

// Adapter registry
class AdapterRegistry {
  private adapters = new Map<DatabaseType, DatabaseAdapter>();

  register(type: DatabaseType, adapter: DatabaseAdapter) {
    this.adapters.set(type, adapter);
  }

  get(type: DatabaseType): DatabaseAdapter {
    const adapter = this.adapters.get(type);
    if (!adapter) throw new Error(`No adapter for ${type}`);
    return adapter;
  }
}

// Usage
const registry = new AdapterRegistry();
registry.register('postgresql', new PostgreSQLAdapter());
registry.register('mysql', new MySQLAdapter());
registry.register('mongodb', new MongoDBAdapter());
```

**Key abstraction challenges:**
1. **SQL dialects** - Different syntax for limits, string functions, JSON
2. **Type mapping** - Database types to JavaScript types
3. **Schema introspection** - Different system tables/views
4. **Transaction semantics** - ACID vs eventual consistency

---

## 3. Query Execution Architecture

### 3.1 Query Parsing and Validation

#### SQL Parser Libraries

Per [npm research](https://www.npmjs.com/package/node-sql-parser):

| Library | Features | Dialects |
|---------|----------|----------|
| **node-sql-parser** | AST, tableList, columnList | MySQL, PostgreSQL, MariaDB |
| **dt-sql-parser** | ANTLR4-based, validation, completion | BigData SQL variants |
| **pgsql-parser** | PostgreSQL-specific AST | PostgreSQL only |

```typescript
import { Parser } from 'node-sql-parser';

const parser = new Parser();

function validateQuery(sql: string, dialect: string): ValidationResult {
  try {
    const ast = parser.astify(sql, { database: dialect });

    return {
      valid: true,
      type: ast.type,  // 'select', 'insert', 'update', 'delete'
      tables: parser.tableList(sql, { database: dialect }),
      columns: parser.columnList(sql, { database: dialect }),
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
      position: error.location,
    };
  }
}

// Prevent dangerous operations
function isSafeQuery(sql: string): boolean {
  const ast = parser.astify(sql);
  const dangerousTypes = ['drop', 'truncate', 'alter'];
  return !dangerousTypes.includes(ast.type?.toLowerCase());
}
```

### 3.2 Result Set Streaming for Large Datasets

#### Cursor-Based Streaming

Using PostgreSQL cursors per [pg-cursor documentation](https://medium.com/@wahyaumau/how-to-stream-large-query-sets-using-pg-promise-pg-cursor-and-express-d7935014aefd):

```typescript
import Cursor from 'pg-cursor';

async function* streamResults(
  connection: PoolClient,
  sql: string,
  batchSize = 1000
): AsyncGenerator<Row[]> {
  const cursor = connection.query(new Cursor(sql));

  try {
    while (true) {
      const rows = await cursor.read(batchSize);
      if (rows.length === 0) break;
      yield rows;
    }
  } finally {
    await cursor.close();
  }
}

// Express endpoint with streaming
app.get('/api/query/stream', async (req, res) => {
  res.setHeader('Content-Type', 'application/x-ndjson');

  const connection = await pool.connect();
  try {
    for await (const batch of streamResults(connection, req.body.sql)) {
      for (const row of batch) {
        res.write(JSON.stringify(row) + '\n');
      }
    }
    res.end();
  } finally {
    connection.release();
  }
});
```

### 3.3 Pagination Strategies

#### Cursor-Based Pagination (Recommended)

Per [Bruno Scheufler's analysis](https://brunoscheufler.com/blog/2022-01-01-paginating-large-ordered-datasets-with-cursor-based-pagination), cursor pagination is **17x faster** than offset pagination for large datasets.

```typescript
interface CursorPagination {
  cursor?: string;  // Encoded (lastValue, lastId)
  limit: number;
}

interface PaginatedResult<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}

// Keyset pagination query
function buildKeysetQuery(
  table: string,
  orderBy: string,
  cursor?: DecodedCursor
): string {
  const baseQuery = `
    SELECT * FROM ${table}
    ${cursor ? `WHERE (${orderBy}, id) > ($1, $2)` : ''}
    ORDER BY ${orderBy} ASC, id ASC
    LIMIT $${cursor ? 3 : 1}
  `;
  return baseQuery;
}

// Create composite index for performance
// CREATE INDEX idx_table_cursor ON table(created_at DESC, id DESC);
```

#### When to Use Each Strategy

| Strategy | Use Case | Limitations |
|----------|----------|-------------|
| **Offset** | Admin panels, small datasets | O(n) performance, row skipping |
| **Cursor/Keyset** | APIs, infinite scroll, large data | No random page access |
| **Seek/Page tokens** | REST APIs with stable cursors | Requires encoding |

### 3.4 Query Cancellation

```typescript
class QueryManager {
  private runningQueries = new Map<string, RunningQuery>();

  async execute(
    connectionId: string,
    sql: string,
    signal?: AbortSignal
  ): Promise<QueryResult> {
    const queryId = generateId();
    const pid = await this.getBackendPid(connectionId);

    this.runningQueries.set(queryId, {
      connectionId,
      pid,
      startTime: new Date(),
      sql,
    });

    try {
      // Listen for abort signal
      if (signal) {
        signal.addEventListener('abort', () => this.cancel(queryId));
      }

      return await this.executeInternal(connectionId, sql);
    } finally {
      this.runningQueries.delete(queryId);
    }
  }

  async cancel(queryId: string): Promise<boolean> {
    const query = this.runningQueries.get(queryId);
    if (!query) return false;

    // Use separate admin connection to cancel
    return await this.adminPool.query(
      'SELECT pg_cancel_backend($1)',
      [query.pid]
    );
  }
}
```

### 3.5 Transaction Management in Web Context

#### Saga Pattern for Distributed Transactions

Per [Microsoft's Saga pattern documentation](https://learn.microsoft.com/en-us/azure/architecture/patterns/saga):

```typescript
interface SagaStep<T> {
  name: string;
  execute: (context: T) => Promise<T>;
  compensate: (context: T) => Promise<T>;
}

class SagaOrchestrator<T> {
  private steps: SagaStep<T>[] = [];

  addStep(step: SagaStep<T>): this {
    this.steps.push(step);
    return this;
  }

  async execute(initialContext: T): Promise<T> {
    const executedSteps: SagaStep<T>[] = [];
    let context = initialContext;

    try {
      for (const step of this.steps) {
        context = await step.execute(context);
        executedSteps.push(step);
      }
      return context;
    } catch (error) {
      // Compensate in reverse order
      for (const step of executedSteps.reverse()) {
        try {
          context = await step.compensate(context);
        } catch (compensateError) {
          console.error(`Compensation failed for ${step.name}`, compensateError);
        }
      }
      throw error;
    }
  }
}
```

#### Web-Friendly Transaction Patterns

For web applications, prefer:
1. **Short-lived transactions** - Complete within single request
2. **Optimistic concurrency** - Version columns, conflict detection
3. **Idempotent operations** - Safe to retry

---

## 4. Frontend Architecture

### 4.1 Data Grid Libraries Comparison

Based on [2025 comparison data](https://www.simple-table.com/blog/tanstack-table-vs-ag-grid-comparison):

| Feature | AG Grid | TanStack Table | Handsontable |
|---------|---------|----------------|--------------|
| **Bundle Size** | ~200KB+ | ~30KB (with UI) | ~300KB |
| **Best For** | 100K+ rows | <50K rows | Spreadsheet UX |
| **Virtualization** | Built-in | Requires addon | Built-in |
| **License** | Free/Enterprise | MIT | Free/Commercial |
| **Aggregation** | Fastest | ~2x slower | Limited |
| **Flexibility** | Configure | Full control | Spreadsheet-focused |

#### AG Grid for Enterprise

```typescript
import { AgGridReact } from 'ag-grid-react';

const columnDefs = [
  { field: 'id', sortable: true, filter: true },
  { field: 'name', editable: true },
  { field: 'created_at', filter: 'agDateColumnFilter' },
];

<AgGridReact
  columnDefs={columnDefs}
  rowModelType="serverSide"
  serverSideDataSource={dataSource}
  pagination={true}
  paginationPageSize={100}
  cacheBlockSize={100}
/>
```

#### TanStack Table for Flexibility

```typescript
import { useReactTable, getCoreRowModel } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
});

// Add virtualization for large datasets
const rowVirtualizer = useVirtualizer({
  count: rows.length,
  getScrollElement: () => tableContainerRef.current,
  estimateSize: () => 35,
  overscan: 10,
});
```

#### Handsontable for Spreadsheet UX

Per [Handsontable docs](https://handsontable.com/features):
- 400 built-in formulas via HyperFormula
- Excel-like editing experience
- Clipboard support, undo/redo
- Cell validation, conditional formatting

### 4.2 SQL Editor Options

#### Monaco Editor

Per [monaco-sql-languages](https://github.com/DTStack/monaco-sql-languages):

```typescript
import * as monaco from 'monaco-editor';
import { sql } from '@codemirror/lang-sql';

// Register SQL language with schema completion
monaco.languages.registerCompletionItemProvider('sql', {
  triggerCharacters: [' ', '.'],
  provideCompletionItems: (model, position) => {
    const word = model.getWordUntilPosition(position);
    const range = {
      startLineNumber: position.lineNumber,
      startColumn: word.startColumn,
      endLineNumber: position.lineNumber,
      endColumn: word.endColumn,
    };

    return {
      suggestions: [
        ...getKeywordSuggestions(range),
        ...getTableSuggestions(range, currentSchema),
        ...getColumnSuggestions(range, currentTable),
      ],
    };
  },
});
```

#### CodeMirror 6

Per [@codemirror/lang-sql](https://github.com/codemirror/lang-sql):

```typescript
import { EditorView, basicSetup } from 'codemirror';
import { sql, PostgreSQL } from '@codemirror/lang-sql';

const editor = new EditorView({
  parent: document.querySelector('#editor'),
  extensions: [
    basicSetup,
    sql({
      dialect: PostgreSQL,
      schema: {
        users: ['id', 'name', 'email', 'created_at'],
        orders: ['id', 'user_id', 'total', 'status'],
      },
    }),
  ],
});
```

### 4.3 Schema Visualization (ERD)

#### React Flow / xyflow

Per [React Flow documentation](https://reactflow.dev/ui/components/database-schema-node):

```typescript
import ReactFlow, { Node, Edge } from '@xyflow/react';
import { DatabaseSchemaNode } from './DatabaseSchemaNode';

const nodeTypes = { databaseSchema: DatabaseSchemaNode };

function ERDViewer({ schema }: { schema: DatabaseSchema }) {
  const nodes: Node[] = schema.tables.map((table, index) => ({
    id: table.name,
    type: 'databaseSchema',
    position: calculatePosition(index, schema.tables.length),
    data: {
      name: table.name,
      columns: table.columns,
    },
  }));

  const edges: Edge[] = schema.relationships.map((rel) => ({
    id: `${rel.from}-${rel.to}`,
    source: rel.fromTable,
    target: rel.toTable,
    sourceHandle: rel.fromColumn,
    targetHandle: rel.toColumn,
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed },
  }));

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
    />
  );
}
```

### 4.4 State Management

For complex database operations:

```typescript
// Zustand store for database state
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface DatabaseState {
  connections: Map<string, Connection>;
  activeConnection: string | null;
  queries: Map<string, Query>;
  results: Map<string, QueryResult>;

  // Actions
  connect: (config: ConnectionConfig) => Promise<string>;
  disconnect: (connectionId: string) => void;
  executeQuery: (connectionId: string, sql: string) => Promise<string>;
  cancelQuery: (queryId: string) => void;
}

const useDatabase = create<DatabaseState>()(
  immer((set, get) => ({
    connections: new Map(),
    activeConnection: null,
    queries: new Map(),
    results: new Map(),

    connect: async (config) => {
      const connectionId = await api.connect(config);
      set((state) => {
        state.connections.set(connectionId, { id: connectionId, config });
        state.activeConnection = connectionId;
      });
      return connectionId;
    },

    executeQuery: async (connectionId, sql) => {
      const queryId = generateId();
      set((state) => {
        state.queries.set(queryId, { id: queryId, sql, status: 'running' });
      });

      try {
        const result = await api.query(connectionId, sql);
        set((state) => {
          state.queries.get(queryId)!.status = 'completed';
          state.results.set(queryId, result);
        });
        return queryId;
      } catch (error) {
        set((state) => {
          state.queries.get(queryId)!.status = 'error';
          state.queries.get(queryId)!.error = error.message;
        });
        throw error;
      }
    },
  }))
);
```

---

## 5. Backend Architecture Options

### 5.1 Language Comparison: Node.js vs Go vs Rust

Based on [benchmark research](https://nDmitry.github.io/web-benchmarks):

| Aspect | Node.js | Go | Rust |
|--------|---------|-----|------|
| **Raw Performance** | 1x | 2.6x | 3x+ |
| **DB-Bound Perf** | Similar | Similar | Similar |
| **Concurrency Model** | Event loop | Goroutines | async/await + tokio |
| **Ecosystem** | Largest | Good | Growing |
| **Development Speed** | Fastest | Fast | Slowest |
| **Memory Usage** | High | Low | Lowest |

#### Recommendation by Use Case

- **Startup/MVP**: Node.js - Fastest development, shared frontend/backend types
- **Scale-out**: Go - Excellent concurrency, easy deployment
- **Maximum Performance**: Rust - Worth investment for high-throughput proxies

### 5.2 Serverless Considerations

Per [Prisma's serverless guide](https://www.prisma.io/blog/overcoming-challenges-in-serverless-and-edge-environments-TQtONA0RVxuW):

#### Cold Start Impact

| Platform | Cold Start | Warm Start |
|----------|------------|------------|
| AWS Lambda | 100ms-1s | <50ms |
| Edge Functions | <5ms | <5ms |
| Vercel Functions | 100-300ms | <50ms |

#### Connection Challenges

```
100 Lambda invocations = 100 database connections
1000 concurrent = exceeds connection limits
```

**Solutions:**

1. **Connection pooling services**
   - AWS RDS Proxy
   - PlanetScale serverless driver
   - Neon's HTTP endpoint

2. **HTTP-based connections**
   ```typescript
   // Neon serverless driver
   import { neon } from '@neondatabase/serverless';
   const sql = neon(process.env.DATABASE_URL);
   const result = await sql`SELECT * FROM users`;
   ```

3. **Limit concurrency**
   ```yaml
   # AWS SAM template
   Globals:
     Function:
       ReservedConcurrentExecutions: 10
   ```

### 5.3 Multi-Tenant Architecture

Per [Redis multi-tenant guide](https://redis.io/blog/data-isolation-multi-tenant-saas/):

#### Isolation Models

| Model | Description | Use Case |
|-------|-------------|----------|
| **Silo** | Database per tenant | Compliance (HIPAA, PCI-DSS) |
| **Bridge** | Schema per tenant | Medium isolation, easier backup |
| **Pool** | Shared schema + tenant_id | Cost-effective, simple onboarding |

```typescript
// Pool model with row-level security
interface TenantContext {
  tenantId: string;
  userId: string;
}

// PostgreSQL RLS
await client.query(`
  CREATE POLICY tenant_isolation ON orders
    USING (tenant_id = current_setting('app.current_tenant')::uuid)
`);

// Set context on each request
async function withTenant<T>(
  tenantId: string,
  fn: () => Promise<T>
): Promise<T> {
  await client.query(`SET LOCAL app.current_tenant = $1`, [tenantId]);
  return fn();
}
```

#### Tiered Multi-Tenancy

```typescript
// Free tier: Pool model
// Enterprise tier: Silo model
async function getConnection(tenant: Tenant): Promise<Connection> {
  if (tenant.tier === 'enterprise') {
    return getDedicatedConnection(tenant.databaseUrl);
  }
  return getPooledConnection(tenant.tenantId);
}
```

### 5.4 Caching Strategies

Per [Redis caching best practices](https://redis.io/blog/query-caching-redis/):

#### Cache-Aside Pattern

```typescript
async function getCachedQuery<T>(
  cacheKey: string,
  queryFn: () => Promise<T>,
  ttlSeconds = 60
): Promise<T> {
  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Execute query on cache miss
  const result = await queryFn();

  // Store in cache with TTL
  await redis.setex(cacheKey, ttlSeconds, JSON.stringify(result));

  return result;
}

// Generate cache key from query
function queryCacheKey(sql: string, params: any[]): string {
  const hash = crypto
    .createHash('sha256')
    .update(sql + JSON.stringify(params))
    .digest('hex');
  return `query:${hash}`;
}
```

#### Two-Level Caching

```typescript
class TwoLevelCache {
  private localCache = new LRUCache({ max: 1000 });
  private redis: Redis;

  async get<T>(key: string): Promise<T | null> {
    // L1: Local memory cache (fastest)
    const local = this.localCache.get(key);
    if (local) return local as T;

    // L2: Redis (distributed)
    const remote = await this.redis.get(key);
    if (remote) {
      const parsed = JSON.parse(remote);
      this.localCache.set(key, parsed);
      return parsed;
    }

    return null;
  }
}
```

---

## 6. Real-time Features

### 6.1 Live Query Results

```typescript
// WebSocket-based streaming
class QueryStreamHandler {
  private ws: WebSocket;
  private cursor: Cursor;

  async stream(sql: string): Promise<void> {
    this.cursor = await this.connection.query(new Cursor(sql));

    const streamBatch = async () => {
      const rows = await this.cursor.read(100);

      if (rows.length > 0) {
        this.ws.send(JSON.stringify({
          type: 'rows',
          data: rows,
          hasMore: rows.length === 100,
        }));

        // Continue streaming
        setImmediate(streamBatch);
      } else {
        this.ws.send(JSON.stringify({ type: 'complete' }));
        await this.cursor.close();
      }
    };

    streamBatch();
  }

  async cancel(): Promise<void> {
    await this.cursor?.close();
    this.ws.send(JSON.stringify({ type: 'cancelled' }));
  }
}
```

### 6.2 Collaborative Editing

Per [CRDT vs OT comparison](https://www.tiny.cloud/blog/real-time-collaboration-ot-vs-crdt/):

#### Yjs for SQL Editor Collaboration

```typescript
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { yCollab } from 'y-codemirror.next';

// Create shared document
const ydoc = new Y.Doc();
const ytext = ydoc.getText('sql');

// Connect to collaboration server
const provider = new WebsocketProvider(
  'wss://collab.example.com',
  'query-' + queryId,
  ydoc
);

// Integrate with CodeMirror
const editor = new EditorView({
  extensions: [
    basicSetup,
    sql({ dialect: PostgreSQL }),
    yCollab(ytext, provider.awareness),
  ],
});
```

### 6.3 Change Data Capture (CDC)

Per [Confluent CDC guide](https://www.confluent.io/learn/change-data-capture/):

```typescript
// Debezium + Kafka consumer for real-time updates
import { Kafka } from 'kafkajs';

const kafka = new Kafka({ brokers: ['localhost:9092'] });
const consumer = kafka.consumer({ groupId: 'db-visualizer' });

await consumer.subscribe({ topic: 'dbserver.public.users' });

await consumer.run({
  eachMessage: async ({ message }) => {
    const change = JSON.parse(message.value.toString());

    // Notify connected clients
    broadcastToSubscribers(change.payload.source.table, {
      operation: change.payload.op, // 'c' (create), 'u' (update), 'd' (delete)
      before: change.payload.before,
      after: change.payload.after,
    });
  },
});
```

### 6.4 Long Query Notifications

```typescript
class QueryNotificationService {
  private runningQueries = new Map<string, QueryInfo>();
  private notificationThresholdMs = 5000;

  async trackQuery(queryId: string, userId: string): Promise<void> {
    this.runningQueries.set(queryId, {
      userId,
      startTime: Date.now(),
    });

    // Check periodically
    const checkInterval = setInterval(async () => {
      const query = this.runningQueries.get(queryId);
      if (!query) {
        clearInterval(checkInterval);
        return;
      }

      const elapsed = Date.now() - query.startTime;
      if (elapsed > this.notificationThresholdMs && !query.notified) {
        await this.sendNotification(userId, {
          type: 'long_query',
          queryId,
          elapsed,
          message: 'Your query is still running...',
        });
        query.notified = true;
      }
    }, 1000);
  }

  async completeQuery(queryId: string, result: QueryResult): Promise<void> {
    const query = this.runningQueries.get(queryId);
    if (query?.notified) {
      await this.sendNotification(query.userId, {
        type: 'query_complete',
        queryId,
        rowCount: result.rowCount,
        duration: Date.now() - query.startTime,
      });
    }
    this.runningQueries.delete(queryId);
  }
}
```

---

## 7. Reference Implementations

### 7.1 DbGate

Per [DbGate GitHub](https://github.com/dbgate/dbgate):

**Architecture:**
- Electron + Svelte for desktop
- Single Docker container for web deployment
- Plugin system via Yeoman generator
- API on port 3000, web app on port 5001 (dev)

**Key Design Principles:**
- Platform independence
- One toolbar, heavy context menu usage
- Stable and robust - driver errors don't crash app

### 7.2 Beekeeper Studio

Per [Beekeeper Studio GitHub](https://github.com/beekeeper-studio/beekeeper-studio):

**Architecture:**
- Electron 39 + Vue.js
- Built on sqlectron-core libraries
- Monorepo structure (apps/studio, shared/src)
- TypeScript throughout

**Query Execution Flow:**
- TabQueryEditor -> Database Client (abstract) -> Database-specific implementation

### 7.3 pgAdmin 4

Per [pgAdmin documentation](https://www.pgadmin.org/docs/pgadmin4/development/code_overview.html):

**Architecture:**
- Python Flask backend
- ReactJS + HTML5 frontend
- psycopg2 for PostgreSQL communication
- Flask-Security for auth
- Modular Blueprint architecture
- Electron runtime for desktop

---

## 8. Recommended Architecture

### 8.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ SQL Editor  │  │  Data Grid  │  │ ERD Viewer  │              │
│  │ (Monaco/CM) │  │  (AG Grid)  │  │(React Flow) │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│  ┌──────┴────────────────┴────────────────┴──────┐              │
│  │              State Management (Zustand)        │              │
│  └──────────────────────┬────────────────────────┘              │
│                         │ WebSocket / HTTP                       │
└─────────────────────────┼───────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────────┐
│                      API GATEWAY                                 │
│  ┌──────────────────────┴────────────────────────┐              │
│  │              Load Balancer (nginx)             │              │
│  └──────────────────────┬────────────────────────┘              │
└─────────────────────────┼───────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────────┐
│                    BACKEND PROXY                                 │
│  ┌──────────────────────┴────────────────────────┐              │
│  │           Node.js / Go Service                 │              │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐         │              │
│  │  │ Query   │ │ Schema  │ │ Session │         │              │
│  │  │ Engine  │ │ Manager │ │ Manager │         │              │
│  │  └────┬────┘ └────┬────┘ └────┬────┘         │              │
│  │       └───────────┼───────────┘               │              │
│  │                   │                           │              │
│  │  ┌────────────────┴───────────────────┐      │              │
│  │  │      Database Adapter Layer         │      │              │
│  │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │      │              │
│  │  │  │ PG  │ │MySQL│ │Mongo│ │ ... │  │      │              │
│  │  │  └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘  │      │              │
│  │  └─────┼───────┼───────┼───────┼─────┘      │              │
│  └────────┼───────┼───────┼───────┼────────────┘              │
└───────────┼───────┼───────┼───────┼─────────────────────────────┘
            │       │       │       │
┌───────────┼───────┼───────┼───────┼─────────────────────────────┐
│           │  CONNECTION POOLING   │                              │
│  ┌────────▼──┐ ┌──▼────────┐      │                             │
│  │ PgBouncer │ │  ProxySQL │      │                             │
│  └─────┬─────┘ └─────┬─────┘      │                             │
│        │             │            │                             │
│  ┌─────▼─────┐ ┌─────▼─────┐ ┌────▼────┐ ┌─────────┐           │
│  │PostgreSQL │ │   MySQL   │ │ MongoDB │ │  Redis  │           │
│  └───────────┘ └───────────┘ └─────────┘ └─────────┘           │
│                     DATABASES                                    │
└──────────────────────────────────────────────────────────────────┘
```

### 8.2 Technology Stack Recommendations

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend Framework** | React 18+ | Ecosystem, hiring, stability |
| **SQL Editor** | Monaco Editor | VS Code integration, TypeScript |
| **Data Grid** | AG Grid Enterprise | Performance at scale, features |
| **ERD Visualization** | React Flow | Customizable, performant |
| **State Management** | Zustand | Simple, performant, TypeScript |
| **Backend Runtime** | Node.js 20+ | TypeScript sharing, ecosystem |
| **API Framework** | Fastify | Performance, schema validation |
| **WebSocket** | Socket.io / ws | Reliability, fallback support |
| **Connection Pooling** | PgBouncer (PG), ProxySQL (MySQL) | Industry standard |
| **Caching** | Redis | Query results, sessions |

### 8.3 Deployment Options

#### Docker Compose (Development/Small Scale)

```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports: ['3000:3000']

  backend:
    build: ./backend
    ports: ['8080:8080']
    environment:
      - REDIS_URL=redis://redis:6379

  redis:
    image: redis:7-alpine

  pgbouncer:
    image: bitnami/pgbouncer
    environment:
      - PGBOUNCER_DATABASE=*
      - POSTGRESQL_HOST=host.docker.internal
```

#### Kubernetes (Production)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: db-visualizer
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: backend
          resources:
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
```

---

## 9. Security Considerations

### 9.1 Credential Handling

```typescript
// Never log or expose credentials
interface SecureCredentials {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;  // Encrypted at rest
}

// Encrypt credentials before storage
async function storeCredentials(
  userId: string,
  credentials: SecureCredentials
): Promise<void> {
  const encryptedPassword = await encrypt(
    credentials.password,
    getUserKey(userId)
  );

  await db.credentials.upsert({
    userId,
    ...credentials,
    password: encryptedPassword,
  });
}

// Decrypt only when connecting
async function getCredentials(userId: string): Promise<SecureCredentials> {
  const stored = await db.credentials.findUnique({ where: { userId } });
  return {
    ...stored,
    password: await decrypt(stored.password, getUserKey(userId)),
  };
}
```

### 9.2 Query Injection Prevention

```typescript
// Always parameterize user input
function executeUserQuery(sql: string, params: any[]): Promise<Result> {
  // Parse and validate first
  const validated = validateQuery(sql);
  if (!validated.valid) {
    throw new Error(`Invalid query: ${validated.error}`);
  }

  // Check for dangerous operations
  if (validated.type === 'drop' || validated.type === 'truncate') {
    throw new Error('Destructive operations not allowed');
  }

  // Execute with parameterization
  return pool.query(sql, params);
}
```

### 9.3 Network Security

1. **TLS everywhere** - WSS for WebSockets, HTTPS for HTTP
2. **Network isolation** - Database in private subnet
3. **IP allowlisting** - Restrict database access to proxy IPs
4. **VPN/SSH tunneling** - For sensitive environments

---

## Summary

Building a web-based database visualization tool requires balancing security, performance, and developer experience. Key takeaways:

1. **Never expose databases directly to browsers** - Use a secure backend proxy
2. **Connection pooling is essential** - PgBouncer/ProxySQL prevent connection exhaustion
3. **WebSockets enable real-time features** - Streaming results, collaborative editing
4. **Cursor pagination scales** - 17x faster than offset for large datasets
5. **AG Grid for enterprise data volumes** - TanStack Table for customization
6. **Multi-tenant requires careful planning** - Choose isolation model based on compliance needs
7. **Study existing tools** - DbGate, Beekeeper Studio, pgAdmin provide proven patterns

---

## Sources

### Database Connectivity
- [PgBouncer Documentation](https://www.pgbouncer.org/)
- [pgDash PgBouncer Guide](https://pgdash.io/blog/pgbouncer-connection-pool.html)
- [ProxySQL](https://proxysql.com/)
- [Heroku WebSocket Security](https://devcenter.heroku.com/articles/websocket-security)
- [InfoQ WebSocket Proxy](https://www.infoq.com/articles/Web-Sockets-Proxy-Servers/)

### Cloud-Native Databases
- [Cloudflare Database Integrations](https://blog.cloudflare.com/announcing-database-integrations/)
- [Serverless Database Latency Benchmarks](https://pilcrow.vercel.app/blog/serverless-database-latency)
- [Prisma Serverless Guide](https://www.prisma.io/blog/overcoming-challenges-in-serverless-and-edge-environments-TQtONA0RVxuW)

### Frontend Libraries
- [AG Grid vs TanStack Table Comparison](https://www.simple-table.com/blog/tanstack-table-vs-ag-grid-comparison)
- [Monaco SQL Languages](https://github.com/DTStack/monaco-sql-languages)
- [@codemirror/lang-sql](https://github.com/codemirror/lang-sql)
- [React Flow Database Schema Node](https://reactflow.dev/ui/components/database-schema-node)
- [Handsontable Features](https://handsontable.com/features)

### Pagination & Query Execution
- [Cursor-Based Pagination](https://brunoscheufler.com/blog/2022-01-01-paginating-large-ordered-datasets-with-cursor-based-pagination)
- [Crunchy Data Statement Timeout](https://www.crunchydata.com/blog/control-runaway-postgres-queries-with-statement-timeout)
- [node-sql-parser](https://github.com/taozhi8833998/node-sql-parser)

### Caching & Real-time
- [Redis Query Caching](https://redis.io/blog/query-caching-redis/)
- [Confluent CDC Guide](https://www.confluent.io/learn/change-data-capture/)
- [CRDT vs OT Comparison](https://www.tiny.cloud/blog/real-time-collaboration-ot-vs-crdt/)

### Multi-tenancy & Architecture
- [Redis Multi-Tenant Guide](https://redis.io/blog/data-isolation-multi-tenant-saas/)
- [Microsoft Saga Pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/saga)
- [Microservices Saga Pattern](https://microservices.io/patterns/data/saga.html)

### Reference Implementations
- [DbGate GitHub](https://github.com/dbgate/dbgate)
- [Beekeeper Studio GitHub](https://github.com/beekeeper-studio/beekeeper-studio)
- [pgAdmin Documentation](https://www.pgadmin.org/docs/pgadmin4/development/code_overview.html)

### Performance Benchmarks
- [Node.js vs Go Benchmarks](https://github.com/nDmitry/web-benchmarks)
- [Edge Functions vs Serverless 2025](https://byteiota.com/edge-functions-vs-serverless-the-2025-performance-battle/)
