import { and, desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { connections, queryHistory, savedQueries } from '@/db/schema';
import { generateId } from '@/lib/api-utils';
import { decrypt } from '@/lib/encryption';
import type {
  ExecuteQueryFormData,
  QueryHistoryItem,
  QueryResult,
  SavedQuery,
  SavedQueryFormData,
} from '@/schemas/query.schema';
import { type ConnectionConfig, getAdapter, QueryExecutionError } from '@/server/db-adapters';

// Blocked DDL keywords that could modify database structure or permissions
const BLOCKED_KEYWORDS = ['DROP', 'TRUNCATE', 'ALTER', 'CREATE', 'GRANT', 'REVOKE'] as const;

// Logger utility for structured query logging
const queryLogger = {
  start: (queryId: string, connectionId: string, queryPreview: string) => {
    console.log(
      JSON.stringify({
        level: 'info',
        event: 'query_start',
        queryId,
        connectionId,
        queryPreview: queryPreview.substring(0, 100),
        timestamp: new Date().toISOString(),
      }),
    );
  },
  success: (queryId: string, connectionId: string, executionTime: number, rowCount: number) => {
    console.log(
      JSON.stringify({
        level: 'info',
        event: 'query_success',
        queryId,
        connectionId,
        executionTime,
        rowCount,
        timestamp: new Date().toISOString(),
      }),
    );
  },
  failure: (queryId: string, connectionId: string, executionTime: number, error: string) => {
    console.log(
      JSON.stringify({
        level: 'error',
        event: 'query_failure',
        queryId,
        connectionId,
        executionTime,
        error,
        timestamp: new Date().toISOString(),
      }),
    );
  },
  blocked: (queryId: string, connectionId: string, reason: string) => {
    console.log(
      JSON.stringify({
        level: 'warn',
        event: 'query_blocked',
        queryId,
        connectionId,
        reason,
        timestamp: new Date().toISOString(),
      }),
    );
  },
};

/**
 * Validates a query for dangerous DDL operations.
 * Returns an error message if the query is blocked, or a warning message for DELETE operations.
 */
function validateQuery(query: string): { blocked: boolean; message?: string; warning?: string } {
  const normalizedQuery = query.trim().toUpperCase();

  // Check if query starts with or contains blocked keywords as standalone words
  for (const keyword of BLOCKED_KEYWORDS) {
    // Check if query starts with the keyword
    if (
      normalizedQuery.startsWith(`${keyword} `) ||
      normalizedQuery.startsWith(`${keyword}\n`) ||
      normalizedQuery.startsWith(`${keyword}\t`)
    ) {
      return {
        blocked: true,
        message: `Query blocked: ${keyword} operations are not allowed for safety reasons`,
      };
    }

    // Check if the keyword appears as a standalone word (not part of another word)
    // Using word boundary pattern: space/newline/tab before and after
    const keywordPattern = new RegExp(`(^|\\s|;)${keyword}(\\s|;|$)`, 'i');
    if (keywordPattern.test(query)) {
      return {
        blocked: true,
        message: `Query blocked: ${keyword} operations are not allowed for safety reasons`,
      };
    }
  }

  // Check for DELETE operations - allow but with warning
  const deletePattern = /(\s|^|;)DELETE(\s|;|$)/i;
  if (deletePattern.test(query)) {
    return {
      blocked: false,
      warning: 'DELETE operation detected. Please ensure you have appropriate WHERE clauses.',
    };
  }

  return { blocked: false };
}

function mapToHistoryItem(row: typeof queryHistory.$inferSelect): QueryHistoryItem {
  return {
    id: row.id,
    connectionId: row.connectionId,
    query: row.query,
    executedAt: row.executedAt.toISOString(),
    executionTime: row.executionTime,
    rowCount: row.rowCount,
    success: row.success,
    error: row.error,
  };
}

function mapToSavedQuery(row: typeof savedQueries.$inferSelect): SavedQuery {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    query: row.query,
    connectionId: row.connectionId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const queryServerService = {
  async execute(data: ExecuteQueryFormData, userId: string): Promise<QueryResult> {
    const queryId = generateId();
    const startTime = Date.now();

    // Verify the user has access to this connection
    const [connection] = await db
      .select()
      .from(connections)
      .where(and(eq(connections.id, data.connectionId), eq(connections.userId, userId)))
      .limit(1);

    if (!connection) {
      throw new Error('Connection not found');
    }

    // Validate query for dangerous DDL operations
    const validation = validateQuery(data.query);
    if (validation.blocked) {
      queryLogger.blocked(queryId, data.connectionId, validation.message ?? 'Unknown reason');
      throw new Error(validation.message);
    }

    // Log warning for DELETE operations (but allow them)
    if (validation.warning) {
      console.log(
        JSON.stringify({
          level: 'warn',
          event: 'query_warning',
          queryId,
          connectionId: data.connectionId,
          warning: validation.warning,
          timestamp: new Date().toISOString(),
        }),
      );
    }

    // Log query start
    queryLogger.start(queryId, data.connectionId, data.query);

    let result: QueryResult;
    let success = true;
    let errorMessage: string | null = null;
    let executionTime = 0;

    try {
      // Build connection config with decrypted password
      const config: ConnectionConfig = {
        id: connection.id,
        type: connection.type as 'postgresql' | 'mysql' | 'sqlite',
        host: connection.host,
        port: connection.port,
        database: connection.database,
        username: connection.username,
        password: decrypt(connection.encryptedPassword),
        ssl: connection.ssl ?? false,
      };

      // Get the database adapter and execute query
      const adapter = await getAdapter(config);
      result = await adapter.executeQuery(data.query);
      executionTime = result.executionTime ?? 0;

      // Log success
      queryLogger.success(queryId, data.connectionId, executionTime, result.rowCount ?? 0);
    } catch (error) {
      success = false;
      if (error instanceof QueryExecutionError) {
        errorMessage = error.message;
        executionTime = error.executionTime;
      } else {
        errorMessage = error instanceof Error ? error.message : 'Query execution failed';
        executionTime = Date.now() - startTime;
      }

      // Log failure
      queryLogger.failure(queryId, data.connectionId, executionTime, errorMessage);

      // Re-throw to propagate error to client
      // Record in history first
      await db.insert(queryHistory).values({
        id: generateId(),
        connectionId: data.connectionId,
        userId,
        query: data.query,
        executionTime,
        rowCount: 0,
        success,
        error: errorMessage,
        executedAt: new Date(),
      });

      throw new Error(errorMessage);
    }

    // Record successful query in history
    await db.insert(queryHistory).values({
      id: generateId(),
      connectionId: data.connectionId,
      userId,
      query: data.query,
      executionTime,
      rowCount: result.rowCount ?? 0,
      success,
      error: errorMessage,
      executedAt: new Date(),
    });

    return result;
  },

  async getHistory(
    userId: string,
    options?: {
      connectionId?: string | undefined;
      limit?: number | undefined;
      cursor?: string | undefined;
    },
  ): Promise<QueryHistoryItem[]> {
    const limit = options?.limit ?? 50;

    let query = db
      .select()
      .from(queryHistory)
      .where(eq(queryHistory.userId, userId))
      .orderBy(desc(queryHistory.executedAt))
      .limit(limit);

    if (options?.connectionId) {
      query = db
        .select()
        .from(queryHistory)
        .where(
          and(eq(queryHistory.userId, userId), eq(queryHistory.connectionId, options.connectionId)),
        )
        .orderBy(desc(queryHistory.executedAt))
        .limit(limit);
    }

    const rows = await query;
    return rows.map(mapToHistoryItem);
  },

  saved: {
    async list(userId: string): Promise<SavedQuery[]> {
      const rows = await db
        .select()
        .from(savedQueries)
        .where(eq(savedQueries.userId, userId))
        .orderBy(desc(savedQueries.updatedAt));

      return rows.map(mapToSavedQuery);
    },

    async get(id: string, userId: string): Promise<SavedQuery | null> {
      const rows = await db
        .select()
        .from(savedQueries)
        .where(and(eq(savedQueries.id, id), eq(savedQueries.userId, userId)))
        .limit(1);

      const row = rows[0];
      if (!row) {
        return null;
      }

      return mapToSavedQuery(row);
    },

    async create(data: SavedQueryFormData, userId: string): Promise<SavedQuery> {
      const id = generateId();
      const now = new Date();

      const rows = await db
        .insert(savedQueries)
        .values({
          id,
          name: data.name,
          description: data.description,
          query: data.query,
          connectionId: data.connectionId,
          userId,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      if (!rows[0]) {
        throw new Error('Failed to create saved query');
      }

      return mapToSavedQuery(rows[0]);
    },

    async update(
      id: string,
      data: { [K in keyof SavedQueryFormData]?: SavedQueryFormData[K] | undefined },
      userId: string,
    ): Promise<SavedQuery | null> {
      const existing = await this.get(id, userId);
      if (!existing) {
        return null;
      }

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (data['name'] !== undefined) {
        updateData['name'] = data['name'];
      }
      if (data['description'] !== undefined) {
        updateData['description'] = data['description'];
      }
      if (data['query'] !== undefined) {
        updateData['query'] = data['query'];
      }
      if (data['connectionId'] !== undefined) {
        updateData['connectionId'] = data['connectionId'];
      }

      const rows = await db
        .update(savedQueries)
        .set(updateData)
        .where(and(eq(savedQueries.id, id), eq(savedQueries.userId, userId)))
        .returning();

      if (!rows[0]) {
        return null;
      }

      return mapToSavedQuery(rows[0]);
    },

    async delete(id: string, userId: string): Promise<boolean> {
      const result = await db
        .delete(savedQueries)
        .where(and(eq(savedQueries.id, id), eq(savedQueries.userId, userId)))
        .returning({ id: savedQueries.id });

      return result.length > 0;
    },
  },
};
