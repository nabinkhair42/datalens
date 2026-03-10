'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { QUERY_KEYS, ROUTES } from '@/config/constants';
import { signOut, useSession as useBetterAuthSession } from '@/lib/auth-client';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null | undefined;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
  user: AuthUser;
}

export function useSession() {
  const { data, isPending, error } = useBetterAuthSession();

  // Memoize session transform — use the full data object as dependency
  // to satisfy the linter, but the transform only creates new Date objects.
  // With cookie cache enabled, `data` reference is stable between re-renders
  // so this won't cause unnecessary recomputation.
  const session = useMemo<AuthSession | null>(() => {
    if (!data?.session || !data?.user) {
      return null;
    }
    return {
      session: {
        id: data.session.id,
        userId: data.session.userId,
        expiresAt: new Date(data.session.expiresAt),
      },
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        image: data.user.image,
        emailVerified: data.user.emailVerified,
        createdAt: new Date(data.user.createdAt),
        updatedAt: new Date(data.user.updatedAt),
      },
    };
  }, [data]);

  return {
    data: session,
    isLoading: isPending,
    error,
  };
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await signOut();
    },
    onSuccess: () => {
      queryClient.setQueryData(QUERY_KEYS.USER_PROFILE, null);
      queryClient.clear();
      router.replace(ROUTES.LOGIN);
    },
  });
}
