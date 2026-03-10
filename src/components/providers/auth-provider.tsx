'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createContext, type ReactNode, useContext, useLayoutEffect, useMemo } from 'react';

import { type AuthSession, useSession } from '@/hooks/use-auth';

interface AuthContextType {
  session: AuthSession | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const PUBLIC_PATHS = ['/', '/login'] as const;
const AUTH_PAGES = ['/login'] as const;

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => (path === '/' ? pathname === '/' : pathname.startsWith(path)));
}

function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some((path) => pathname.startsWith(path));
}

/**
 * AuthProvider always renders children immediately — no blocking loader.
 *
 * This lets pages mount and start data fetching in parallel with the session check.
 * Pages use `useAuth()` to read loading/auth state and show their own skeletons.
 *
 * Redirects are handled via useLayoutEffect (fires before paint):
 * - Unauthenticated on protected route → /login
 * - Authenticated on /login → /workspace
 */
export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isLoading } = useSession();

  const isAuthenticated = !!session?.user;

  useLayoutEffect(() => {
    if (isLoading) {
      return;
    }

    // Unauthenticated on protected route → redirect to login
    if (!isAuthenticated && !isPublicPath(pathname)) {
      const callbackUrl = encodeURIComponent(pathname);
      router.replace(`/login?callbackUrl=${callbackUrl}`);
      return;
    }

    // Authenticated on auth page → redirect to workspace
    if (isAuthenticated && isAuthPage(pathname)) {
      const params = new URLSearchParams(window.location.search);
      const callbackUrl = params.get('callbackUrl') || '/workspace';
      router.replace(callbackUrl);
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      session,
      isLoading,
      isAuthenticated,
    }),
    [session, isLoading, isAuthenticated],
  );

  // Always render children — pages manage their own loading states.
  // This eliminates the waterfall: useSession() and useConnections() run in parallel.
  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
