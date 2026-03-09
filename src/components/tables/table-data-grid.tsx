'use client';

import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { ArrowDownIcon, ArrowUpIcon, CopyIcon } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';

import { TableDataGridSkeleton } from '@/components/loaders';
import { EditableCell } from '@/components/tables/editable-cell';
import { cn } from '@/lib/utils';

export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

export interface CellEdit {
  rowIndex: number;
  column: string;
  oldValue: unknown;
  newValue: string;
  rowData: Record<string, unknown>;
}

interface TableDataGridProps {
  data: Record<string, unknown>[];
  columns: string[];
  visibleColumns?: Set<string>;
  sortConfig?: SortConfig | null;
  onSortChange?: (sort: SortConfig | null) => void;
  onCellEdit?: (edit: CellEdit) => Promise<void>;
  isLoading?: boolean | undefined;
}

export const TableDataGrid = memo(function TableDataGrid({
  data,
  columns,
  visibleColumns,
  sortConfig,
  onSortChange,
  onCellEdit,
  isLoading,
}: TableDataGridProps) {
  // Track which cell is currently being edited
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; column: string } | null>(null);
  // Filter columns by visibility
  const displayColumns = useMemo(() => {
    if (!visibleColumns) {
      return columns;
    }
    return columns.filter((col) => visibleColumns.has(col));
  }, [columns, visibleColumns]);

  const handleSort = useCallback(
    (column: string) => {
      if (!onSortChange) {
        return;
      }
      if (sortConfig?.column === column) {
        if (sortConfig.direction === 'asc') {
          onSortChange({ column, direction: 'desc' });
        } else {
          onSortChange(null);
        }
      } else {
        onSortChange({ column, direction: 'asc' });
      }
    },
    [sortConfig, onSortChange],
  );

  // Generate column definitions
  const columnDefs = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    return displayColumns.map((col) => ({
      accessorKey: col,
      header: () => {
        const isSorted = sortConfig?.column === col;
        const isAsc = isSorted && sortConfig?.direction === 'asc';
        const isDesc = isSorted && sortConfig?.direction === 'desc';

        return (
          <button
            type="button"
            className="flex w-full items-center gap-1 hover:text-foreground"
            onClick={() => handleSort(col)}
          >
            <span className="font-medium">{col}</span>
            {isAsc && <ArrowUpIcon className="size-3" />}
            {isDesc && <ArrowDownIcon className="size-3" />}
            {!isSorted && (
              <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100">
                ↕
              </span>
            )}
          </button>
        );
      },
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
  }, [displayColumns, sortConfig, handleSort]);

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

  const handleStartEdit = useCallback(
    (rowIndex: number, column: string) => {
      if (onCellEdit) {
        setEditingCell({ rowIndex, column });
      }
    },
    [onCellEdit],
  );

  const handleCancelEdit = useCallback(() => {
    setEditingCell(null);
  }, []);

  const handleSaveEdit = useCallback(
    async (
      rowIndex: number,
      column: string,
      oldValue: unknown,
      newValue: string,
      rowData: Record<string, unknown>,
    ) => {
      if (!onCellEdit) {
        return;
      }
      try {
        await onCellEdit({
          rowIndex,
          column,
          oldValue,
          newValue,
          rowData,
        });
        setEditingCell(null);
      } catch (error) {
        // Keep editing state open on error so user can retry
        console.error('Failed to save cell edit:', error);
      }
    },
    [onCellEdit],
  );

  if (isLoading) {
    return <TableDataGridSkeleton />;
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
                  className="group border-b border-r px-3 py-2 text-left cursor-pointer select-none"
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
              {row.getVisibleCells().map((cell) => {
                const columnName = cell.column.id;
                const cellValue = cell.getValue();
                const isEditing =
                  editingCell?.rowIndex === index && editingCell?.column === columnName;

                return (
                  <td key={cell.id} className="group relative border-r px-3 py-2">
                    {onCellEdit ? (
                      <EditableCell
                        value={cellValue}
                        rowIndex={index}
                        column={columnName}
                        isEditing={isEditing}
                        onStartEdit={() => handleStartEdit(index, columnName)}
                        onSave={(newValue) =>
                          handleSaveEdit(index, columnName, cellValue, newValue, row.original)
                        }
                        onCancel={handleCancelEdit}
                      />
                    ) : (
                      <>
                        <button
                          type="button"
                          className="max-w-75 truncate text-left"
                          onDoubleClick={() => handleCopyCell(cellValue)}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </button>
                        <button
                          type="button"
                          className="absolute right-1 top-1/2 hidden -translate-y-1/2 rounded p-1 hover:bg-accent group-hover:block"
                          onClick={() => handleCopyCell(cellValue)}
                          title="Copy value"
                        >
                          <CopyIcon className="size-3" />
                        </button>
                      </>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
