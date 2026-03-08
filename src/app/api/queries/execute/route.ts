import type { NextRequest } from 'next/server';

import { createApiResponse, createErrorResponse, withAuth } from '@/lib/api-utils';
import { executeQuerySchema } from '@/schemas/query.schema';
import { queryServerService } from '@/server/services/query.service';

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const body = await req.json();
  const parsed = executeQuerySchema.safeParse(body);

  if (!parsed.success) {
    const errorMessage = parsed.error.issues[0]?.message ?? 'Validation failed';
    return createErrorResponse(errorMessage);
  }

  try {
    const result = await queryServerService.execute(parsed.data, userId);
    return createApiResponse(result);
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Query execution failed',
      500,
    );
  }
});
