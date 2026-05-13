'use client';

import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DatabaseIcon,
  PlusIcon,
  RefreshCwIcon,
  TableIcon,
  TrashIcon,
  XIcon,
} from 'lucide-react';
import { memo } from 'react';

import { ColumnVisibility } from '@/components/tables/column-visibility';
import { ExportMenu } from '@/components/tables/export-menu';
import { type TableFilter, TableFilters } from '@/components/tables/table-filters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { ColumnInfo } from '@/server/db-adapters/types';

interface TableToolbarProps {
  schema: string;
  table: string;
  rows: Record<string, unknown>[];
  columns: string[];
  columnInfo: ColumnInfo[];
  filters: TableFilter[];
  visibleColumns: Set<string>;
  selectedCount: number;
  pendingRow: Record<string, string> | null;
  totalRows: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  isInserting: boolean;
  isDeleting: boolean;
  executionTime?: number | undefined;
  onFiltersChange: (filters: TableFilter[]) => void;
  onVisibilityChange: (visible: Set<string>) => void;
  onAddRow: () => void;
  onSaveRow: () => void;
  onDiscardRow: () => void;
  onDeletePrompt: () => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

export const TableToolbar = memo(function TableToolbar({
  schema,
  table,
  rows,
  columns,
  columnInfo,
  filters,
  visibleColumns,
  selectedCount,
  pendingRow,
  totalRows,
  page,
  pageSize,
  isLoading,
  isInserting,
  isDeleting,
  executionTime,
  onFiltersChange,
  onVisibilityChange,
  onAddRow,
  onSaveRow,
  onDiscardRow,
  onDeletePrompt,
  onPageChange,
  onRefresh,
}: TableToolbarProps) {
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const currentPage = page + 1;
  const rangeStart = totalRows === 0 ? 0 : page * pageSize + 1;
  const rangeEnd = Math.min((page + 1) * pageSize, totalRows);

  return (
    <div className="flex shrink-0 flex-col border-b bg-background">
      {/* Top row: identity + meta */}
      <div className="flex h-9 items-center justify-between gap-3 border-b px-4">
        <div className="flex min-w-0 items-center gap-2 text-xs">
          <DatabaseIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-muted-foreground">{schema}</span>
          <span className="text-muted-foreground/40">/</span>
          <TableIcon className="size-3.5 shrink-0 text-primary" />
          <span className="truncate font-medium">{table}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-[11px] text-muted-foreground">
          {executionTime !== undefined && <span className="tabular-nums">{executionTime}ms</span>}
          {executionTime !== undefined && totalRows > 0 && (
            <Separator orientation="vertical" className="h-3" />
          )}
          {totalRows > 0 && (
            <span className="tabular-nums">
              {totalRows.toLocaleString()} {totalRows === 1 ? 'row' : 'rows'}
            </span>
          )}
        </div>
      </div>

      {/* Bottom row: actions + pagination */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <TableFilters
            columns={columns}
            columnInfo={columnInfo}
            filters={filters}
            onFiltersChange={onFiltersChange}
          />
          <ColumnVisibility
            columns={columns}
            visibleColumns={visibleColumns}
            onVisibilityChange={onVisibilityChange}
          />
          <Separator orientation="vertical" className="mx-1 h-5" />
          <Button
            variant="outline"
            size="sm"
            onClick={onAddRow}
            disabled={isLoading || !!pendingRow}
          >
            <PlusIcon />
            Add record
          </Button>
          {pendingRow && (
            <>
              <Button size="sm" onClick={onSaveRow} disabled={isInserting}>
                <CheckIcon />
                {isInserting ? 'Saving…' : 'Save changes'}
              </Button>
              <Button variant="ghost" size="sm" onClick={onDiscardRow} disabled={isInserting}>
                <XIcon />
                Discard
              </Button>
            </>
          )}
          {selectedCount > 0 && (
            <>
              <Separator orientation="vertical" className="mx-1 h-5" />
              <Badge
                variant="secondary"
                className="h-7 gap-1.5 px-2.5 font-mono text-[11px] tabular-nums"
              >
                <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                {selectedCount} selected
              </Badge>
              <Button
                variant="destructive"
                size="sm"
                onClick={onDeletePrompt}
                disabled={isDeleting}
              >
                <TrashIcon />
                Delete
              </Button>
            </>
          )}
          <Separator orientation="vertical" className="mx-1 h-5" />
          <ExportMenu
            data={rows}
            columns={columns}
            filename={`${schema}_${table}`}
            disabled={isLoading}
          />
        </div>

        {/* Pagination */}
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-xs tabular-nums text-muted-foreground md:inline">
            {totalRows > 0 ? (
              <>
                <span className="font-medium text-foreground">
                  {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()}
                </span>{' '}
                of {totalRows.toLocaleString()}
              </>
            ) : (
              '0 rows'
            )}
          </span>
          <ButtonGroup aria-label="Pagination">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0 || isLoading}
              aria-label="Previous page"
            >
              <ChevronLeftIcon />
            </Button>
            <div
              className={cn(
                'inline-flex h-8 min-w-[68px] items-center justify-center gap-1 border bg-muted/40 px-2 text-[11px] font-medium tabular-nums text-muted-foreground',
              )}
            >
              <span className="text-foreground">{currentPage}</span>
              <span className="text-muted-foreground/60">/</span>
              <span>{totalPages}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1 || isLoading}
              aria-label="Next page"
            >
              <ChevronRightIcon />
            </Button>
          </ButtonGroup>
          <Separator orientation="vertical" className="mx-0.5 h-5" />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onRefresh}
            disabled={isLoading}
            aria-label="Refresh"
          >
            <RefreshCwIcon className={cn(isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>
    </div>
  );
});
