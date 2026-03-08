import type { NextRequest } from 'next/server';

import { createApiResponse, createErrorResponse, withAuth } from '@/lib/api-utils';
import { connectionSchema } from '@/schemas/connection.schema';
import { connectionServerService } from '@/server/services/connection.service';

export const GET = withAuth(async (_req, { params, userId }) => {
  const { id } = await params;

  if (!id) {
    return createErrorResponse('Connection ID is required', 400);
  }

  // Include decrypted password for editing
  const connection = await connectionServerService.get(id, userId, true);

  if (!connection) {
    return createErrorResponse('Connection not found', 404);
  }

  return createApiResponse(connection);
});

export const PUT = withAuth(async (req: NextRequest, { params, userId }) => {
  const { id } = await params;

  if (!id) {
    return createErrorResponse('Connection ID is required', 400);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return createErrorResponse('Invalid JSON body', 400);
  }

  const parsed = connectionSchema.partial().safeParse(body);

  if (!parsed.success) {
    const errorMessage = parsed.error.issues[0]?.message ?? 'Validation failed';
    return createErrorResponse(errorMessage);
  }

  const connection = await connectionServerService.update(id, parsed.data, userId);

  if (!connection) {
    return createErrorResponse('Connection not found', 404);
  }

  return createApiResponse(connection);
});

export const DELETE = withAuth(async (_req, { params, userId }) => {
  const { id } = await params;

  if (!id) {
    return createErrorResponse('Connection ID is required', 400);
  }

  const success = await connectionServerService.delete(id, userId);

  if (!success) {
    return createErrorResponse('Connection not found', 404);
  }

  return createApiResponse({ success: true });
});
