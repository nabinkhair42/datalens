import type { NextRequest } from 'next/server';

import { createApiResponse, createErrorResponse, withAuth } from '@/lib/api-utils';
import { savedQuerySchema } from '@/schemas/query.schema';
import { queryServerService } from '@/server/services/query.service';

export const GET = withAuth(async (_req, { userId }) => {
  const queries = await queryServerService.saved.list(userId);
  return createApiResponse(queries);
});

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const body = await req.json();
  const parsed = savedQuerySchema.safeParse(body);

  if (!parsed.success) {
    const errorMessage = parsed.error.issues[0]?.message ?? 'Validation failed';
    return createErrorResponse(errorMessage);
  }

  const query = await queryServerService.saved.create(parsed.data, userId);
  return createApiResponse(query, 201);
});
