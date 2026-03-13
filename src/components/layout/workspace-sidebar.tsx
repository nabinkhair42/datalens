'use client';

import { useQueryClient } from '@tanstack/react-query';
import { TableIcon, TerminalSquareIcon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { memo, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { QUERY_KEYS } from '@/config/constants';
import queryService from '@/services/query.service';

interface WorkspaceSidebarProps {
  connectionId: string;
  children: React.ReactNode;
}

export const WorkspaceSidebar = memo(function WorkspaceSidebar({
  connectionId,
  children,
}: WorkspaceSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const isTablesActive = pathname.includes('/tables');
  const isSqlActive = pathname.includes('/sql');

  const handleSqlHover = useCallback(() => {
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

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r">
      {/* Mode Switcher */}
      <div className="shrink-0 border-b p-2">
        <ButtonGroup className="w-full">
          <Button
            variant={isTablesActive ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => router.push(`/workspace/${connectionId}/tables`)}
          >
            <TableIcon />
            Tables
          </Button>
          <Button
            variant={isSqlActive ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => router.push(`/workspace/${connectionId}/sql`)}
            onMouseEnter={handleSqlHover}
          >
            <TerminalSquareIcon />
            SQL
          </Button>
        </ButtonGroup>
      </div>

      {/* Mode-specific content */}
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </aside>
  );
});
