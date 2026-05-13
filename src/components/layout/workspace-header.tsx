'use client';

import { ArrowLeftIcon, PanelLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { memo, useCallback } from 'react';

import { useAuth } from '@/components/providers/auth-provider';
import { UserControl } from '@/components/shared/user-control';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DATABASE_TYPE_LABELS } from '@/config/constants';
import { useLogout } from '@/hooks/use-auth';
import { useConnection } from '@/hooks/use-connections';
import { cn } from '@/lib/utils';

interface WorkspaceHeaderProps {
  connectionId: string;
  onToggleSidebar?: () => void;
}

const DB_ACCENT: Record<string, string> = {
  postgresql: 'bg-sky-500',
  mysql: 'bg-orange-500',
  sqlite: 'bg-blue-500',
  mongodb: 'bg-emerald-500',
  mssql: 'bg-red-500',
};

export const WorkspaceHeader = memo(function WorkspaceHeader({
  connectionId,
  onToggleSidebar,
}: WorkspaceHeaderProps) {
  const { data: connection, isLoading } = useConnection(connectionId);
  const { session } = useAuth();
  const logoutMutation = useLogout();

  const handleLogout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  if (isLoading) {
    return (
      <header className="flex h-12 shrink-0 items-center justify-between border-b bg-background px-3">
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-3xl" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-5 w-20 rounded-3xl" />
        </div>
        <div className="flex items-center gap-1.5">
          <Skeleton className="size-8 rounded-3xl" />
          <Skeleton className="size-8 rounded-full" />
        </div>
      </header>
    );
  }

  if (!connection) {
    return (
      <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-background px-3">
        <Link href="/workspace">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeftIcon />
          </Button>
        </Link>
        <span className="text-sm text-destructive">Connection not found</span>
      </header>
    );
  }

  const dbLabel =
    DATABASE_TYPE_LABELS[connection.type as keyof typeof DATABASE_TYPE_LABELS] ?? connection.type;
  const accent = DB_ACCENT[connection.type] ?? 'bg-primary';

  return (
    <TooltipProvider>
      <header className="flex h-12 shrink-0 items-center justify-between border-b bg-background px-3">
        <div className="flex min-w-0 items-center gap-1.5">
          {onToggleSidebar && (
            <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={onToggleSidebar}>
              <PanelLeftIcon />
            </Button>
          )}

          <Tooltip>
            <TooltipTrigger
              render={
                <Link href="/workspace" aria-label="Back to connections">
                  <Button variant="ghost" size="icon-sm">
                    <ArrowLeftIcon />
                  </Button>
                </Link>
              }
            />
            <TooltipContent side="bottom">Back to connections</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="mx-1 h-5" />

          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                'relative flex size-2 shrink-0 items-center justify-center',
                'after:absolute after:inset-0 after:animate-ping after:rounded-full after:bg-current after:opacity-40',
              )}
              aria-hidden
            >
              <span className={cn('size-2 rounded-full', accent)} />
            </span>
            <span className="truncate text-sm font-medium" title={connection.name}>
              {connection.name}
            </span>
            <Badge
              variant="secondary"
              className="hidden h-5 gap-1.5 px-2 font-mono text-[11px] tracking-tight sm:inline-flex"
            >
              <span className={cn('size-1.5 rounded-full', accent)} aria-hidden />
              {dbLabel}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Separator orientation="vertical" className="mx-1 h-5" />
          {session?.user && (
            <UserControl
              user={session.user}
              onLogout={handleLogout}
              isLoggingOut={logoutMutation.isPending}
            />
          )}
        </div>
      </header>
    </TooltipProvider>
  );
});
