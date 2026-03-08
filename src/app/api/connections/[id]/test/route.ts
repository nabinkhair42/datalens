import { createApiResponse, createErrorResponse, withAuth } from '@/lib/api-utils';
import { connectionServerService } from '@/server/services/connection.service';

export const POST = withAuth(async (_req, { params, userId }) => {
  const { id } = await params;

  if (!id) {
    return createErrorResponse('Connection ID is required', 400);
  }

  const result = await connectionServerService.test(id, userId);
  return createApiResponse(result);
});
