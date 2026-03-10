import { LRUCache } from 'lru-cache';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { cache } from 'react';

import { auth, type Session } from '@/lib/auth';

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

// server-cache-lru: Cache validated sessions for 2 minutes.
// On serverless Postgres (Neon), each session DB lookup costs ~5s on cold start.
// This cache eliminates that cost for repeated API calls within the same window.
const sessionCache = new LRUCache<string, Session>({
  max: 200,
  ttl: 2 * 60 * 1000, // 2 min — matches cookie cache maxAge
});

// Extract session token from cookies for cache key
function getSessionToken(req: NextRequest): string | null {
  return (
    req.cookies.get('better-auth.session_token')?.value ??
    req.cookies.get('__Secure-better-auth.session_token')?.value ??
    null
  );
}

// Per-request deduplication of session lookups
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
    // Check LRU cache first using session token — avoids 5s DB round-trip
    const token = getSessionToken(req);
    if (token) {
      const cached = sessionCache.get(token);
      if (cached?.user?.id) {
        return handler(req, { ...context, userId: cached.user.id });
      }
    }

    // Cache miss: validate session via Better Auth (hits DB)
    const session = await getSession();

    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Cache for subsequent API calls
    if (token) {
      sessionCache.set(token, session);
    }

    return handler(req, { ...context, userId: session.user.id });
  };
}

export function generateId(): string {
  return crypto.randomUUID();
}
