import type { NextRequest } from 'next/server';

import { createApiResponse, createErrorResponse, withAuth } from '@/lib/api-utils';
import { connectionSchema, type PaginationParams } from '@/schemas/connection.schema';
import { connectionServerService } from '@/server/services/connection.service';

// Valid sort fields for connections
const VALID_SORT_FIELDS = new Set(['name', 'type', 'createdAt', 'updatedAt']);
const VALID_SORT_ORDERS = new Set(['asc', 'desc']);

function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = Number.parseInt(searchParams.get('page') ?? '1', 10);
  const limit = Number.parseInt(searchParams.get('limit') ?? '10', 10);
  const search = searchParams.get('search');
  const sortByParam = searchParams.get('sortBy') ?? 'createdAt';
  const sortOrderParam = searchParams.get('sortOrder') ?? 'desc';

  // Validate and provide defaults
  const sortBy: 'name' | 'type' | 'createdAt' | 'updatedAt' = VALID_SORT_FIELDS.has(sortByParam)
    ? (sortByParam as 'name' | 'type' | 'createdAt' | 'updatedAt')
    : 'createdAt';

  const sortOrder: 'asc' | 'desc' = VALID_SORT_ORDERS.has(sortOrderParam)
    ? (sortOrderParam as 'asc' | 'desc')
    : 'desc';

  const params: PaginationParams = {
    page: Number.isNaN(page) ? 1 : page,
    limit: Number.isNaN(limit) ? 10 : limit,
    sortBy,
    sortOrder,
  };

  // Only add search if it exists
  if (search) {
    params.search = search;
  }

  return params;
}

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const { searchParams } = new URL(req.url);
  const params = parsePaginationParams(searchParams);
  const result = await connectionServerService.list(userId, params);
  return createApiResponse(result);
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
