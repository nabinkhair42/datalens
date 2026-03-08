export const API_ENDPOINTS = {
  // Auth endpoints (handled by Better Auth at /api/auth/*)
  AUTH: {
    SESSION: '/api/auth/session',
  },

  // Database connections endpoints
  CONNECTIONS: {
    LIST: '/connections',
    GET: (id: string) => `/connections/${id}`,
    CREATE: '/connections',
    UPDATE: (id: string) => `/connections/${id}`,
    DELETE: (id: string) => `/connections/${id}`,
    TEST: (id: string) => `/connections/${id}/test`,
    TEST_NEW: '/connections/test', // Test connection before saving
    SCHEMA: (id: string) => `/connections/${id}/schema`,
  },

  // Query endpoints
  QUERIES: {
    EXECUTE: '/queries/execute',
    HISTORY: '/queries/history',
    SAVED: {
      LIST: '/queries/saved',
      GET: (id: string) => `/queries/saved/${id}`,
      CREATE: '/queries/saved',
      UPDATE: (id: string) => `/queries/saved/${id}`,
      DELETE: (id: string) => `/queries/saved/${id}`,
    },
  },

  // Schema endpoints
  SCHEMA: {
    TABLES: (connectionId: string) => `/schema/${connectionId}/tables`,
    COLUMNS: (connectionId: string, tableName: string) =>
      `/schema/${connectionId}/tables/${tableName}/columns`,
    INDEXES: (connectionId: string, tableName: string) =>
      `/schema/${connectionId}/tables/${tableName}/indexes`,
    FOREIGN_KEYS: (connectionId: string, tableName: string) =>
      `/schema/${connectionId}/tables/${tableName}/foreign-keys`,
  },

  // User endpoints
  USER: {
    PROFILE: '/user/profile',
    UPDATE: '/user/profile',
    SETTINGS: '/user/settings',
  },
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;
