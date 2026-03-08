'use client';

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ColumnsIcon,
  FilterIcon,
  PlusIcon,
  RefreshCwIcon,
} from 'lucide-react';
import { use, useCallback, useState } from 'react';

import { SchemaExplorer } from '@/components/editor/schema-explorer';
import { TableDataGrid } from '@/components/tables/table-data-grid';
import { Button } from '@/components/ui/button';
import { useConnectionSchema } from '@/hooks/use-connections';
import { useExecuteQuery } from '@/hooks/use-queries';

interface TablesPageProps {
  params: Promise<{ connectionId: string }>;
}

export default function TablesPage({ params }: TablesPageProps) {
  const { connectionId } = use(params);
  const {
    data: schemas,
    isLoading: isLoadingSchema,
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
    totalRows: number;
    executionTime?: number | undefined;
  }>({
    rows: [],
    columns: [],
    totalRows: 0,
  });

  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 50,
  });

  const [isLoadingData, setIsLoadingData] = useState(false);

  const loadTableData = useCallback(
    async (schema: string, table: string, page: number, pageSize: number) => {
      setIsLoadingData(true);
      try {
        const offset = page * pageSize;
        const result = await executeQuery.mutateAsync({
          connectionId,
          query: `SELECT * FROM "${schema}"."${table}" LIMIT ${pageSize} OFFSET ${offset}`,
        });

        // Get total count
        const countResult = await executeQuery.mutateAsync({
          connectionId,
          query: `SELECT COUNT(*) as count FROM "${schema}"."${table}"`,
        });

        const totalRows =
          countResult.rows[0] && typeof countResult.rows[0]['count'] === 'number'
            ? countResult.rows[0]['count']
            : typeof countResult.rows[0]?.['count'] === 'string'
              ? parseInt(countResult.rows[0]['count'] as string, 10)
              : 0;

        setTableData({
          rows: result.rows || [],
          columns: result.columns?.map((c) => c.name) || [],
          totalRows,
          executionTime: result.executionTime,
        });
      } catch (error) {
        console.error('Failed to load table data:', error);
        setTableData({
          rows: [],
          columns: [],
          totalRows: 0,
        });
      } finally {
        setIsLoadingData(false);
      }
    },
    [connectionId, executeQuery],
  );

  const handleTableSelect = useCallback(
    (schema: string, table: string) => {
      setSelectedTable({ schema, table });
      setPagination({ page: 0, pageSize: 50 });
      loadTableData(schema, table, 0, 50);
    },
    [loadTableData],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (selectedTable) {
        setPagination((prev) => ({ ...prev, page: newPage }));
        loadTableData(selectedTable.schema, selectedTable.table, newPage, pagination.pageSize);
      }
    },
    [selectedTable, pagination.pageSize, loadTableData],
  );

  const handleRefresh = useCallback(() => {
    if (selectedTable) {
      loadTableData(
        selectedTable.schema,
        selectedTable.table,
        pagination.page,
        pagination.pageSize,
      );
    }
  }, [selectedTable, pagination, loadTableData]);

  const totalPages = Math.ceil(tableData.totalRows / pagination.pageSize);

  return (
    <div className="flex h-full">
      {/* Schema Sidebar */}
      <aside className="w-64 shrink-0 border-r">
        <SchemaExplorer
          schemas={schemas ?? []}
          isLoading={isLoadingSchema}
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
                <Button variant="outline" size="sm" disabled>
                  <FilterIcon className="size-4" />
                  Filters
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <ColumnsIcon className="size-4" />
                  Columns
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <PlusIcon className="size-4" />
                  Add record
                </Button>

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
    </div>
  );
}
