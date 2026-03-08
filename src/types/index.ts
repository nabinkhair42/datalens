// Database connection types
export type DatabaseType = 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'mssql';

export interface DatabaseConnection {
  id: string;
  name: string;
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  ssl: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConnectionFormData {
  name: string;
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
}

// Query types
export interface QueryResult {
  columns: QueryColumn[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTime: number;
}

export interface QueryColumn {
  name: string;
  type: string;
  nullable: boolean;
}

export interface QueryHistoryItem {
  id: string;
  connectionId: string;
  query: string;
  executedAt: Date;
  executionTime: number;
  rowCount: number;
  success: boolean;
  error?: string;
}

// Schema types
export interface SchemaTable {
  name: string;
  schema: string;
  columns: SchemaColumn[];
  primaryKey?: string[];
  foreignKeys: ForeignKey[];
  indexes: SchemaIndex[];
}

export interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
}

export interface ForeignKey {
  name: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
}

export interface SchemaIndex {
  name: string;
  columns: string[];
  unique: boolean;
}

// User types
export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}
