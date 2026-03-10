import { and, desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { queryHistory, savedQueries } from '@/db/schema';
import { generateId } from '@/lib/api-utils';
import type {
  ExecuteQueryFormData,
  QueryHistoryItem,
  QueryResult,
  SavedQuery,
  SavedQueryFormData,
} from '@/schemas/query.schema';
import { getAdapter, QueryExecutionError } from '@/server/db-adapters';
import { getCachedConnectionConfig } from '@/server/services/connection.service';

// Blocked DDL keywords
const BLOCKED_KEYWORDS = ['DROP', 'TRUNCATE', 'ALTER', 'CREATE', 'GRANT', 'REVOKE'] as const;

// js-hoist-regexp: Pre-compile blocked keyword patterns to avoid re-creating per call
const BLOCKED_KEYWORD_START_PATTERNS = BLOCKED_KEYWORDS.map(
  (kw) => new RegExp(`^${kw}[\\s\\n\\t]`, 'i'),
);
const BLOCKED_KEYWORD_INLINE_PATTERNS = BLOCKED_KEYWORDS.map(
  (kw) => new RegExp(`(^|\\s|;)${kw}(\\s|;|$)`, 'i'),
);

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

// js-hoist-regexp: Pre-compiled delete pattern
const DELETE_PATTERN = /(\s|^|;)DELETE(\s|;|$)/i;

function validateQuery(query: string): { blocked: boolean; message?: string; warning?: string } {
  const trimmed = query.trim();

  for (let i = 0; i < BLOCKED_KEYWORDS.length; i++) {
    if (
      BLOCKED_KEYWORD_START_PATTERNS[i]?.test(trimmed) ||
      BLOCKED_KEYWORD_INLINE_PATTERNS[i]?.test(query)
    ) {
      return {
        blocked: true,
        message: `Query blocked: ${BLOCKED_KEYWORDS[i]} operations are not allowed for safety reasons`,
      };
    }
  }

  if (DELETE_PATTERN.test(query)) {
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

async function recordQueryHistory(params: {
  connectionId: string;
  userId: string;
  query: string;
  executionTime: number;
  rowCount: number;
  success: boolean;
  error: string | null;
}) {
  await db.insert(queryHistory).values({
    id: generateId(),
    connectionId: params.connectionId,
    userId: params.userId,
    query: params.query,
    executionTime: params.executionTime,
    rowCount: params.rowCount,
    success: params.success,
    error: params.error,
    executedAt: new Date(),
  });
}

function validateAndLogQuery(queryId: string, connectionId: string, query: string): void {
  const validation = validateQuery(query);

  if (validation.blocked) {
    queryLogger.blocked(queryId, connectionId, validation.message ?? 'Unknown reason');
    throw new Error(validation.message);
  }

  if (validation.warning) {
    console.log(
      JSON.stringify({
        level: 'warn',
        event: 'query_warning',
        queryId,
        connectionId,
        warning: validation.warning,
        timestamp: new Date().toISOString(),
      }),
    );
  }
}

function extractErrorDetails(
  error: unknown,
  startTime: number,
): { message: string; executionTime: number } {
  if (error instanceof QueryExecutionError) {
    return { message: error.message, executionTime: error.executionTime };
  }
  const message = error instanceof Error ? error.message : 'Query execution failed';
  return { message, executionTime: Date.now() - startTime };
}

export const queryServerService = {
  async execute(data: ExecuteQueryFormData, userId: string): Promise<QueryResult> {
    const queryId = generateId();
    const startTime = Date.now();

    const config = await getCachedConnectionConfig(data.connectionId, userId);

    if (!config) {
      throw new Error('Connection not found');
    }

    validateAndLogQuery(queryId, data.connectionId, data.query);
    queryLogger.start(queryId, data.connectionId, data.query);

    try {
      const adapter = await getAdapter(config);
      const result = await adapter.executeQuery(data.query);
      const executionTime = result.executionTime ?? 0;

      queryLogger.success(queryId, data.connectionId, executionTime, result.rowCount ?? 0);

      // server-after-nonblocking: Record history without blocking the response.
      // User sees results immediately; history insert happens in background.
      if (!data.skipHistory) {
        recordQueryHistory({
          connectionId: data.connectionId,
          userId,
          query: data.query,
          executionTime,
          rowCount: result.rowCount ?? 0,
          success: true,
          error: null,
        }).catch((err) => console.error('Failed to record query history:', err));
      }

      return result;
    } catch (error) {
      const { message, executionTime } = extractErrorDetails(error, startTime);
      queryLogger.failure(queryId, data.connectionId, executionTime, message);

      if (!data.skipHistory) {
        recordQueryHistory({
          connectionId: data.connectionId,
          userId,
          query: data.query,
          executionTime,
          rowCount: 0,
          success: false,
          error: message,
        }).catch((err) => console.error('Failed to record query history:', err));
      }

      throw new Error(message);
    }
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

    const conditions = [eq(queryHistory.userId, userId)];
    if (options?.connectionId) {
      conditions.push(eq(queryHistory.connectionId, options.connectionId));
    }

    const rows = await db
      .select()
      .from(queryHistory)
      .where(and(...conditions))
      .orderBy(desc(queryHistory.executedAt))
      .limit(limit);

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
      // Single UPDATE + RETURNING — no need for a separate SELECT first.
      // If the row doesn't exist or doesn't belong to this user, rows will be empty.
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
