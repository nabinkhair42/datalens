import { PostgreSQLAdapter } from './postgresql';
import type { ConnectionConfig, DatabaseAdapter } from './types';

export { QueryExecutionError } from './postgresql';
export type { ColumnInfo, ConnectionConfig, DatabaseAdapter, SchemaInfo, TableInfo } from './types';

/**
 * Creates a database adapter based on the connection type
 */
export function createAdapter(config: ConnectionConfig): DatabaseAdapter {
  switch (config.type) {
    case 'postgresql':
      return new PostgreSQLAdapter(config);
    case 'mysql':
      throw new Error('MySQL adapter is not yet implemented');
    case 'sqlite':
      throw new Error('SQLite adapter is not yet implemented');
    default:
      throw new Error(`Unsupported database type: ${config.type}`);
  }
}

// Connection pool cache to reuse connections
const adapterCache = new Map<string, DatabaseAdapter>();

/**
 * Gets or creates a database adapter for a connection
 * Caches adapters for reuse within the same process
 */
export async function getAdapter(config: ConnectionConfig): Promise<DatabaseAdapter> {
  const cacheKey = `${config.type}:${config.host}:${config.port}:${config.database}:${config.username}`;

  let adapter = adapterCache.get(cacheKey);
  if (!adapter) {
    adapter = createAdapter(config);
    adapterCache.set(cacheKey, adapter);
  }

  return adapter;
}

/**
 * Closes and removes a specific adapter from the cache
 */
export async function closeAdapter(config: ConnectionConfig): Promise<void> {
  const cacheKey = `${config.type}:${config.host}:${config.port}:${config.database}:${config.username}`;
  const adapter = adapterCache.get(cacheKey);

  if (adapter) {
    await adapter.close();
    adapterCache.delete(cacheKey);
  }
}

/**
 * Closes all cached adapters (for cleanup)
 */
export async function closeAllAdapters(): Promise<void> {
  const closePromises: Promise<void>[] = [];

  for (const adapter of adapterCache.values()) {
    closePromises.push(adapter.close());
  }

  await Promise.all(closePromises);
  adapterCache.clear();
}
