'use client';

import { useQueryClient } from '@tanstack/react-query';
import { TableIcon, TerminalSquareIcon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { memo, useCallback } from 'react';

import { useSidebar } from '@/app/(protected)/workspace/[connectionId]/layout';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { QUERY_KEYS } from '@/config/constants';
import queryService from '@/services/query.service';

interface WorkspaceSidebarProps {
  connectionId: string;
  children: React.ReactNode;
}

function SidebarContent({
  connectionId,
  children,
  onNavigate,
}: {
  connectionId: string;
  children: React.ReactNode;
  onNavigate: (href: string) => void;
}) {
  const pathname = usePathname();
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
    <>
      {/* Mode Switcher — height matches main toolbar (py-2 + h-8 button) */}
      <div className="shrink-0 border-b px-2 py-2">
        <ButtonGroup className="w-full">
          <Button
            variant={isTablesActive ? 'default' : 'ghost'}
            className="flex-1"
            onClick={() => onNavigate(`/workspace/${connectionId}/tables`)}
          >
            <TableIcon />
            Tables
          </Button>
          <Button
            variant={isSqlActive ? 'default' : 'ghost'}
            className="flex-1"
            onClick={() => onNavigate(`/workspace/${connectionId}/sql`)}
            onMouseEnter={handleSqlHover}
          >
            <TerminalSquareIcon />
            SQL
          </Button>
        </ButtonGroup>
      </div>

      {/* Mode-specific content */}
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </>
  );
}

export const WorkspaceSidebar = memo(function WorkspaceSidebar({
  connectionId,
  children,
}: WorkspaceSidebarProps) {
  const router = useRouter();
  const { isOpen, close } = useSidebar();

  const handleNav = useCallback(
    (href: string) => {
      router.push(href);
      close();
    },
    [router, close],
  );

  return (
    <>
      {/* Desktop: static sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r md:flex">
        <SidebarContent connectionId={connectionId} onNavigate={handleNav}>
          {children}
        </SidebarContent>
      </aside>

      {/* Mobile: Sheet overlay */}
      <Sheet
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            close();
          }
        }}
      >
        <SheetContent side="left" showCloseButton className="flex w-64 flex-col gap-0 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent connectionId={connectionId} onNavigate={handleNav}>
            {children}
          </SidebarContent>
        </SheetContent>
      </Sheet>
    </>
  );
});
