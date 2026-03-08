import { createApiResponse, createErrorResponse, withAuth } from '@/lib/api-utils';
import { getAdapter } from '@/server/db-adapters';
import { getCachedConnectionConfig } from '@/server/services/connection.service';

export const GET = withAuth(async (_req, { params, userId }) => {
  const { id: connectionId } = await params;

  if (!connectionId) {
    return createErrorResponse('Connection ID is required', 400);
  }

  try {
    // server-cache-lru: Use cached connection config for faster lookups
    const config = await getCachedConnectionConfig(connectionId, userId);

    if (!config) {
      return createErrorResponse('Connection not found', 404);
    }

    // Get the database adapter and fetch schemas
    const adapter = await getAdapter(config);
    const schemas = await adapter.getSchemas();

    return createApiResponse(schemas);
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to fetch schema',
      500,
    );
  }
});
