'use client';

import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon, CopyIcon } from 'lucide-react';
import { memo, useCallback, useMemo, useRef, useState } from 'react';

import { TableDataGridSkeleton } from '@/components/loaders';
import { EditableCell } from '@/components/tables';
import { cn } from '@/lib/utils';
import type { ColumnInfo } from '@/server/db-adapters/types';

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

// --- Inline new-row cell ---

function NewRowCellInput({
  column,
  columnInfo,
  value,
  onChange,
}: {
  column: string;
  columnInfo?: ColumnInfo | undefined;
  value: string;
  onChange: (column: string, value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const placeholder = columnInfo?.defaultValue ? 'DEFAULT' : 'NULL';

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(column, e.target.value)}
      placeholder={placeholder}
      className="h-7 w-full bg-transparent font-mono text-sm outline-none placeholder:text-muted-foreground/60"
    />
  );
}

// --- Pending new row ---

const PendingNewRow = memo(function PendingNewRow({
  displayColumns,
  columnInfoMap,
  pendingRow,
  onPendingRowChange,
}: {
  displayColumns: string[];
  columnInfoMap: Map<string, ColumnInfo>;
  pendingRow: Record<string, string>;
  onPendingRowChange: (row: Record<string, string>) => void;
}) {
  const handleCellChange = useCallback(
    (column: string, value: string) => {
      onPendingRowChange({ ...pendingRow, [column]: value });
    },
    [pendingRow, onPendingRowChange],
  );

  return (
    <tr className="border-b bg-primary/10">
      {/* Empty checkbox cell with a new-row indicator */}
      <td className="border-r px-2 py-2 text-center">
        <span className="text-xs font-medium">NEW</span>
      </td>
      {displayColumns.map((col) => {
        const colInfo = columnInfoMap.get(col);
        return (
          <td key={col} className="border-r px-3 py-1.5">
            <NewRowCellInput
              column={col}
              columnInfo={colInfo}
              value={pendingRow[col] ?? ''}
              onChange={handleCellChange}
            />
          </td>
        );
      })}
    </tr>
  );
});

interface TableDataGridProps {
  data: Record<string, unknown>[];
  columns: string[];
  columnInfo?: ColumnInfo[];
  visibleColumns?: Set<string>;
  selectedRows?: Set<number>;
  sortConfig?: SortConfig | null;
  onSortChange?: (sort: SortConfig | null) => void;
  onSelectionChange?: (selectedRows: Set<number>) => void;
  onCellEdit?: (edit: CellEdit) => Promise<void>;
  isLoading?: boolean | undefined;
  pendingRow?: Record<string, string> | null | undefined;
  onPendingRowChange?: ((row: Record<string, string>) => void) | undefined;
}

export const TableDataGrid = memo(function TableDataGrid({
  data,
  columns,
  columnInfo,
  visibleColumns,
  selectedRows = new Set(),
  sortConfig,
  onSortChange,
  onSelectionChange,
  onCellEdit,
  isLoading,
  pendingRow,
  onPendingRowChange,
}: TableDataGridProps) {
  // Track which cell is currently being edited
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; column: string } | null>(null);

  // Row selection handlers
  const isAllSelected = data.length > 0 && selectedRows.size === data.length;
  const isSomeSelected = selectedRows.size > 0 && selectedRows.size < data.length;

  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) {
      return;
    }
    if (isAllSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(data.map((_, i) => i)));
    }
  }, [data, isAllSelected, onSelectionChange]);

  const handleSelectRow = useCallback(
    (rowIndex: number) => {
      if (!onSelectionChange) {
        return;
      }
      const newSelected = new Set(selectedRows);
      if (newSelected.has(rowIndex)) {
        newSelected.delete(rowIndex);
      } else {
        newSelected.add(rowIndex);
      }
      onSelectionChange(newSelected);
    },
    [selectedRows, onSelectionChange],
  );

  // Create a map of column name to full ColumnInfo for quick lookup
  const columnInfoMap = useMemo(() => {
    if (!columnInfo) {
      return new Map<string, ColumnInfo>();
    }
    return new Map(columnInfo.map((col) => [col.name, col]));
  }, [columnInfo]);

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
        const colType = columnInfoMap.get(col)?.type;

        return (
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 hover:text-foreground"
            onClick={() => handleSort(col)}
          >
            <span className="flex items-baseline gap-1.5 truncate">
              <span className="font-medium">{col}</span>
              {colType && (
                <span className="text-xs font-normal text-muted-foreground">{colType}</span>
              )}
            </span>
            <span className="shrink-0 text-muted-foreground">
              {isAsc && <ArrowUpIcon className="size-3.5" />}
              {isDesc && <ArrowDownIcon className="size-3.5" />}
              {!isSorted && <ChevronsUpDownIcon className="size-3.5" />}
            </span>
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
  }, [displayColumns, sortConfig, handleSort, columnInfoMap]);

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

  // Tab navigation: flatten grid into a linear index and step forward/backward
  const handleTabNavigation = useCallback(
    (rowIndex: number, column: string, shiftKey: boolean) => {
      const colIdx = displayColumns.indexOf(column);
      if (colIdx === -1 || displayColumns.length === 0) {
        return;
      }

      const totalCols = displayColumns.length;
      const flatIdx = rowIndex * totalCols + colIdx;
      const nextIdx = flatIdx + (shiftKey ? -1 : 1);
      const totalCells = data.length * totalCols;

      if (nextIdx < 0 || nextIdx >= totalCells) {
        return;
      }

      const nextRow = Math.floor(nextIdx / totalCols);
      const nextColName = displayColumns[nextIdx % totalCols];
      if (nextColName) {
        setEditingCell({ rowIndex: nextRow, column: nextColName });
      }
    },
    [displayColumns, data.length],
  );

  // Show full skeleton when loading without existing columns
  if (isLoading && columns.length === 0) {
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
          <tr>
            {/* Row selector column */}
            <th className="w-10 border-b border-r px-2 py-2 text-center">
              <input
                type="checkbox"
                className="size-4 cursor-pointer rounded border-muted-foreground accent-primary"
                checked={isAllSelected}
                ref={(el) => {
                  if (el) {
                    el.indeterminate = isSomeSelected;
                  }
                }}
                onChange={handleSelectAll}
                disabled={!onSelectionChange || data.length === 0 || isLoading}
              />
            </th>
            {displayColumns.map((col) => {
              const isSorted = sortConfig?.column === col;
              const isAsc = isSorted && sortConfig?.direction === 'asc';
              const isDesc = isSorted && sortConfig?.direction === 'desc';
              const colType = columnInfoMap.get(col)?.type;

              return (
                <th
                  key={col}
                  className="group border-b border-r px-3 py-2 text-left cursor-pointer select-none"
                  style={{ minWidth: 150 }}
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 hover:text-foreground"
                    onClick={() => handleSort(col)}
                    disabled={isLoading}
                  >
                    <span className="flex items-baseline gap-1.5 truncate">
                      <span className="font-medium">{col}</span>
                      {colType && (
                        <span className="text-xs font-normal text-muted-foreground">{colType}</span>
                      )}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {isAsc && <ArrowUpIcon className="size-3.5" />}
                      {isDesc && <ArrowDownIcon className="size-3.5" />}
                      {!isSorted && <ChevronsUpDownIcon className="size-3.5" />}
                    </span>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {/* Pending new row */}
          {pendingRow && onPendingRowChange && (
            <PendingNewRow
              displayColumns={displayColumns}
              columnInfoMap={columnInfoMap}
              pendingRow={pendingRow}
              onPendingRowChange={onPendingRowChange}
            />
          )}
          {isLoading
            ? // Show skeleton rows while loading
              Array.from({ length: 10 }).map((_, index) => (
                <tr
                  key={`skeleton-${index}`}
                  className={cn('border-b', index % 2 === 0 ? 'bg-background' : 'bg-muted/20')}
                >
                  <td className="border-r px-2 py-2 text-center">
                    <div className="size-4 animate-pulse rounded bg-muted" />
                  </td>
                  {displayColumns.map((col) => (
                    <td key={col} className="border-r px-3 py-2">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                    </td>
                  ))}
                </tr>
              ))
            : table.getRowModel().rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={cn(
                    'border-b transition-colors hover:bg-muted/50',
                    selectedRows.has(index)
                      ? 'bg-primary/10'
                      : index % 2 === 0
                        ? 'bg-background'
                        : 'bg-muted/20',
                  )}
                >
                  {/* Row selector */}
                  <td className="border-r px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      className="size-4 cursor-pointer rounded border-muted-foreground accent-primary"
                      checked={selectedRows.has(index)}
                      onChange={() => handleSelectRow(index)}
                      disabled={!onSelectionChange}
                    />
                  </td>
                  {row.getVisibleCells().map((cell) => {
                    const columnName = cell.column.id;
                    const cellValue = cell.getValue();
                    const isEditing =
                      editingCell?.rowIndex === index && editingCell?.column === columnName;
                    const colInfo = columnInfoMap.get(columnName);

                    return (
                      <td
                        key={cell.id}
                        className="group relative border-r px-3 py-2"
                        onDoubleClick={
                          onCellEdit && !isEditing
                            ? () => handleStartEdit(index, columnName)
                            : undefined
                        }
                      >
                        {onCellEdit ? (
                          <EditableCell
                            value={cellValue}
                            columnInfo={colInfo}
                            isEditing={isEditing}
                            onStartEdit={() => handleStartEdit(index, columnName)}
                            onSave={(newValue) =>
                              handleSaveEdit(index, columnName, cellValue, newValue, row.original)
                            }
                            onCancel={handleCancelEdit}
                            onTab={(shiftKey) => handleTabNavigation(index, columnName, shiftKey)}
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
