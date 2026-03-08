'use client';

import {
  ChevronDownIcon,
  ChevronLeftIcon,
  DatabaseIcon,
  LoaderIcon,
  TableIcon,
  TerminalSquareIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { DATABASE_TYPE_LABELS } from '@/config/constants';
import { useConnection, useConnections } from '@/hooks/use-connections';
import { cn } from '@/lib/utils';

interface WorkspaceHeaderProps {
  connectionId: string;
}

export function WorkspaceHeader({ connectionId }: WorkspaceHeaderProps) {
  const pathname = usePathname();
  const { data: connection, isLoading } = useConnection(connectionId);
  const { data: connections } = useConnections();

  if (isLoading) {
    return (
      <header className="flex h-12 shrink-0 items-center justify-center border-b bg-background">
        <LoaderIcon className="size-5 animate-spin text-muted-foreground" />
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

  const navItems = [
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
  ];

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
          <DropdownMenuTrigger>
            <Button variant="ghost" className="gap-2 font-medium">
              <DatabaseIcon className="size-4" />
              {connection.name}
              <ChevronDownIcon className="size-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {connections?.map((conn) => (
              <DropdownMenuItem key={conn.id}>
                <Link
                  href={`/workspace/${conn.id}/tables`}
                  className={cn(
                    'flex w-full items-center gap-2',
                    conn.id === connectionId && 'bg-accent',
                  )}
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

        <span className="hidden text-sm text-muted-foreground sm:inline">
          {connection.host}:{connection.port}/{connection.database}
        </span>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2">
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Button key={item.href} variant={isActive ? 'secondary' : 'ghost'} size="sm" asChild>
                <Link href={item.href} className="flex items-center gap-2">
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
