'use client';

import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { CopyIcon, LoaderIcon } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';

import { cn } from '@/lib/utils';

interface TableDataGridProps {
  data: Record<string, unknown>[];
  columns: string[];
  isLoading?: boolean | undefined;
}

export const TableDataGrid = memo(function TableDataGrid({
  data,
  columns,
  isLoading,
}: TableDataGridProps) {
  // Generate column definitions
  const columnDefs = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    return columns.map((col) => ({
      accessorKey: col,
      header: () => (
        <div className="flex items-center gap-1">
          <span className="font-medium">{col}</span>
          <span className="text-xs text-muted-foreground">text</span>
        </div>
      ),
      cell: ({ getValue }) => {
        const value = getValue();
        if (value === null) {
          return <span className="text-muted-foreground">NULL</span>;
        }
        if (typeof value === 'object') {
          return <span className="font-mono text-xs">{JSON.stringify(value)}</span>;
        }
        return <span className="font-mono text-sm">{String(value)}</span>;
      },
      size: 200,
    }));
  }, [columns]);

  const table = useReactTable({
    data,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleCopyCell = useCallback((value: unknown) => {
    const text =
      value === null ? 'NULL' : typeof value === 'object' ? JSON.stringify(value) : String(value);
    navigator.clipboard.writeText(text);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoaderIcon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (data.length === 0 && columns.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No data to display</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-muted">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {/* Row selector column */}
              <th className="w-10 border-b border-r px-2 py-2 text-center">
                <input
                  type="checkbox"
                  className="size-4 rounded border-muted-foreground"
                  disabled
                />
              </th>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="border-b border-r px-3 py-2 text-left"
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
              {/* Row selector */}
              <td className="border-r px-2 py-2 text-center">
                <input
                  type="checkbox"
                  className="size-4 rounded border-muted-foreground"
                  disabled
                />
              </td>
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="group relative border-r px-3 py-2"
                  onDoubleClick={() => handleCopyCell(cell.getValue())}
                >
                  <div className="max-w-[300px] truncate">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
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
  );
});
