'use client';

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, CopyIcon, DownloadIcon } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QueryResultsProps {
  data: Record<string, unknown>[];
  columns: string[];
  rowCount?: number | undefined;
  executionTime?: number | undefined;
  isLoading?: boolean | undefined;
  error?: string | null | undefined;
  onExportCSV?: (() => void) | undefined;
  onExportJSON?: (() => void) | undefined;
}

export const QueryResults = memo(function QueryResults({
  data,
  columns,
  rowCount,
  executionTime,
  isLoading,
  error,
  onExportCSV,
  onExportJSON,
}: QueryResultsProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  // Generate column definitions from column names
  const columnDefs = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    return columns.map((col) => ({
      accessorKey: col,
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        return (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            <span className="font-medium">{col}</span>
            {isSorted === 'asc' ? (
              <ArrowUpIcon className="ml-2 size-4" />
            ) : isSorted === 'desc' ? (
              <ArrowDownIcon className="ml-2 size-4" />
            ) : (
              <ArrowUpDownIcon className="ml-2 size-4 opacity-50" />
            )}
          </Button>
        );
      },
      cell: ({ getValue }) => {
        const value = getValue();
        if (value === null) {
          return <span className="italic text-muted-foreground">NULL</span>;
        }
        if (typeof value === 'object') {
          return <span className="font-mono text-xs">{JSON.stringify(value)}</span>;
        }
        return <span className="font-mono text-sm">{String(value)}</span>;
      },
    }));
  }, [columns]);

  const table = useReactTable({
    data,
    columns: columnDefs,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleCopyCell = useCallback((value: unknown) => {
    const text =
      value === null ? 'NULL' : typeof value === 'object' ? JSON.stringify(value) : String(value);
    navigator.clipboard.writeText(text);
  }, []);

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
        <p className="font-medium text-destructive">Query Error</p>
        <p className="max-w-md text-center text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Executing query...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0 && columns.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Run a query to see results</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm text-muted-foreground">0 rows returned</span>
          {executionTime !== undefined && (
            <span className="text-xs text-muted-foreground">{executionTime}ms</span>
          )}
        </div>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Query returned no results</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Results Header */}
      <div className="flex shrink-0 items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">
            {rowCount ?? data.length} row
            {(rowCount ?? data.length) !== 1 ? 's' : ''}
          </span>
          {executionTime !== undefined && (
            <span className="text-xs text-muted-foreground">{executionTime}ms</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onExportCSV && (
            <Button variant="ghost" size="sm" onClick={onExportCSV}>
              <DownloadIcon className="size-4" />
              CSV
            </Button>
          )}
          {onExportJSON && (
            <Button variant="ghost" size="sm" onClick={onExportJSON}>
              <DownloadIcon className="size-4" />
              JSON
            </Button>
          )}
        </div>
      </div>

      {/* Results Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="border-b px-3 py-2 text-left font-medium"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, index) => (
              <tr
                key={row.id}
                className={cn(
                  'border-b transition-colors hover:bg-muted/50',
                  index % 2 === 0 ? 'bg-background' : 'bg-muted/20',
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="group relative px-3 py-2"
                    onDoubleClick={() => handleCopyCell(cell.getValue())}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    <button
                      type="button"
                      className="absolute right-1 top-1/2 hidden -translate-y-1/2 rounded p-1 hover:bg-accent group-hover:block"
                      onClick={() => handleCopyCell(cell.getValue())}
                      title="Copy value"
                    >
                      <CopyIcon className="size-3" />
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
