'use client';

import { useQueryClient } from '@tanstack/react-query';
import { ChevronDownIcon, ChevronLeftIcon, TableIcon, TerminalSquareIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { memo, useCallback, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { DATABASE_TYPE_LABELS, QUERY_KEYS } from '@/config/constants';
import { useConnection, useConnections } from '@/hooks/use-connections';
import { cn } from '@/lib/utils';
import connectionService from '@/services/connection.service';
import queryService from '@/services/query.service';

interface WorkspaceHeaderProps {
  connectionId: string;
}

export const WorkspaceHeader = memo(function WorkspaceHeader({
  connectionId,
}: WorkspaceHeaderProps) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { data: connection, isLoading } = useConnection(connectionId);
  const { data: paginatedConnections } = useConnections();
  const connections = paginatedConnections?.data;
  const router = useRouter();

  const navigateTo = (href: string) => {
    router.push(href);
  };

  // Prefetch schema on hover — instant load when user switches connections
  const handleConnectionHover = useCallback(
    (connId: string) => {
      queryClient.prefetchQuery({
        queryKey: [...QUERY_KEYS.CONNECTION(connId), 'schema'],
        queryFn: () => connectionService.getSchema(connId),
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient],
  );

  // Prefetch saved queries + history when hovering SQL Editor tab
  const handleSqlTabHover = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.SAVED_QUERIES,
      queryFn: () => queryService.saved.list(),
      staleTime: 5 * 60 * 1000,
    });
    queryClient.prefetchQuery({
      queryKey: [...QUERY_KEYS.QUERY_HISTORY, { connectionId, limit: 20 }],
      queryFn: () => queryService.getHistory({ connectionId, limit: 20 }),
      staleTime: 30 * 1000,
    });
  }, [queryClient, connectionId]);

  // Move useMemo before early returns to follow Rules of Hooks
  const navItems = useMemo(
    () => [
      {
        label: 'Tables',
        href: `/workspace/${connectionId}/tables`,
        icon: TableIcon,
      },
      {
        label: 'SQL Editor',
        href: `/workspace/${connectionId}/sql`,
        icon: TerminalSquareIcon,
      },
    ],
    [connectionId],
  );

  if (isLoading) {
    return (
      <header className="flex h-12 shrink-0 items-center justify-between border-b bg-background px-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8" />
          <div className="flex items-center gap-2">
            <Skeleton />
            <Skeleton className="h-5 w-28" />
            <Skeleton />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
          <Skeleton className="size-8" />
        </div>
      </header>
    );
  }

  if (!connection) {
    return (
      <header className="flex h-12 shrink-0 items-center gap-4 border-b bg-background px-4">
        <Button variant="ghost">
          <Link href="/workspace">
            <ChevronLeftIcon />
            Back
          </Link>
        </Button>
        <span className="text-sm text-destructive">Connection not found</span>
      </header>
    );
  }

  const dbLabel =
    DATABASE_TYPE_LABELS[connection.type as keyof typeof DATABASE_TYPE_LABELS] ?? connection.type;

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-3">
        {/* Back to workspace */}
        <Button variant="ghost" size="icon-sm">
          <Link href="/workspace">
            <ChevronLeftIcon />
          </Link>
        </Button>

        {/* Connection Selector Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-1 hover:bg-muted">
            {connection.name}
            <ChevronDownIcon className="size-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {connections?.map((conn) => (
              <DropdownMenuItem key={conn.id} onMouseEnter={() => handleConnectionHover(conn.id)}>
                <Link
                  href={`/workspace/${conn.id}/tables`}
                  className={cn('flex w-full items-center gap-2')}
                >
                  <span className="flex-1 truncate">{conn.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {DATABASE_TYPE_LABELS[conn.type as keyof typeof DATABASE_TYPE_LABELS] ??
                      conn.type}
                  </Badge>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Badge variant="outline">{dbLabel}</Badge>
      </div>

      {/* Navigation Tabs */}
      <ButtonGroup aria-label="Workspace navigation">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const isSqlTab = item.label === 'SQL Editor';
          return (
            <Button
              key={item.href}
              variant={isActive ? 'default' : 'outline'}
              onClick={() => navigateTo(item.href)}
              onMouseEnter={isSqlTab ? handleSqlTabHover : undefined}
            >
              <item.icon />
              {item.label}
            </Button>
          );
        })}
      </ButtonGroup>
    </header>
  );
});
