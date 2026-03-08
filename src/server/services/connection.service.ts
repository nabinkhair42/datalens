import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { connections } from '@/db/schema';
import { generateId } from '@/lib/api-utils';
import { decrypt, encrypt } from '@/lib/encryption';
import type { Connection, ConnectionFormData } from '@/schemas/connection.schema';
import { type ConnectionConfig, createAdapter } from '@/server/db-adapters';

type ConnectionUpdateData = { [K in keyof ConnectionFormData]?: ConnectionFormData[K] | undefined };

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

export const connectionServerService = {
  async list(userId: string): Promise<Connection[]> {
    const rows = await db
      .select()
      .from(connections)
      .where(eq(connections.userId, userId))
      .orderBy(connections.createdAt);

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

    return mapToConnection(row);
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(connections)
      .where(and(eq(connections.id, id), eq(connections.userId, userId)))
      .returning({ id: connections.id });

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
