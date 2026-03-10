'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createContext, type ReactNode, useContext, useLayoutEffect, useMemo, useRef } from 'react';

import { PageLoader } from '@/components/loaders/spinner';
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

export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isLoading } = useSession();

  const isAuthenticated = !!session?.user;
  const isPublic = isPublicPath(pathname);
  const isAuth = isAuthPage(pathname);

  // Track if we're redirecting to prevent flash of wrong content
  const isRedirecting = useRef(false);

  // useLayoutEffect fires before paint — prevents flash of login page for authed users
  // and flash of protected page for unauthed users
  useLayoutEffect(() => {
    if (isLoading) {
      isRedirecting.current = false;
      return;
    }

    // Unauthenticated user on protected page → send to login
    if (!isAuthenticated && !isPublic) {
      isRedirecting.current = true;
      const callbackUrl = encodeURIComponent(pathname);
      router.replace(`/login?callbackUrl=${callbackUrl}`);
      return;
    }

    // Authenticated user on auth page → send to workspace
    // Read callbackUrl only when actually needed (avoids useSearchParams suspense)
    if (isAuthenticated && isAuth) {
      isRedirecting.current = true;
      const params = new URLSearchParams(window.location.search);
      const callbackUrl = params.get('callbackUrl') || '/workspace';
      router.replace(callbackUrl);
      return;
    }

    isRedirecting.current = false;
  }, [isAuthenticated, isLoading, pathname, isPublic, isAuth, router]);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      session,
      isLoading,
      isAuthenticated,
    }),
    [session, isLoading, isAuthenticated],
  );

  // Public pages render instantly — no auth gate
  if (isPublic) {
    // But if authed user is on an auth page (login), show loader while redirecting
    if (isAuth && isAuthenticated) {
      return <PageLoader />;
    }
    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
  }

  // Protected pages: show loader while checking auth or redirecting
  if (isLoading || isRedirecting.current) {
    return <PageLoader />;
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function ProtectedContent({ children }: { children: ReactNode }): React.ReactElement | null {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
