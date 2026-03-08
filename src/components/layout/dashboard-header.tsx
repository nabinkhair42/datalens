'use client';

import { DatabaseIcon } from 'lucide-react';
import Link from 'next/link';
import { memo, useCallback } from 'react';

import { useAuth } from '@/components/providers/auth-provider';
import { UserControl } from '@/components/shared/user-control';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useLogout } from '@/hooks/use-auth';

export const DashboardHeader = memo(function DashboardHeader() {
  const { session } = useAuth();
  const logoutMutation = useLogout();

  const handleLogout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/workspace" className="flex items-center gap-2">
          <DatabaseIcon className="size-5" />
          <span className="text-lg font-semibold">DataLens</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session?.user && (
            <UserControl
              user={session.user}
              onLogout={handleLogout}
              isLoggingOut={logoutMutation.isPending}
            />
          )}
        </div>
      </div>
    </header>
  );
});
