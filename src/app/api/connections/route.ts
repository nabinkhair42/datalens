import type { NextRequest } from 'next/server';

import { createApiResponse, createErrorResponse, withAuth } from '@/lib/api-utils';
import { connectionSchema } from '@/schemas/connection.schema';
import { connectionServerService } from '@/server/services/connection.service';

export const GET = withAuth(async (_req, { userId }) => {
  const connections = await connectionServerService.list(userId);
  return createApiResponse(connections);
});

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return createErrorResponse('Invalid JSON body', 400);
  }

  const parsed = connectionSchema.safeParse(body);

  if (!parsed.success) {
    const errorMessage = parsed.error.issues[0]?.message ?? 'Validation failed';
    return createErrorResponse(errorMessage);
  }

  const connection = await connectionServerService.create(parsed.data, userId);
  return createApiResponse(connection, 201);
});
