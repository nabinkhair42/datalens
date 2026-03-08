import type { NextRequest } from 'next/server';

import { createApiResponse, withAuth } from '@/lib/api-utils';
import { queryServerService } from '@/server/services/query.service';

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const { searchParams } = new URL(req.url);
  const connectionIdParam = searchParams.get('connectionId');
  const limitParam = searchParams.get('limit');
  const cursorParam = searchParams.get('cursor');

  const history = await queryServerService.getHistory(userId, {
    connectionId: connectionIdParam ?? undefined,
    limit: limitParam ? parseInt(limitParam, 10) : undefined,
    cursor: cursorParam ?? undefined,
  });

  return createApiResponse(history);
});
