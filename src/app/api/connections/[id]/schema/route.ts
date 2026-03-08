import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { connections } from '@/db/schema';
import { createApiResponse, createErrorResponse, withAuth } from '@/lib/api-utils';
import { decrypt } from '@/lib/encryption';
import { type ConnectionConfig, getAdapter } from '@/server/db-adapters';

export const GET = withAuth(async (_req, { params, userId }) => {
  const { id: connectionId } = await params;

  if (!connectionId) {
    return createErrorResponse('Connection ID is required', 400);
  }

  // Verify the user has access to this connection
  const [connection] = await db
    .select()
    .from(connections)
    .where(and(eq(connections.id, connectionId), eq(connections.userId, userId)))
    .limit(1);

  if (!connection) {
    return createErrorResponse('Connection not found', 404);
  }

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
