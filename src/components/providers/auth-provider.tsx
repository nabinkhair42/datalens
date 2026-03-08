'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createContext, type ReactNode, useContext, useEffect, useMemo } from 'react';

import { PageLoader } from '@/components/loaders/spinner';
import { type AuthSession, useSession } from '@/hooks/use-auth';

interface AuthContextType {
  session: AuthSession | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const PUBLIC_PATHS = ['/', '/login'] as const;

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => (path === '/' ? pathname === '/' : pathname.startsWith(path)));
}

export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, isLoading } = useSession();

  const isAuthenticated = !!session?.user;

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const isPublic = isPublicPath(pathname);

    if (!isAuthenticated && !isPublic) {
      const callbackUrl = encodeURIComponent(pathname);
      router.push(`/login?callbackUrl=${callbackUrl}`);
    }

    if (isAuthenticated && pathname === '/login') {
      const callbackUrl = searchParams.get('callbackUrl') || '/workspace';
      router.push(callbackUrl);
    }
  }, [isAuthenticated, isLoading, pathname, router, searchParams]);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      session,
      isLoading,
      isAuthenticated,
    }),
    [session, isLoading, isAuthenticated],
  );

  if (isLoading) {
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

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
