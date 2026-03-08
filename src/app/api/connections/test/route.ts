import type { NextRequest } from 'next/server';

import { createApiResponse, createErrorResponse, withAuth } from '@/lib/api-utils';
import { connectionSchema } from '@/schemas/connection.schema';
import { connectionServerService } from '@/server/services/connection.service';

/**
 * Test a database connection without saving it
 * POST /api/connections/test
 */
export const POST = withAuth(async (req: NextRequest) => {
  const body = await req.json();
  const parsed = connectionSchema.safeParse(body);

  if (!parsed.success) {
    const errorMessage = parsed.error.issues[0]?.message ?? 'Validation failed';
    return createErrorResponse(errorMessage);
  }

  const { type, host, port, database, username, password, ssl } = parsed.data;

  // Only PostgreSQL is currently supported
  if (type !== 'postgresql' && type !== 'mysql' && type !== 'sqlite') {
    return createErrorResponse(`Database type '${type}' is not yet supported`, 400);
  }

  const result = await connectionServerService.testConnectionConfig({
    id: 'test', // Temporary ID for testing
    type: type as 'postgresql' | 'mysql' | 'sqlite',
    host,
    port,
    database,
    username,
    password,
    ssl,
  });

  return createApiResponse(result);
});
