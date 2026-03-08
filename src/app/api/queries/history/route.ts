import type { NextRequest } from 'next/server';

import { createApiResponse, createErrorResponse, withAuth } from '@/lib/api-utils';
import { queryServerService } from '@/server/services/query.service';

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const { searchParams } = new URL(req.url);
  const connectionIdParam = searchParams.get('connectionId');
  const limitParam = searchParams.get('limit');
  const cursorParam = searchParams.get('cursor');

  let limit: number | undefined;
  if (limitParam) {
    const parsedLimit = parseInt(limitParam, 10);
    if (Number.isNaN(parsedLimit)) {
      return createErrorResponse('Invalid limit parameter: must be a number', 400);
    }
    if (parsedLimit < 1 || parsedLimit > 100) {
      return createErrorResponse('Invalid limit parameter: must be between 1 and 100', 400);
    }
    limit = parsedLimit;
  } else {
    limit = 20;
  }

  const history = await queryServerService.getHistory(userId, {
    connectionId: connectionIdParam ?? undefined,
    limit,
    cursor: cursorParam ?? undefined,
  });

  return createApiResponse(history);
});
