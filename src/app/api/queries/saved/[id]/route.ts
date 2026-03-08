import type { NextRequest } from 'next/server';

import { createApiResponse, createErrorResponse, withAuth } from '@/lib/api-utils';
import { savedQuerySchema } from '@/schemas/query.schema';
import { queryServerService } from '@/server/services/query.service';

export const GET = withAuth(async (_req, { params, userId }) => {
  const { id } = await params;

  if (!id) {
    return createErrorResponse('Query ID is required', 400);
  }

  const query = await queryServerService.saved.get(id, userId);

  if (!query) {
    return createErrorResponse('Saved query not found', 404);
  }

  return createApiResponse(query);
});

export const PUT = withAuth(async (req: NextRequest, { params, userId }) => {
  const { id } = await params;

  if (!id) {
    return createErrorResponse('Query ID is required', 400);
  }

  const body = await req.json();
  const parsed = savedQuerySchema.partial().safeParse(body);

  if (!parsed.success) {
    const errorMessage = parsed.error.issues[0]?.message ?? 'Validation failed';
    return createErrorResponse(errorMessage);
  }

  const query = await queryServerService.saved.update(id, parsed.data, userId);

  if (!query) {
    return createErrorResponse('Saved query not found', 404);
  }

  return createApiResponse(query);
});

export const DELETE = withAuth(async (_req, { params, userId }) => {
  const { id } = await params;

  if (!id) {
    return createErrorResponse('Query ID is required', 400);
  }

  const success = await queryServerService.saved.delete(id, userId);

  if (!success) {
    return createErrorResponse('Saved query not found', 404);
  }

  return createApiResponse({ success: true });
});
