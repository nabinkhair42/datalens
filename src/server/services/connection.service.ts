import { and, asc, count, desc, eq, ilike, or } from 'drizzle-orm';
import { LRUCache } from 'lru-cache';

import { db } from '@/db';
import { connections } from '@/db/schema';
import { generateId } from '@/lib/api-utils';
import { decrypt, encrypt } from '@/lib/encryption';
import type {
  Connection,
  ConnectionFormData,
  PaginatedConnections,
  PaginationParams,
} from '@/schemas/connection.schema';
import { type ConnectionConfig, createAdapter, getAdapter } from '@/server/db-adapters';

type ConnectionUpdateData = { [K in keyof ConnectionFormData]?: ConnectionFormData[K] | undefined };

// LRU cache for connection configs (2 min TTL)
const connectionConfigCache = new LRUCache<string, ConnectionConfig>({
  max: 100,
  ttl: 2 * 60 * 1000,
});

// Get cached connection config or fetch from database
export async function getCachedConnectionConfig(
  connectionId: string,
  userId: string,
): Promise<ConnectionConfig | null> {
  const cacheKey = `${connectionId}:${userId}`;

  const cached = connectionConfigCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const rows = await db
    .select()
    .from(connections)
    .where(and(eq(connections.id, connectionId), eq(connections.userId, userId)))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  const config: ConnectionConfig = {
    id: row.id,
    type: row.type as 'postgresql' | 'mysql' | 'sqlite',
    host: row.host,
    port: row.port,
    database: row.database,
    username: row.username,
    password: decrypt(row.encryptedPassword),
    ssl: row.ssl,
  };

  connectionConfigCache.set(cacheKey, config);
  return config;
}

// Invalidate cached connection config
export function invalidateConnectionCache(connectionId: string, userId: string): void {
  connectionConfigCache.delete(`${connectionId}:${userId}`);
}

// Invalidate all cached configs for a user
export function invalidateUserConnectionCache(userId: string): void {
  for (const key of connectionConfigCache.keys()) {
    if (key.endsWith(`:${userId}`)) {
      connectionConfigCache.delete(key);
    }
  }
}

const DIRECT_UPDATE_FIELDS = [
  'name',
  'type',
  'host',
  'port',
  'database',
  'username',
  'ssl',
  'sshEnabled',
  'sshHost',
  'sshPort',
  'sshUsername',
] as const;

function buildConnectionUpdateData(data: ConnectionUpdateData): Record<string, unknown> {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  for (const field of DIRECT_UPDATE_FIELDS) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  if (data['password'] !== undefined && data['password']) {
    updateData['encryptedPassword'] = encrypt(data['password']);
  }
  if (data['sshKey'] !== undefined) {
    updateData['encryptedSshKey'] = data['sshKey'] ? encrypt(data['sshKey']) : null;
  }

  return updateData;
}

function mapToConnection(
  row: typeof connections.$inferSelect,
  includePassword = false,
): Connection {
  const connection: Connection = {
    id: row.id,
    name: row.name,
    type: row.type,
    host: row.host,
    port: row.port,
    database: row.database,
    username: row.username,
    ssl: row.ssl,
    sshEnabled: row.sshEnabled,
    sshHost: row.sshHost,
    sshPort: row.sshPort,
    sshUsername: row.sshUsername,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };

  if (includePassword && row.encryptedPassword) {
    connection.password = decrypt(row.encryptedPassword);
  }

  return connection;
}

function getDecryptedCredentials(row: typeof connections.$inferSelect): {
  password: string;
  sshKey: string | null;
} {
  return {
    password: decrypt(row.encryptedPassword),
    sshKey: row.encryptedSshKey ? decrypt(row.encryptedSshKey) : null,
  };
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const SORT_FIELD_MAP = {
  name: connections.name,
  type: connections.type,
  createdAt: connections.createdAt,
  updatedAt: connections.updatedAt,
} as const;

export const connectionServerService = {
  // List connections with pagination and search
  async list(userId: string, params?: PaginationParams): Promise<PaginatedConnections> {
    const page = Math.max(DEFAULT_PAGE, params?.page ?? DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, params?.limit ?? DEFAULT_LIMIT));
    const offset = (page - 1) * limit;
    const search = params?.search?.trim() ?? '';
    const sortBy = params?.sortBy ?? 'createdAt';
    const sortOrder = params?.sortOrder ?? 'desc';

    const baseConditions = [eq(connections.userId, userId)];

    if (search) {
      const searchPattern = `%${search}%`;
      const searchCondition = or(
        ilike(connections.name, searchPattern),
        ilike(connections.host, searchPattern),
        ilike(connections.database, searchPattern),
      );
      if (searchCondition) {
        baseConditions.push(searchCondition);
      }
    }

    const whereCondition = and(...baseConditions);
    const sortField = SORT_FIELD_MAP[sortBy] ?? connections.createdAt;
    const orderByClause = sortOrder === 'asc' ? asc(sortField) : desc(sortField);

    // Parallel queries for data + count
    const [rows, totalResult] = await Promise.all([
      db
        .select()
        .from(connections)
        .where(whereCondition)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(connections).where(whereCondition),
    ]);

    const total = totalResult[0]?.count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: rows.map((row) => mapToConnection(row)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  },

  // List all connections without pagination
  async listAll(userId: string): Promise<Connection[]> {
    const rows = await db
      .select()
      .from(connections)
      .where(eq(connections.userId, userId))
      .orderBy(desc(connections.createdAt));

    return rows.map((row) => mapToConnection(row));
  },

  async get(id: string, userId: string, includePassword = false): Promise<Connection | null> {
    const rows = await db
      .select()
      .from(connections)
      .where(and(eq(connections.id, id), eq(connections.userId, userId)))
      .limit(1);

    const row = rows[0];
    if (!row) {
      return null;
    }

    return mapToConnection(row, includePassword);
  },

  async getWithCredentials(
    id: string,
    userId: string,
  ): Promise<(Connection & { password: string; sshKey: string | null }) | null> {
    const rows = await db
      .select()
      .from(connections)
      .where(and(eq(connections.id, id), eq(connections.userId, userId)))
      .limit(1);

    const row = rows[0];
    if (!row) {
      return null;
    }

    const credentials = getDecryptedCredentials(row);
    return {
      ...mapToConnection(row),
      ...credentials,
    };
  },

  async create(data: ConnectionFormData, userId: string): Promise<Connection> {
    const id = generateId();
    const now = new Date();

    const rows = await db
      .insert(connections)
      .values({
        id,
        name: data.name,
        type: data.type,
        host: data.host,
        port: data.port,
        database: data.database,
        username: data.username,
        encryptedPassword: encrypt(data.password),
        ssl: data.ssl,
        sshEnabled: data.sshEnabled,
        sshHost: data.sshHost,
        sshPort: data.sshPort,
        sshUsername: data.sshUsername,
        encryptedSshKey: data.sshKey ? encrypt(data.sshKey) : null,
        userId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!rows[0]) {
      throw new Error('Failed to create connection');
    }

    return mapToConnection(rows[0]);
  },

  async update(
    id: string,
    data: { [K in keyof ConnectionFormData]?: ConnectionFormData[K] | undefined },
    userId: string,
  ): Promise<Connection | null> {
    // Single UPDATE + RETURNING — no need for a separate SELECT first.
    // If the row doesn't exist or doesn't belong to this user, rows will be empty.
    const updateData = buildConnectionUpdateData(data);
    const rows = await db
      .update(connections)
      .set(updateData)
      .where(and(eq(connections.id, id), eq(connections.userId, userId)))
      .returning();

    const row = rows[0];
    if (!row) {
      return null;
    }

    invalidateConnectionCache(id, userId);
    return mapToConnection(row);
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(connections)
      .where(and(eq(connections.id, id), eq(connections.userId, userId)))
      .returning({ id: connections.id });

    if (result.length > 0) {
      invalidateConnectionCache(id, userId);
    }

    return result.length > 0;
  },

  async test(
    id: string,
    userId: string,
  ): Promise<{ success: boolean; latency?: number; version?: string; error?: string }> {
    // Use cached connection config instead of getWithCredentials (avoids extra DB query
    // when config is already in LRU cache from recent schema/query calls)
    const config = await getCachedConnectionConfig(id, userId);
    if (!config) {
      return { success: false, error: 'Connection not found' };
    }

    // Use cached adapter pool for saved connections — avoids creating a new pool.
    // testConnectionConfig creates + closes a fresh pool (correct for unsaved test configs).
    const startTime = Date.now();
    try {
      const adapter = await getAdapter(config);
      const versionResult = await adapter.executeQuery('SELECT version()');
      const latency = Date.now() - startTime;

      if (config.type === 'postgresql') {
        const versionString = versionResult.rows[0]?.['version'] as string | undefined;
        const version = this.extractPostgresVersion(versionString);
        return version ? { success: true, latency, version } : { success: true, latency };
      }

      return { success: true, latency };
    } catch (error) {
      return {
        success: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  },

  // Test connection config (combines test + version in single query for PostgreSQL)
  async testConnectionConfig(
    config: ConnectionConfig,
  ): Promise<{ success: boolean; latency?: number; version?: string; error?: string }> {
    const startTime = Date.now();

    if (config.type === 'postgresql') {
      return this.testPostgresConnection(config, startTime);
    }

    return this.testGenericConnection(config, startTime);
  },

  // PostgreSQL test with version in single round-trip
  async testPostgresConnection(
    config: ConnectionConfig,
    startTime: number,
  ): Promise<{ success: boolean; latency?: number; version?: string; error?: string }> {
    const adapter = createAdapter(config);

    try {
      const versionResult = await adapter.executeQuery('SELECT version()');
      const latency = Date.now() - startTime;
      await adapter.close();

      const versionString = versionResult.rows[0]?.['version'] as string | undefined;
      const version = this.extractPostgresVersion(versionString);

      return version ? { success: true, latency, version } : { success: true, latency };
    } catch (error) {
      await adapter.close();
      return {
        success: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  },

  // Extract PostgreSQL version from version() output
  extractPostgresVersion(versionString: string | undefined): string | undefined {
    if (!versionString) {
      return undefined;
    }
    const match = versionString.match(/PostgreSQL\s+(\d+\.\d+)/);
    return match?.[1] ?? versionString.split(' ')[1];
  },

  // Generic connection test for non-PostgreSQL databases
  async testGenericConnection(
    config: ConnectionConfig,
    startTime: number,
  ): Promise<{ success: boolean; latency?: number; error?: string }> {
    const adapter = createAdapter(config);

    try {
      const result = await adapter.testConnection();
      const latency = Date.now() - startTime;
      await adapter.close();

      if (!result.success) {
        return { success: false, latency, error: result.error ?? 'Connection failed' };
      }
      return { success: true, latency };
    } catch (error) {
      await adapter.close();
      return {
        success: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
