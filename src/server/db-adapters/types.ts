import type { QueryResult } from '@/schemas/query.schema';

export interface ConnectionConfig {
  id: string;
  type: 'postgresql' | 'mysql' | 'sqlite';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean | undefined;
}

export interface SchemaInfo {
  name: string;
  tables: TableInfo[];
}

export interface TableInfo {
  name: string;
  schema: string;
  columns: ColumnInfo[];
  rowCount?: number | undefined;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey?: boolean | undefined;
  isForeignKey?: boolean | undefined;
  defaultValue?: string | undefined;
}

export interface DatabaseAdapter {
  /**
   * Test the database connection
   */
  testConnection(): Promise<{ success: boolean; error?: string | undefined }>;

  /**
   * Execute a SQL query and return results
   */
  executeQuery(query: string): Promise<QueryResult>;

  /**
   * Get schema information for the database
   */
  getSchemas(): Promise<SchemaInfo[]>;

  /**
   * Get table columns for a specific table
   */
  getTableColumns(schema: string, table: string): Promise<ColumnInfo[]>;

  /**
   * Close the connection
   */
  close(): Promise<void>;
}

export interface AdapterFactory {
  create(config: ConnectionConfig): DatabaseAdapter;
}
