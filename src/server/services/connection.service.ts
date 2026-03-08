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
import { type ConnectionConfig, createAdapter } from '@/server/db-adapters';

type ConnectionUpdateData = { [K in keyof ConnectionFormData]?: ConnectionFormData[K] | undefined };

/**
 * server-cache-lru: Cross-request LRU cache for connection configs
 * Caches decrypted connection configs for 2 minutes to avoid repeated
 * database lookups and decryption for the same connection across requests
 */
const connectionConfigCache = new LRUCache<string, ConnectionConfig>({
  max: 100,
  ttl: 2 * 60 * 1000, // 2 minutes TTL
});

/**
 * Get cached connection config or fetch from database
 * Uses composite key: connectionId:userId for security isolation
 */
export async function getCachedConnectionConfig(
  connectionId: string,
  userId: string,
): Promise<ConnectionConfig | null> {
  const cacheKey = `${connectionId}:${userId}`;

  // Check cache first
  const cached = connectionConfigCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch from database
  const rows = await db
    .select()
    .from(connections)
    .where(and(eq(connections.id, connectionId), eq(connections.userId, userId)))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  // Build and cache the config
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

/**
 * Invalidate cached connection config (call after update/delete)
 */
export function invalidateConnectionCache(connectionId: string, userId: string): void {
  const cacheKey = `${connectionId}:${userId}`;
  connectionConfigCache.delete(cacheKey);
}

/**
 * Invalidate all cached configs for a user (call after bulk operations)
 */
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

  // Encrypt sensitive fields
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

// Internal function to get decrypted credentials (for actual DB connections)
function getDecryptedCredentials(row: typeof connections.$inferSelect): {
  password: string;
  sshKey: string | null;
} {
  return {
    password: decrypt(row.encryptedPassword),
    sshKey: row.encryptedSshKey ? decrypt(row.encryptedSshKey) : null,
  };
}

// Default pagination values - hoisted outside component (js-hoist-regexp pattern)
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

// Sort field mapping - hoisted for reuse
const SORT_FIELD_MAP = {
  name: connections.name,
  type: connections.type,
  createdAt: connections.createdAt,
  updatedAt: connections.updatedAt,
} as const;

export const connectionServerService = {
  /**
   * List connections with pagination and search support
   * Supports server-side filtering, sorting, and pagination
   */
  async list(userId: string, params?: PaginationParams): Promise<PaginatedConnections> {
    const page = Math.max(DEFAULT_PAGE, params?.page ?? DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, params?.limit ?? DEFAULT_LIMIT));
    const offset = (page - 1) * limit;
    const search = params?.search?.trim() ?? '';
    const sortBy = params?.sortBy ?? 'createdAt';
    const sortOrder = params?.sortOrder ?? 'desc';

    // Build base conditions
    const baseConditions = [eq(connections.userId, userId)];

    // Add search condition if provided
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

    // Get sort field
    const sortField = SORT_FIELD_MAP[sortBy] ?? connections.createdAt;
    const orderByClause = sortOrder === 'asc' ? asc(sortField) : desc(sortField);

    // Execute queries in parallel (async-parallel pattern)
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

  /**
   * List all connections without pagination (for backward compatibility)
   */
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

  // Get connection with decrypted credentials (for actual DB operations)
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
    const existing = await this.get(id, userId);
    if (!existing) {
      return null;
    }

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

    // Invalidate cached connection config after update
    invalidateConnectionCache(id, userId);

    return mapToConnection(row);
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(connections)
      .where(and(eq(connections.id, id), eq(connections.userId, userId)))
      .returning({ id: connections.id });

    // Invalidate cached connection config after delete
    if (result.length > 0) {
      invalidateConnectionCache(id, userId);
    }

    return result.length > 0;
  },

  async test(
    id: string,
    userId: string,
  ): Promise<{ success: boolean; latency?: number; version?: string; error?: string }> {
    const connection = await this.getWithCredentials(id, userId);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }

    return this.testConnectionConfig({
      id: connection.id,
      type: connection.type as 'postgresql' | 'mysql' | 'sqlite',
      host: connection.host,
      port: connection.port,
      database: connection.database,
      username: connection.username,
      password: connection.password,
      ssl: connection.ssl,
    });
  },

  /**
   * Test a connection configuration without saving it
   * Used for validating new connections before creation
   */
  async testConnectionConfig(
    config: ConnectionConfig,
  ): Promise<{ success: boolean; latency?: number; version?: string; error?: string }> {
    const startTime = Date.now();

    try {
      const adapter = createAdapter(config);
      const result = await adapter.testConnection();
      const latency = Date.now() - startTime;

      if (!result.success) {
        await adapter.close();
        return { success: false, latency, error: result.error ?? 'Connection failed' };
      }

      // Get database version for PostgreSQL
      let version: string | undefined;
      if (config.type === 'postgresql') {
        try {
          const versionResult = await adapter.executeQuery('SELECT version()');
          const versionString = versionResult.rows[0]?.['version'] as string | undefined;
          if (versionString) {
            // Extract just the version number (e.g., "PostgreSQL 15.4" -> "15.4")
            const match = versionString.match(/PostgreSQL\s+(\d+\.\d+)/);
            version = match?.[1] ?? versionString.split(' ')[1];
          }
        } catch {
          // Ignore version fetch errors
        }
      }

      await adapter.close();

      const response: { success: boolean; latency?: number; version?: string; error?: string } = {
        success: true,
        latency,
      };
      if (version) {
        response.version = version;
      }
      return response;
    } catch (error) {
      return {
        success: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
