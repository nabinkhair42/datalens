import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';

export async function getSession(): Promise<Awaited<ReturnType<typeof auth.api.getSession>>> {
  const headersList = await headers();
  return auth.api.getSession({
    headers: headersList,
  });
}

export async function requireAuth(): Promise<
  NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>
> {
  const session = await getSession();

  if (!session?.user) {
    redirect('/login');
  }

  return session;
}

export async function getCurrentUser(): Promise<
  NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>['user'] | null
> {
  const session = await getSession();
  return session?.user ?? null;
}
