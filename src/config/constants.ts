// ============================================
// Application Constants
// ============================================

export const APP_NAME = 'DataLens';
export const APP_DESCRIPTION = 'The web-native, collaborative database IDE';

// ============================================
// Database Types
// ============================================

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

// ============================================
// Query Status
// ============================================

export const QUERY_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  SUCCESS: 'success',
  ERROR: 'error',
  CANCELLED: 'cancelled',
} as const;

export type QueryStatus = (typeof QUERY_STATUS)[keyof typeof QUERY_STATUS];

// ============================================
// Pagination
// ============================================

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100, 250],
  MAX_PAGE_SIZE: 1000,
} as const;

// ============================================
// Query Limits
// ============================================

export const QUERY_LIMITS = {
  MAX_QUERY_LENGTH: 100000,
  DEFAULT_TIMEOUT_MS: 30000,
  MAX_TIMEOUT_MS: 300000,
  MAX_RESULT_ROWS: 10000,
} as const;

// ============================================
// Connection Limits
// ============================================

export const CONNECTION_LIMITS = {
  MAX_CONNECTIONS_FREE: 2,
  MAX_CONNECTIONS_PRO: -1, // unlimited
  CONNECTION_TIMEOUT_MS: 10000,
} as const;

// ============================================
// Storage Keys
// ============================================

export const STORAGE_KEYS = {
  THEME: 'datalens-theme',
  SIDEBAR_COLLAPSED: 'datalens-sidebar-collapsed',
  RECENT_CONNECTIONS: 'datalens-recent-connections',
  EDITOR_SETTINGS: 'datalens-editor-settings',
  QUERY_HISTORY_LOCAL: 'datalens-query-history',
} as const;

// ============================================
// Query Keys for React Query
// ============================================

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

// ============================================
// Route Paths
// ============================================

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  CONNECTIONS: '/connections',
  CONNECTION: (id: string) => `/connections/${id}`,
  QUERY: '/query',
  HISTORY: '/history',
  SAVED_QUERIES: '/saved-queries',
  SETTINGS: '/settings',
} as const;
