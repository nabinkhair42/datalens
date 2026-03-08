'use client';

import {
  ChevronDownIcon,
  ChevronLeftIcon,
  DatabaseIcon,
  TableIcon,
  TerminalSquareIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { memo, useMemo } from 'react';
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
import { DATABASE_TYPE_LABELS } from '@/config/constants';
import { useConnection, useConnections } from '@/hooks/use-connections';
import { cn } from '@/lib/utils';

interface WorkspaceHeaderProps {
  connectionId: string;
}

export const WorkspaceHeader = memo(function WorkspaceHeader({
  connectionId,
}: WorkspaceHeaderProps) {
  const pathname = usePathname();
  const { data: connection, isLoading } = useConnection(connectionId);
  const { data: connections } = useConnections();
  const router = useRouter();

  const navigateTo = (href: string) => {
    router.push(href);
  };

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
            <Skeleton className="size-4" />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="size-4" />
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
        <Button variant="ghost" size="sm" asChild>
          <Link href="/workspace">
            <ChevronLeftIcon className="size-4" />
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
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/workspace">
            <ChevronLeftIcon className="size-4" />
          </Link>
        </Button>

        {/* Connection Selector Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={
              'flex items-center justify-between hover:bg-accent px-2 rounded gap-2 font-medium'
            }
          >
            <DatabaseIcon className="size-4" />
            {connection.name}
            <ChevronDownIcon className="size-4 opacity-50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {connections?.map((conn) => (
              <DropdownMenuItem key={conn.id}>
                <Link
                  href={`/workspace/${conn.id}/tables`}
                  className={cn('flex w-full items-center gap-2')}
                >
                  <DatabaseIcon className="size-4" />
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

        <Badge variant="secondary">{dbLabel}</Badge>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2">
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <ButtonGroup key={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  onClick={() => navigateTo(item.href)}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Button>
              </ButtonGroup>
            );
          })}
        </nav>
      </div>
    </header>
  );
});
