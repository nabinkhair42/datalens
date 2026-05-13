'use client';

import {
  ArrowLeftIcon,
  DatabaseIcon,
  RefreshCwIcon,
  TableIcon,
  TerminalSquareIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface TablesEmptyStateProps {
  tableCount: number;
  schemaCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  onOpenSql: () => void;
  onRefresh: () => void;
}

export function TablesEmptyState({
  tableCount,
  schemaCount,
  isLoading,
  isRefreshing,
  onOpenSql,
  onRefresh,
}: TablesEmptyStateProps) {
  const hasTables = tableCount > 0;

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden p-6">
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0',
          '[background-image:linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)]',
          '[background-size:32px_32px]',
          '[mask-image:radial-gradient(ellipse_at_center,black_0%,transparent_70%)]',
          'opacity-40 dark:opacity-20',
        )}
      />

      <div className="relative flex w-full max-w-md flex-col items-center text-center">
        <div className="relative mb-6 flex size-16 items-center justify-center">
          <div aria-hidden className="absolute inset-0 -z-10 rounded-2xl bg-primary/10 blur-xl" />
          <div className="flex size-16 items-center justify-center rounded-2xl border bg-card shadow-sm">
            <TableIcon className="size-7 text-primary" strokeWidth={1.75} />
          </div>
          <span
            aria-hidden
            className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border bg-card shadow-sm"
          >
            <ArrowLeftIcon className="size-3 text-muted-foreground" />
          </span>
        </div>

        <h2 className="font-heading text-xl font-semibold tracking-tight">
          {hasTables ? 'Pick a table to start exploring' : 'No tables to explore yet'}
        </h2>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          {hasTables
            ? 'Browse, filter, and edit rows directly. Select any table from the sidebar to load its data.'
            : 'This database has no tables. Create one with SQL or refresh the schema once it exists.'}
        </p>

        {hasTables && !isLoading && (
          <div className="mt-5 flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border bg-card/50 px-3 py-1.5">
              <TableIcon className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-medium tabular-nums">
                {tableCount} {tableCount === 1 ? 'table' : 'tables'}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-full border bg-card/50 px-3 py-1.5">
              <DatabaseIcon className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-medium tabular-nums">
                {schemaCount} {schemaCount === 1 ? 'schema' : 'schemas'}
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onOpenSql}>
            <TerminalSquareIcon />
            Open SQL editor
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCwIcon className={cn(isRefreshing && 'animate-spin')} />
            Refresh schema
          </Button>
        </div>

        <div className="mt-8 w-full">
          <Separator className="mb-4" />
          <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Shortcuts
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Refresh data</span>
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>R</Kbd>
              </KbdGroup>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Insert row</span>
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>I</Kbd>
              </KbdGroup>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Delete selection</span>
              <KbdGroup>
                <Kbd>⌫</Kbd>
              </KbdGroup>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Clear selection</span>
              <KbdGroup>
                <Kbd>Esc</Kbd>
              </KbdGroup>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
