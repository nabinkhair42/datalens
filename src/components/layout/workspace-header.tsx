'use client';

import { ChevronLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { memo, useCallback } from 'react';

import { useAuth } from '@/components/providers/auth-provider';
import { UserControl } from '@/components/shared/user-control';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { DATABASE_TYPE_LABELS } from '@/config/constants';
import { useLogout } from '@/hooks/use-auth';
import { useConnection } from '@/hooks/use-connections';

interface WorkspaceHeaderProps {
  connectionId: string;
}

export const WorkspaceHeader = memo(function WorkspaceHeader({
  connectionId,
}: WorkspaceHeaderProps) {
  const { data: connection, isLoading } = useConnection(connectionId);
  const { session } = useAuth();
  const logoutMutation = useLogout();

  const handleLogout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  if (isLoading) {
    return (
      <header className="flex h-11 shrink-0 items-center justify-between border-b bg-background px-3">
        <div className="flex items-center gap-2">
          <Skeleton className="size-7" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="size-7" />
          <Skeleton className="size-7 rounded-full" />
        </div>
      </header>
    );
  }

  if (!connection) {
    return (
      <header className="flex h-11 shrink-0 items-center gap-2 border-b bg-background px-3">
        <Link href="/workspace">
          <Button variant="ghost" size="icon-sm">
            <ChevronLeftIcon />
          </Button>
        </Link>
        <span className="text-sm text-destructive">Connection not found</span>
      </header>
    );
  }

  const dbLabel =
    DATABASE_TYPE_LABELS[connection.type as keyof typeof DATABASE_TYPE_LABELS] ?? connection.type;

  return (
    <header className="flex h-11 shrink-0 items-center justify-between border-b bg-background px-3">
      <div className="flex items-center gap-1.5">
        <Link href="/workspace">
          <Button variant="ghost" size="icon-sm" title="Back to connections">
            <ChevronLeftIcon />
          </Button>
        </Link>
        <span className="text-sm font-medium">{connection.name}</span>
        <span className="text-xs text-muted-foreground">&middot;</span>
        <span className="text-xs text-muted-foreground">{dbLabel}</span>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        {session?.user && (
          <UserControl
            user={session.user}
            onLogout={handleLogout}
            isLoggingOut={logoutMutation.isPending}
          />
        )}
      </div>
    </header>
  );
});
