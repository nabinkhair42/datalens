'use client';

import { useHotkey } from '@tanstack/react-hotkeys';
import { ChevronLeftIcon, ChevronRightIcon, RefreshCwIcon, TrashIcon } from 'lucide-react';
import { use, useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { SchemaExplorer } from '@/components/editor/schema-explorer';
import { AddRecordDialog, buildInsertQuery } from '@/components/tables/add-record-dialog';
import { ColumnVisibility } from '@/components/tables/column-visibility';
import { ExportMenu } from '@/components/tables/export-menu';
import { type CellEdit, type SortConfig, TableDataGrid } from '@/components/tables/table-data-grid';
import {
  buildWhereClause,
  type TableFilter,
  TableFilters,
} from '@/components/tables/table-filters';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useConnectionSchema } from '@/hooks/use-connections';
import { useExecuteQuery } from '@/hooks/use-queries';
import type { ColumnInfo } from '@/server/db-adapters/types';

interface TablesPageProps {
  params: Promise<{ connectionId: string }>;
}

export default function TablesPage({ params }: TablesPageProps) {
  const { connectionId } = use(params);
  const {
    data: schemas,
    isLoading: isLoadingSchema,
    isFetching: isFetchingSchema,
    refetch: refetchSchema,
  } = useConnectionSchema(connectionId);
  const executeQuery = useExecuteQuery();

  const [selectedTable, setSelectedTable] = useState<{
    schema: string;
    table: string;
  } | null>(null);

  const [tableData, setTableData] = useState<{
    rows: Record<string, unknown>[];
    columns: string[];
    columnInfo: ColumnInfo[];
    totalRows: number;
    executionTime?: number | undefined;
  }>({
    rows: [],
    columns: [],
    columnInfo: [],
    totalRows: 0,
  });

  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 50,
  });

  const [filters, setFilters] = useState<TableFilter[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // rerender-use-ref-transient-values: Stabilize loadTableData by keeping mutation
  // and visibleColumns in refs. Without this, loadTableData is recreated every render
  // (mutation object is new each render) which cascades to all handlers that depend on it.
  const executeQueryRef = useRef(executeQuery);
  executeQueryRef.current = executeQuery;
  const visibleColumnsRef = useRef(visibleColumns);
  visibleColumnsRef.current = visibleColumns;

  // Helper to extract row count from query result
  const parseRowCount = useCallback((countResult: { rows: Record<string, unknown>[] }): number => {
    const countValue = countResult.rows[0]?.['count'];
    if (typeof countValue === 'number') {
      return countValue;
    }
    if (typeof countValue === 'string') {
      return parseInt(countValue, 10);
    }
    return 0;
  }, []);

  const loadTableData = useCallback(
    async (
      schema: string,
      table: string,
      page: number,
      pageSize: number,
      activeFilters: TableFilter[],
      activeSort: SortConfig | null,
    ) => {
      setIsLoadingData(true);
      try {
        const offset = page * pageSize;
        const whereClause = buildWhereClause(activeFilters);
        const orderClause = activeSort
          ? `ORDER BY "${activeSort.column}" ${activeSort.direction.toUpperCase()}`
          : '';

        // async-parallel: Execute data and count queries in parallel
        const [result, countResult] = await Promise.all([
          executeQueryRef.current.mutateAsync({
            connectionId,
            query: `SELECT * FROM "${schema}"."${table}" ${whereClause} ${orderClause} LIMIT ${pageSize} OFFSET ${offset}`,
            skipHistory: true,
          }),
          executeQueryRef.current.mutateAsync({
            connectionId,
            query: `SELECT COUNT(*) as count FROM "${schema}"."${table}" ${whereClause}`,
            skipHistory: true,
          }),
        ]);

        const totalRows = parseRowCount(countResult);

        const columns = result.columns?.map((c) => c.name) || [];
        const columnInfo: ColumnInfo[] =
          result.columns?.map((c) => ({
            name: c.name,
            type: c.type,
            nullable: c.nullable ?? true,
          })) || [];

        setTableData({
          rows: result.rows || [],
          columns,
          columnInfo,
          totalRows,
          executionTime: result.executionTime,
        });

        // Initialize visible columns when table changes
        const currentVisible = visibleColumnsRef.current;
        if (currentVisible.size === 0 || !columns.every((c) => currentVisible.has(c))) {
          setVisibleColumns(new Set(columns));
        }
      } catch (error) {
        console.error('Failed to load table data:', error);
        setTableData({
          rows: [],
          columns: [],
          columnInfo: [],
          totalRows: 0,
        });
      } finally {
        setIsLoadingData(false);
      }
    },
    [connectionId, parseRowCount],
  );

  const handleTableSelect = useCallback(
    (schema: string, table: string) => {
      setSelectedTable({ schema, table });
      setPagination({ page: 0, pageSize: 50 });
      setFilters([]);
      setVisibleColumns(new Set());
      setSortConfig(null);
      setSelectedRows(new Set());
      loadTableData(schema, table, 0, 50, [], null);
    },
    [loadTableData],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (selectedTable) {
        setPagination((prev) => ({ ...prev, page: newPage }));
        loadTableData(
          selectedTable.schema,
          selectedTable.table,
          newPage,
          pagination.pageSize,
          filters,
          sortConfig,
        );
      }
    },
    [selectedTable, pagination.pageSize, filters, sortConfig, loadTableData],
  );

  const handleRefresh = useCallback(() => {
    if (selectedTable) {
      loadTableData(
        selectedTable.schema,
        selectedTable.table,
        pagination.page,
        pagination.pageSize,
        filters,
        sortConfig,
      );
    }
  }, [selectedTable, pagination, filters, sortConfig, loadTableData]);

  const handleFiltersChange = useCallback(
    (newFilters: TableFilter[]) => {
      setFilters(newFilters);
      setPagination((prev) => ({ ...prev, page: 0 }));
      if (selectedTable) {
        loadTableData(
          selectedTable.schema,
          selectedTable.table,
          0,
          pagination.pageSize,
          newFilters,
          sortConfig,
        );
      }
    },
    [selectedTable, pagination.pageSize, sortConfig, loadTableData],
  );

  const handleSortChange = useCallback(
    (newSort: SortConfig | null) => {
      setSortConfig(newSort);
      setPagination((prev) => ({ ...prev, page: 0 }));
      if (selectedTable) {
        loadTableData(
          selectedTable.schema,
          selectedTable.table,
          0,
          pagination.pageSize,
          filters,
          newSort,
        );
      }
    },
    [selectedTable, pagination.pageSize, filters, loadTableData],
  );

  const handleInsertRecord = useCallback(
    async (values: Record<string, string>) => {
      if (!selectedTable) {
        return;
      }
      const query = buildInsertQuery(selectedTable.schema, selectedTable.table, values);
      await executeQueryRef.current.mutateAsync({ connectionId, query, skipHistory: false });
      toast.success('Record inserted successfully');
      handleRefresh();
    },
    [selectedTable, connectionId, handleRefresh],
  );

  const handleCellEdit = useCallback(
    async (edit: CellEdit) => {
      if (!selectedTable) {
        return;
      }

      // Build WHERE clause from the row data to identify the record
      // Use all columns to create a unique identifier (in case there's no primary key)
      const whereConditions = Object.entries(edit.rowData)
        .filter(([, value]) => value !== null)
        .map(([col, value]) => {
          if (typeof value === 'string') {
            return `"${col}" = '${value.replace(/'/g, "''")}'`;
          }
          if (typeof value === 'number' || typeof value === 'boolean') {
            return `"${col}" = ${value}`;
          }
          return `"${col}" = '${JSON.stringify(value).replace(/'/g, "''")}'`;
        })
        .join(' AND ');

      // Format the new value for SQL
      const formattedValue =
        edit.newValue === '' || edit.newValue.toLowerCase() === 'null'
          ? 'NULL'
          : `'${edit.newValue.replace(/'/g, "''")}'`;

      const query = `UPDATE "${selectedTable.schema}"."${selectedTable.table}" SET "${edit.column}" = ${formattedValue} WHERE ${whereConditions}`;

      try {
        await executeQueryRef.current.mutateAsync({ connectionId, query, skipHistory: false });
        toast.success('Cell updated successfully');
        handleRefresh();
      } catch (error) {
        toast.error('Failed to update cell');
        throw error;
      }
    },
    [selectedTable, connectionId, handleRefresh],
  );

  // Helper to build WHERE clause for a row
  const buildRowWhereClause = useCallback((rowData: Record<string, unknown>): string => {
    return Object.entries(rowData)
      .filter(([, value]) => value !== null)
      .map(([col, value]) => {
        if (typeof value === 'string') {
          return `"${col}" = '${value.replace(/'/g, "''")}'`;
        }
        if (typeof value === 'number' || typeof value === 'boolean') {
          return `"${col}" = ${value}`;
        }
        return `"${col}" = '${JSON.stringify(value).replace(/'/g, "''")}'`;
      })
      .join(' AND ');
  }, []);

  const deleteRows = useCallback(
    async (schema: string, table: string, rows: Record<string, unknown>[]) => {
      for (const rowData of rows) {
        const whereClause = buildRowWhereClause(rowData);
        const query = `DELETE FROM "${schema}"."${table}" WHERE ${whereClause}`;
        await executeQueryRef.current.mutateAsync({ connectionId, query, skipHistory: false });
      }
    },
    [connectionId, buildRowWhereClause],
  );

  const handleDeletePrompt = useCallback(() => {
    if (selectedTable && selectedRows.size > 0) {
      setDeleteDialogOpen(true);
    }
  }, [selectedTable, selectedRows.size]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedTable || selectedRows.size === 0) {
      return;
    }

    setIsDeleting(true);
    const count = selectedRows.size;
    const rowsToDelete = Array.from(selectedRows)
      .map((i) => tableData.rows[i])
      .filter((row): row is Record<string, unknown> => row !== undefined);

    try {
      await deleteRows(selectedTable.schema, selectedTable.table, rowsToDelete);
      toast.success(`Deleted ${count} record${count > 1 ? 's' : ''}`);
      setSelectedRows(new Set());
      handleRefresh();
    } catch (error) {
      toast.error('Failed to delete records');
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedTable, selectedRows, tableData.rows, deleteRows, handleRefresh]);

  // Derive column info with additional metadata from schema
  const tableColumnInfo = useMemo(() => {
    if (!selectedTable || !schemas) {
      return tableData.columnInfo;
    }
    const schemaData = schemas.find((s) => s.name === selectedTable.schema);
    const tableInfo = schemaData?.tables.find((t) => t.name === selectedTable.table);
    if (!tableInfo) {
      return tableData.columnInfo;
    }
    return tableInfo.columns;
  }, [selectedTable, schemas, tableData.columnInfo]);

  const totalPages = Math.ceil(tableData.totalRows / pagination.pageSize);

  // --- Keyboard shortcuts ---
  // Ctrl+R / Cmd+R: Refresh table data
  useHotkey('Mod+R', (e) => {
    e.preventDefault();
    handleRefresh();
  });

  // Delete / Backspace: Open delete dialog for selected rows
  useHotkey('Delete', () => handleDeletePrompt());
  useHotkey('Backspace', () => handleDeletePrompt());

  // Escape: Deselect all rows
  useHotkey('Escape', () => setSelectedRows(new Set()));

  return (
    <div className="flex h-full">
      {/* Schema Sidebar */}
      <aside className="w-64 shrink-0 border-r">
        <SchemaExplorer
          schemas={schemas ?? []}
          selectedTable={selectedTable}
          isLoading={isLoadingSchema}
          isRefreshing={isFetchingSchema}
          onRefresh={() => refetchSchema()}
          onTableSelect={handleTableSelect}
        />
      </aside>

      {/* Table Data View */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {selectedTable ? (
          <>
            {/* Table Toolbar */}
            <div className="flex shrink-0 items-center justify-between border-b px-4 py-2">
              <div className="flex items-center gap-4">
                <h2 className="font-medium">
                  {selectedTable.schema}.{selectedTable.table}
                </h2>
                {tableData.executionTime !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    {tableData.totalRows} rows • {tableData.executionTime}ms
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <TableFilters
                  columns={tableData.columns}
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                />
                <ColumnVisibility
                  columns={tableData.columns}
                  visibleColumns={visibleColumns}
                  onVisibilityChange={setVisibleColumns}
                />
                <AddRecordDialog
                  columns={tableColumnInfo}
                  onInsert={handleInsertRecord}
                  disabled={isLoadingData}
                />
                {selectedRows.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeletePrompt}
                    disabled={isDeleting}
                  >
                    <TrashIcon className="size-4" />
                    Delete {selectedRows.size} record{selectedRows.size > 1 ? 's' : ''}
                  </Button>
                )}
                <ExportMenu
                  data={tableData.rows}
                  columns={tableData.columns}
                  filename={`${selectedTable.schema}_${selectedTable.table}`}
                  disabled={isLoadingData}
                />

                {/* Pagination */}
                <div className="ml-4 flex items-center gap-2 border-l pl-4">
                  <span className="text-sm text-muted-foreground">
                    {tableData.totalRows > 0
                      ? `${pagination.page * pagination.pageSize + 1}-${Math.min(
                          (pagination.page + 1) * pagination.pageSize,
                          tableData.totalRows,
                        )} of ${tableData.totalRows}`
                      : '0 rows'}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 0 || isLoadingData}
                  >
                    <ChevronLeftIcon className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= totalPages - 1 || isLoadingData}
                  >
                    <ChevronRightIcon className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleRefresh}
                    disabled={isLoadingData}
                  >
                    <RefreshCwIcon className="size-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Data Grid */}
            <div className="flex-1 overflow-hidden">
              <TableDataGrid
                data={tableData.rows}
                columns={tableData.columns}
                columnInfo={tableColumnInfo}
                visibleColumns={visibleColumns}
                selectedRows={selectedRows}
                sortConfig={sortConfig}
                onSortChange={handleSortChange}
                onSelectionChange={setSelectedRows}
                onCellEdit={handleCellEdit}
                isLoading={isLoadingData}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">Select a table from the sidebar to view data</p>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Records"
        description={`Are you sure you want to delete ${selectedRows.size} record${selectedRows.size !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
