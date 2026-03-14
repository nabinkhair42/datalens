'use client';

import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronsUpDownIcon,
  CopyIcon,
  FilterIcon,
  XIcon,
} from 'lucide-react';
import { memo, useCallback, useMemo, useRef, useState } from 'react';

import { TableDataGridSkeleton } from '@/components/loaders';
import { EditableCell, type TableFilter } from '@/components/tables';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

// --- Sort icon helper ---

function SortIcon({
  column,
  sortConfig,
}: {
  column: string;
  sortConfig?: SortConfig | null | undefined;
}) {
  if (sortConfig?.column === column) {
    return sortConfig.direction === 'asc' ? (
      <ArrowUpIcon className="size-3.5" />
    ) : (
      <ArrowDownIcon className="size-3.5" />
    );
  }
  return <ChevronsUpDownIcon className="size-3.5" />;
}

// --- Cell value display ---

function CellValue({ value }: { value: unknown }) {
  if (value === null) {
    return <span className="italic text-muted-foreground">NULL</span>;
  }
  if (typeof value === 'object') {
    return <span className="font-mono text-xs">{JSON.stringify(value)}</span>;
  }
  return <span className="font-mono text-sm">{String(value)}</span>;
}

// --- Column header with sort + filter menu ---

const BOOLEAN_OPTIONS = ['true', 'false'];

function getFilterOptions(colInfo: ColumnInfo | undefined): string[] | null {
  if (Array.isArray(colInfo?.enumValues) && colInfo.enumValues.length > 0) {
    return colInfo.enumValues;
  }
  const type = colInfo?.type?.toLowerCase() ?? '';
  if (type === 'boolean' || type === 'bool') {
    return BOOLEAN_OPTIONS;
  }
  return null;
}

function ColumnHeaderCell({
  column,
  colInfo,
  sortConfig,
  filters,
  onSort,
  onFilterAdd,
  onFilterRemove,
  disabled,
}: {
  column: string;
  colInfo: ColumnInfo | undefined;
  sortConfig?: SortConfig | null | undefined;
  filters: TableFilter[];
  onSort: (column: string) => void;
  onFilterAdd: (column: string, value: string) => void;
  onFilterRemove: (column: string) => void;
  disabled?: boolean | undefined;
}) {
  const filterOptions = getFilterOptions(colInfo);
  const activeFilter = filters.find((f) => f.column === column);
  const isSorted = sortConfig?.column === column;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        className="flex w-full items-center justify-between gap-2 rounded px-1 py-0.5 text-left hover:bg-accent/50 disabled:pointer-events-none"
      >
        <span className="flex items-baseline gap-1.5 truncate">
          <span className="font-medium">{column}</span>
          {colInfo?.type && (
            <span className="text-xs font-normal text-muted-foreground">{colInfo.type}</span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
          {activeFilter && <FilterIcon className="size-3 text-primary" />}
          <SortIcon column={column} sortConfig={sortConfig} />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {/* Sort options */}
        <DropdownMenuItem onClick={() => onSort(column)}>
          <ArrowUpIcon />
          Sort ascending
          {isSorted && sortConfig?.direction === 'asc' && (
            <CheckIcon className="ml-auto size-3.5" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSort(column)}>
          <ArrowDownIcon />
          Sort descending
          {isSorted && sortConfig?.direction === 'desc' && (
            <CheckIcon className="ml-auto size-3.5" />
          )}
        </DropdownMenuItem>
        {isSorted && (
          <DropdownMenuItem onClick={() => onSort(column)}>
            <XIcon />
            Clear sort
          </DropdownMenuItem>
        )}

        {/* Filter options for enum/boolean */}
        {filterOptions && (
          <>
            <DropdownMenuSeparator />
            <div className="px-1.5 py-1 text-xs font-medium text-muted-foreground">
              Filter by value
            </div>
            {filterOptions.map((opt) => (
              <DropdownMenuItem key={opt} onClick={() => onFilterAdd(column, opt)}>
                {opt}
                {activeFilter?.value === opt && <CheckIcon className="ml-auto size-3.5" />}
              </DropdownMenuItem>
            ))}
            {colInfo?.nullable && (
              <DropdownMenuItem onClick={() => onFilterAdd(column, '__null__')}>
                <span className="italic">NULL</span>
                {activeFilter?.operator === 'is_null' && <CheckIcon className="ml-auto size-3.5" />}
              </DropdownMenuItem>
            )}
            {activeFilter && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onFilterRemove(column)}>
                  <XIcon />
                  Clear filter
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
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
    <TableRow className="bg-primary/10 hover:bg-primary/10">
      <TableCell className="px-2 text-center">
        <span className="text-xs font-medium">NEW</span>
      </TableCell>
      {displayColumns.map((col) => (
        <TableCell key={col} className="py-1.5">
          <NewRowCellInput
            column={col}
            columnInfo={columnInfoMap.get(col)}
            value={pendingRow[col] ?? ''}
            onChange={handleCellChange}
          />
        </TableCell>
      ))}
    </TableRow>
  );
});

interface TableDataGridProps {
  data: Record<string, unknown>[];
  columns: string[];
  columnInfo?: ColumnInfo[];
  visibleColumns?: Set<string>;
  selectedRows?: Set<number>;
  sortConfig?: SortConfig | null | undefined;
  filters?: TableFilter[] | undefined;
  onSortChange?: (sort: SortConfig | null) => void;
  onFiltersChange?: (filters: TableFilter[]) => void;
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
  filters = [],
  onSortChange,
  onFiltersChange,
  onSelectionChange,
  onCellEdit,
  isLoading,
  pendingRow,
  onPendingRowChange,
}: TableDataGridProps) {
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; column: string } | null>(null);

  const isAllSelected = data.length > 0 && selectedRows.size === data.length;
  const isSomeSelected = selectedRows.size > 0 && selectedRows.size < data.length;

  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) {
      return;
    }
    onSelectionChange(isAllSelected ? new Set() : new Set(data.map((_, i) => i)));
  }, [data, isAllSelected, onSelectionChange]);

  const handleSelectRow = useCallback(
    (rowIndex: number) => {
      if (!onSelectionChange) {
        return;
      }
      const next = new Set(selectedRows);
      if (next.has(rowIndex)) {
        next.delete(rowIndex);
      } else {
        next.add(rowIndex);
      }
      onSelectionChange(next);
    },
    [selectedRows, onSelectionChange],
  );

  const columnInfoMap = useMemo(() => {
    if (!columnInfo) {
      return new Map<string, ColumnInfo>();
    }
    return new Map(columnInfo.map((col) => [col.name, col]));
  }, [columnInfo]);

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
        onSortChange(sortConfig.direction === 'asc' ? { column, direction: 'desc' } : null);
      } else {
        onSortChange({ column, direction: 'asc' });
      }
    },
    [sortConfig, onSortChange],
  );

  const handleFilterAdd = useCallback(
    (column: string, value: string) => {
      if (!onFiltersChange) {
        return;
      }
      // Remove any existing filter on this column first
      const without = filters.filter((f) => f.column !== column);
      const isNull = value === '__null__';
      const newFilter: TableFilter = {
        id: crypto.randomUUID(),
        column,
        operator: isNull ? 'is_null' : 'equals',
        value: isNull ? '' : value,
      };
      onFiltersChange([...without, newFilter]);
    },
    [filters, onFiltersChange],
  );

  const handleFilterRemove = useCallback(
    (column: string) => {
      if (!onFiltersChange) {
        return;
      }
      onFiltersChange(filters.filter((f) => f.column !== column));
    },
    [filters, onFiltersChange],
  );

  const columnDefs = useMemo<ColumnDef<Record<string, unknown>>[]>(
    () =>
      displayColumns.map((col) => ({
        accessorKey: col,
        cell: ({ getValue }) => <CellValue value={getValue()} />,
        size: 200,
      })),
    [displayColumns],
  );

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
        await onCellEdit({ rowIndex, column, oldValue, newValue, rowData });
        setEditingCell(null);
      } catch (error) {
        console.error('Failed to save cell edit:', error);
      }
    },
    [onCellEdit],
  );

  const handleTabNavigation = useCallback(
    (rowIndex: number, column: string, shiftKey: boolean) => {
      const colIdx = displayColumns.indexOf(column);
      if (colIdx === -1 || displayColumns.length === 0) {
        return;
      }

      const totalCols = displayColumns.length;
      const nextIdx = rowIndex * totalCols + colIdx + (shiftKey ? -1 : 1);
      const totalCells = data.length * totalCols;

      if (nextIdx < 0 || nextIdx >= totalCells) {
        return;
      }

      const nextColName = displayColumns[nextIdx % totalCols];
      if (nextColName) {
        setEditingCell({ rowIndex: Math.floor(nextIdx / totalCols), column: nextColName });
      }
    },
    [displayColumns, data.length],
  );

  const hasData = data.length > 0 && displayColumns.length > 0;

  if (isLoading && !hasData) {
    return <TableDataGridSkeleton />;
  }

  if (!hasData) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No data to display</p>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-auto">
      {/* Loading bar */}
      {isLoading && (
        <div className="absolute inset-x-0 top-0 z-20 h-0.5 overflow-hidden bg-primary/20">
          <div
            className="h-full w-1/4 rounded-full bg-primary"
            style={{ animation: 'loading-bar 1s ease-in-out infinite' }}
          />
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-muted">
            {/* Select-all checkbox */}
            <TableHead className="w-10 text-center">
              <input
                type="checkbox"
                className="size-4 cursor-pointer rounded accent-primary"
                checked={isAllSelected}
                ref={(el) => {
                  if (el) {
                    el.indeterminate = isSomeSelected;
                  }
                }}
                onChange={handleSelectAll}
                disabled={!onSelectionChange || data.length === 0 || isLoading}
              />
            </TableHead>

            {displayColumns.map((col) => {
              const colInfo = columnInfoMap.get(col);
              return (
                <TableHead key={col} style={{ minWidth: 150 }}>
                  <ColumnHeaderCell
                    column={col}
                    colInfo={colInfo}
                    sortConfig={sortConfig}
                    filters={filters}
                    onSort={handleSort}
                    onFilterAdd={handleFilterAdd}
                    onFilterRemove={handleFilterRemove}
                    disabled={isLoading}
                  />
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>

        <TableBody className={cn(isLoading && 'opacity-40 transition-opacity duration-150')}>
          {pendingRow && onPendingRowChange && (
            <PendingNewRow
              displayColumns={displayColumns}
              columnInfoMap={columnInfoMap}
              pendingRow={pendingRow}
              onPendingRowChange={onPendingRowChange}
            />
          )}

          {table.getRowModel().rows.map((row, index) => (
            <TableRow
              key={row.id}
              className={cn(
                selectedRows.has(index)
                  ? 'bg-primary/10'
                  : index % 2 === 0
                    ? 'bg-background'
                    : 'bg-muted/20',
              )}
            >
              <TableCell className="px-2 text-center">
                <input
                  type="checkbox"
                  className="size-4 cursor-pointer rounded accent-primary"
                  checked={selectedRows.has(index)}
                  onChange={() => handleSelectRow(index)}
                  disabled={!onSelectionChange || isLoading}
                />
              </TableCell>

              {row.getVisibleCells().map((cell) => {
                const columnName = cell.column.id;
                const cellValue = cell.getValue();
                const isEditing =
                  editingCell?.rowIndex === index && editingCell?.column === columnName;
                const colInfo = columnInfoMap.get(columnName);

                return (
                  <TableCell
                    key={cell.id}
                    className="group relative"
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
                        <span className="max-w-75 truncate">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="absolute right-1 top-1/2 hidden -translate-y-1/2 group-hover:flex"
                          onClick={() => handleCopyCell(cellValue)}
                        >
                          <CopyIcon className="size-3" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});
