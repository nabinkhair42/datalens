'use client';

import { useQueryClient } from '@tanstack/react-query';
import { TableIcon, TerminalSquareIcon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { memo, useCallback } from 'react';

import { useSidebar } from '@/app/(protected)/workspace/[connectionId]/layout';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { QUERY_KEYS } from '@/config/constants';
import { cn } from '@/lib/utils';
import queryService from '@/services/query.service';

interface WorkspaceSidebarProps {
  connectionId: string;
  children: React.ReactNode;
}

interface ModeTabProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  onMouseEnter?: () => void;
}

function ModeTab({ active, icon, label, onClick, onMouseEnter }: ModeTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      data-active={active}
      className={cn(
        'group relative inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-colors',
        active ? 'text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'absolute inset-0 -z-10 rounded-md bg-background shadow-sm ring-1 ring-border transition-opacity',
          active ? 'opacity-100' : 'opacity-0',
        )}
      />
      <span className="[&_svg]:size-3.5">{icon}</span>
      <span>{label}</span>
    </button>
  );
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
      {/* Mode Switcher — segmented control sitting in a muted track */}
      <div className="shrink-0 border-b p-2">
        <div
          role="tablist"
          aria-label="Workspace mode"
          className="flex items-center gap-1 rounded-lg bg-muted/60 p-1"
        >
          <ModeTab
            active={isTablesActive}
            icon={<TableIcon />}
            label="Tables"
            onClick={() => onNavigate(`/workspace/${connectionId}/tables`)}
          />
          <ModeTab
            active={isSqlActive}
            icon={<TerminalSquareIcon />}
            label="SQL"
            onClick={() => onNavigate(`/workspace/${connectionId}/sql`)}
            onMouseEnter={handleSqlHover}
          />
        </div>
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
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar/40 md:flex">
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
