import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { cache } from 'react';

import { auth } from '@/lib/auth';

export interface AuthContext {
  params: Promise<Record<string, string>>;
  userId: string;
}

export function createApiResponse<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

export function createErrorResponse(
  message: string,
  status = 400,
): NextResponse<{ error: string }> {
  return NextResponse.json({ error: message }, { status });
}

/**
 * server-cache-react: Per-request deduplication of session lookups
 * Multiple calls to getSession within the same request will only
 * execute the auth check once, improving API route latency
 */
export const getSession = cache(async () => {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });
  return session;
});

export function withAuth(
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>,
) {
  return async (
    req: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ): Promise<NextResponse> => {
    const session = await getSession();

    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 401);
    }

    return handler(req, { ...context, userId: session.user.id });
  };
}

export function generateId(): string {
  return crypto.randomUUID();
}
