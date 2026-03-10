import pg from 'pg';

import type { QueryColumn, QueryResult } from '@/schemas/query.schema';

import type { ColumnInfo, ConnectionConfig, DatabaseAdapter, SchemaInfo, TableInfo } from './types';

const { Pool } = pg;

export class PostgreSQLAdapter implements DatabaseAdapter {
  private pool: pg.Pool;

  constructor(config: ConnectionConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: 5,
      idleTimeoutMillis: 60000, // 60s — keep connections warm to avoid Neon cold-start latency
      connectionTimeoutMillis: 10000,
    });
  }

  async testConnection(): Promise<{ success: boolean; error?: string | undefined }> {
    let client: pg.PoolClient | null = null;
    try {
      client = await this.pool.connect();
      await client.query('SELECT 1');
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection failed';
      return { success: false, error: message };
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  async executeQuery(query: string): Promise<QueryResult> {
    const startTime = Date.now();
    let client: pg.PoolClient | null = null;

    try {
      client = await this.pool.connect();

      // Use PostgreSQL's native statement_timeout instead of JS Promise.race.
      // This is cleaner (no timer leak), cancels the query server-side, and
      // measures only query execution time, not pool connection wait.
      await client.query('SET statement_timeout = 30000');
      const queryStart = Date.now();
      const result = await client.query(query);
      const executionTime = Date.now() - queryStart;

      const columns: QueryColumn[] = result.fields.map((field) => ({
        name: field.name,
        type: this.mapPostgresType(field.dataTypeID),
        nullable: true,
      }));

      return {
        columns,
        rows: result.rows as Record<string, unknown>[],
        rowCount: result.rowCount ?? 0,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'Query execution failed';

      // PostgreSQL returns "canceling statement due to statement timeout" on timeout
      if (message.includes('statement timeout')) {
        throw new QueryExecutionError(
          'Query timeout: execution exceeded 30 seconds',
          executionTime,
        );
      }

      throw new QueryExecutionError(message, executionTime);
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  async getSchemas(): Promise<SchemaInfo[]> {
    const client = await this.pool.connect();

    try {
      // Single query fetches ALL schemas, tables, columns, and key info in one round-trip.
      // This eliminates the N+1 waterfall (was: 1 query per schema + 1 per table + 1 per column set).
      const result = await client.query(`
        SELECT
          t.table_schema,
          t.table_name,
          pc.reltuples::bigint AS row_estimate,
          c.column_name,
          c.data_type,
          c.is_nullable,
          c.column_default,
          c.ordinal_position,
          EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'PRIMARY KEY'
              AND tc.table_schema = t.table_schema AND tc.table_name = t.table_name
              AND kcu.column_name = c.column_name
          ) AS is_primary_key,
          EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND tc.table_schema = t.table_schema AND tc.table_name = t.table_name
              AND kcu.column_name = c.column_name
          ) AS is_foreign_key
        FROM information_schema.tables t
        JOIN information_schema.columns c
          ON c.table_schema = t.table_schema AND c.table_name = t.table_name
        LEFT JOIN pg_class pc
          ON pc.oid = (quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))::regclass
        WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
          AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_schema, t.table_name, c.ordinal_position
      `);

      // Assemble flat rows into nested SchemaInfo[] structure
      const schemaMap = new Map<
        string,
        Map<string, { rowCount: number | undefined; columns: ColumnInfo[] }>
      >();

      for (const row of result.rows) {
        const schemaName = row.table_schema as string;
        const tableName = row.table_name as string;

        let tableMap = schemaMap.get(schemaName);
        if (!tableMap) {
          tableMap = new Map();
          schemaMap.set(schemaName, tableMap);
        }

        let tableEntry = tableMap.get(tableName);
        if (!tableEntry) {
          tableEntry = {
            rowCount: row.row_estimate != null ? Number(row.row_estimate) : undefined,
            columns: [],
          };
          tableMap.set(tableName, tableEntry);
        }

        tableEntry.columns.push({
          name: row.column_name as string,
          type: row.data_type as string,
          nullable: row.is_nullable === 'YES',
          isPrimaryKey: row.is_primary_key as boolean,
          isForeignKey: row.is_foreign_key as boolean,
          defaultValue: row.column_default as string | undefined,
        });
      }

      const schemas: SchemaInfo[] = [];
      for (const [schemaName, tableMap] of schemaMap) {
        const tables: TableInfo[] = [];
        for (const [tableName, entry] of tableMap) {
          tables.push({
            name: tableName,
            schema: schemaName,
            columns: entry.columns,
            rowCount: entry.rowCount,
          });
        }
        schemas.push({ name: schemaName, tables });
      }

      return schemas;
    } finally {
      client.release();
    }
  }

  private async getColumnsForTable(
    client: pg.PoolClient,
    schema: string,
    table: string,
  ): Promise<ColumnInfo[]> {
    const columnsResult = await client.query(
      `
      SELECT
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        EXISTS (
          SELECT 1 FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
          WHERE tc.constraint_type = 'PRIMARY KEY'
            AND tc.table_schema = c.table_schema AND tc.table_name = c.table_name
            AND kcu.column_name = c.column_name
        ) as is_primary_key,
        EXISTS (
          SELECT 1 FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = c.table_schema AND tc.table_name = c.table_name
            AND kcu.column_name = c.column_name
        ) as is_foreign_key
      FROM information_schema.columns c
      WHERE c.table_schema = $1 AND c.table_name = $2
      ORDER BY c.ordinal_position
    `,
      [schema, table],
    );

    return columnsResult.rows.map((row) => ({
      name: row.column_name as string,
      type: row.data_type as string,
      nullable: row.is_nullable === 'YES',
      isPrimaryKey: row.is_primary_key as boolean,
      isForeignKey: row.is_foreign_key as boolean,
      defaultValue: row.column_default as string | undefined,
    }));
  }

  async getTableColumns(schema: string, table: string): Promise<ColumnInfo[]> {
    const client = await this.pool.connect();
    try {
      return await this.getColumnsForTable(client, schema, table);
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  private mapPostgresType(oid: number): string {
    const typeMap: Record<number, string> = {
      16: 'boolean',
      17: 'bytea',
      20: 'bigint',
      21: 'smallint',
      23: 'integer',
      25: 'text',
      114: 'json',
      142: 'xml',
      700: 'real',
      701: 'double precision',
      1042: 'char',
      1043: 'varchar',
      1082: 'date',
      1083: 'time',
      1114: 'timestamp',
      1184: 'timestamptz',
      1186: 'interval',
      1700: 'numeric',
      2950: 'uuid',
      3802: 'jsonb',
    };

    return typeMap[oid] ?? `unknown(${oid})`;
  }
}

export class QueryExecutionError extends Error {
  public executionTime: number;

  constructor(message: string, executionTime: number) {
    super(message);
    this.name = 'QueryExecutionError';
    this.executionTime = executionTime;
  }
}
