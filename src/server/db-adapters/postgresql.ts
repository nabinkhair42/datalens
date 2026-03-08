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
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
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
    const QUERY_TIMEOUT_MS = 30000;
    let client: pg.PoolClient | null = null;

    try {
      client = await this.pool.connect();

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Query timeout: execution exceeded 30 seconds'));
        }, QUERY_TIMEOUT_MS);
      });

      const result = await Promise.race([client.query(query), timeoutPromise]);
      const executionTime = Date.now() - startTime;

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

      if (message.includes('Query timeout')) {
        throw new QueryExecutionError(message, executionTime);
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
      const schemasResult = await client.query(`
        SELECT schema_name
        FROM information_schema.schemata
        WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
        ORDER BY schema_name
      `);

      const schemas: SchemaInfo[] = [];

      for (const row of schemasResult.rows) {
        const schemaName = row.schema_name as string;
        const tables = await this.getTablesForSchema(client, schemaName);
        schemas.push({
          name: schemaName,
          tables,
        });
      }

      return schemas;
    } finally {
      client.release();
    }
  }

  private async getTablesForSchema(client: pg.PoolClient, schema: string): Promise<TableInfo[]> {
    const tablesResult = await client.query(
      `
      SELECT
        t.table_name,
        (SELECT reltuples::bigint FROM pg_class WHERE oid = (quote_ident($1) || '.' || quote_ident(t.table_name))::regclass) as row_estimate
      FROM information_schema.tables t
      WHERE t.table_schema = $1
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name
    `,
      [schema],
    );

    const tables: TableInfo[] = [];

    for (const tableRow of tablesResult.rows) {
      const tableName = tableRow.table_name as string;
      const columns = await this.getColumnsForTable(client, schema, tableName);

      tables.push({
        name: tableName,
        schema,
        columns,
        rowCount: tableRow.row_estimate ? Number(tableRow.row_estimate) : undefined,
      });
    }

    return tables;
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
        (
          SELECT COUNT(*) > 0
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          WHERE tc.constraint_type = 'PRIMARY KEY'
            AND tc.table_schema = c.table_schema
            AND tc.table_name = c.table_name
            AND kcu.column_name = c.column_name
        ) as is_primary_key,
        (
          SELECT COUNT(*) > 0
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = c.table_schema
            AND tc.table_name = c.table_name
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
