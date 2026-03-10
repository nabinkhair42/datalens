import { LRUCache } from 'lru-cache';

import { createApiResponse, createErrorResponse, withAuth } from '@/lib/api-utils';
import { getAdapter, type SchemaInfo } from '@/server/db-adapters';
import { getCachedConnectionConfig } from '@/server/services/connection.service';

// server-cache-lru: Cache schema results for 5 minutes to avoid repeated slow DB introspection
const schemaCache = new LRUCache<string, SchemaInfo[]>({
  max: 50,
  ttl: 5 * 60 * 1000,
});

export const GET = withAuth(async (_req, { params, userId }) => {
  const { id: connectionId } = await params;

  if (!connectionId) {
    return createErrorResponse('Connection ID is required', 400);
  }

  try {
    const cacheKey = `${connectionId}:${userId}`;
    const cached = schemaCache.get(cacheKey);
    if (cached) {
      return createApiResponse(cached);
    }

    // server-cache-lru: Use cached connection config for faster lookups
    const config = await getCachedConnectionConfig(connectionId, userId);

    if (!config) {
      return createErrorResponse('Connection not found', 404);
    }

    // Get the database adapter and fetch schemas
    const adapter = await getAdapter(config);
    const schemas = await adapter.getSchemas();

    schemaCache.set(cacheKey, schemas);

    return createApiResponse(schemas);
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to fetch schema',
      500,
    );
  }
});
