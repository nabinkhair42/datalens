'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

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

// Simplified: directly use better-auth session without redundant useQuery wrapper
export function useSession() {
  const { data, isPending, error } = useBetterAuthSession();

  // Transform to our AuthSession type
  const session: AuthSession | null =
    data?.session && data?.user
      ? {
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
        }
      : null;

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
      router.push(ROUTES.LOGIN);
    },
  });
}
