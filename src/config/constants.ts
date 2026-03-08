export const APP_NAME = 'DataLens | The web-native, collaborative database IDE';
export const APP_DESCRIPTION =
  'DataLens is a web-based database IDE designed for developers, data analysts, and teams. It provides a collaborative environment for managing database connections, writing and executing SQL queries, and visualizing results. With support for multiple database types and a focus on user experience, DataLens aims to streamline database workflows and enhance productivity.';

export const DATABASE_TYPES = {
  POSTGRESQL: 'postgresql',
  MYSQL: 'mysql',
  SQLITE: 'sqlite',
  MONGODB: 'mongodb',
  MSSQL: 'mssql',
} as const;

export type DatabaseType = (typeof DATABASE_TYPES)[keyof typeof DATABASE_TYPES];

export const DATABASE_TYPE_LABELS: Record<DatabaseType, string> = {
  postgresql: 'PostgreSQL',
  mysql: 'MySQL',
  sqlite: 'SQLite',
  mongodb: 'MongoDB',
  mssql: 'SQL Server',
};

export const DEFAULT_PORTS: Record<DatabaseType, number> = {
  postgresql: 5432,
  mysql: 3306,
  sqlite: 0,
  mongodb: 27017,
  mssql: 1433,
};

export const QUERY_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  SUCCESS: 'success',
  ERROR: 'error',
  CANCELLED: 'cancelled',
} as const;

export type QueryStatus = (typeof QUERY_STATUS)[keyof typeof QUERY_STATUS];

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100, 250],
  MAX_PAGE_SIZE: 1000,
} as const;

export const QUERY_LIMITS = {
  MAX_QUERY_LENGTH: 100000,
  DEFAULT_TIMEOUT_MS: 30000,
  MAX_TIMEOUT_MS: 300000,
  MAX_RESULT_ROWS: 10000,
} as const;

export const CONNECTION_LIMITS = {
  MAX_CONNECTIONS_FREE: 2,
  MAX_CONNECTIONS_PRO: -1, // unlimited
  CONNECTION_TIMEOUT_MS: 10000,
} as const;

export const STORAGE_KEYS = {
  THEME: 'datalens-theme',
  SIDEBAR_COLLAPSED: 'datalens-sidebar-collapsed',
  RECENT_CONNECTIONS: 'datalens-recent-connections',
  EDITOR_SETTINGS: 'datalens-editor-settings',
  QUERY_HISTORY_LOCAL: 'datalens-query-history',
} as const;

export const QUERY_KEYS = {
  CONNECTIONS: ['connections'] as const,
  CONNECTION: (id: string) => ['connections', id] as const,
  QUERY_HISTORY: ['query-history'] as const,
  SAVED_QUERIES: ['saved-queries'] as const,
  SCHEMA_TABLES: (connectionId: string) => ['schema', connectionId, 'tables'] as const,
  SCHEMA_COLUMNS: (connectionId: string, tableName: string) =>
    ['schema', connectionId, 'columns', tableName] as const,
  USER_PROFILE: ['user', 'profile'] as const,
  USER_SETTINGS: ['user', 'settings'] as const,
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  CONNECTIONS: '/connections',
  CONNECTION: (id: string) => `/connections/${id}`,
  QUERY: '/query',
  HISTORY: '/history',
  SAVED_QUERIES: '/saved-queries',
  SETTINGS: '/settings',
} as const;
