'use client';

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from 'lucide-react';
import { useState } from 'react';

import { DataTableSkeleton } from '@/components/loaders';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  searchColumn?: string;
  enableGlobalFilter?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
  onRowClick?: (row: TData) => void;
  onRowHover?: ((row: TData) => void) | undefined;
  emptyState?: {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
  };
  className?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  searchPlaceholder = 'Search...',
  searchColumn,
  enableGlobalFilter = false,
  enablePagination = false,
  pageSize = 10,
  onRowClick,
  onRowHover,
  emptyState,
  className,
}: DataTableProps<TData, TValue>): React.ReactElement {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(enablePagination && { getPaginationRowModel: getPaginationRowModel() }),
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <DataTableSkeleton
        columnCount={columns.length || 5}
        rowCount={5}
        hasSearch={enableGlobalFilter || !!searchColumn}
      />
    );
  }

  const hasSearch = enableGlobalFilter || searchColumn;
  const filteredRowCount = table.getFilteredRowModel().rows.length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Input */}
      {hasSearch && (
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={
              enableGlobalFilter
                ? globalFilter
                : searchColumn
                  ? ((table.getColumn(searchColumn)?.getFilterValue() as string) ?? '')
                  : ''
            }
            onChange={(e) => {
              if (enableGlobalFilter) {
                setGlobalFilter(e.target.value);
              } else if (searchColumn) {
                table.getColumn(searchColumn)?.setFilterValue(e.target.value);
              }
            }}
            className="w-full rounded-md border bg-background py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      )}

      {/* Table */}
      {filteredRowCount > 0 ? (
        <>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b bg-muted/50">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left font-medium text-muted-foreground"
                        style={{
                          width:
                            header.column.getSize() !== 150 ? header.column.getSize() : undefined,
                        }}
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
                      onRowClick && 'cursor-pointer',
                    )}
                    onClick={() => onRowClick?.(row.original)}
                    onMouseEnter={() => onRowHover?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {enablePagination && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {table.getState().pagination.pageIndex * pageSize + 1} to{' '}
                {Math.min((table.getState().pagination.pageIndex + 1) * pageSize, filteredRowCount)}{' '}
                of {filteredRowCount} results
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeftIcon className="size-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                  <ChevronRightIcon className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        // Empty state
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          {emptyState?.icon && <div className="mb-4 text-muted-foreground">{emptyState.icon}</div>}
          <h3 className="mb-2 font-medium">{emptyState?.title ?? 'No data'}</h3>
          {emptyState?.description && (
            <p className="mb-4 text-sm text-muted-foreground">{emptyState.description}</p>
          )}
          {emptyState?.action}
        </div>
      )}
    </div>
  );
}
