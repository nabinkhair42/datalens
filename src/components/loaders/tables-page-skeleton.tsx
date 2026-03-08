import { memo } from 'react';

import { SchemaExplorerSkeleton } from './schema-explorer-skeleton';
import { Skeleton } from './skeleton';

// Pre-defined widths that look varied but are deterministic (12 rows x 6 columns)
const GRID_CELL_WIDTHS = [
  ['72%', '58%', '85%', '45%', '68%', '52%'],
  ['55%', '78%', '42%', '65%', '80%', '48%'],
  ['68%', '45%', '72%', '55%', '62%', '75%'],
  ['42%', '82%', '58%', '70%', '48%', '65%'],
  ['75%', '52%', '68%', '45%', '78%', '55%'],
  ['58%', '70%', '45%', '82%', '52%', '68%'],
  ['65%', '48%', '75%', '58%', '70%', '42%'],
  ['78%', '62%', '52%', '72%', '45%', '80%'],
  ['45%', '75%', '65%', '48%', '82%', '58%'],
  ['70%', '55%', '78%', '62%', '52%', '72%'],
  ['52%', '68%', '42%', '75%', '65%', '48%'],
  ['62%', '45%', '80%', '55%', '72%', '65%'],
];

export const TableDataGridSkeleton = memo(function TableDataGridSkeleton(): React.ReactElement {
  return (
    <div className="flex h-full flex-col">
      {/* Table header */}
      <div className="flex shrink-0 gap-px border-b bg-muted/50">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex h-10 flex-1 items-center border-r px-3 last:border-r-0">
            <Skeleton className="h-4 w-full max-w-24" />
          </div>
        ))}
      </div>

      {/* Table rows */}
      <div className="flex-1 overflow-hidden">
        {GRID_CELL_WIDTHS.map((rowWidths, rowIndex) => (
          <div key={rowIndex} className="flex gap-px border-b">
            {rowWidths.map((width, colIndex) => (
              <div
                key={colIndex}
                className="flex h-9 flex-1 items-center border-r px-3 last:border-r-0"
              >
                <Skeleton className="h-4" style={{ width }} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});

const TableToolbarSkeleton = memo(function TableToolbarSkeleton(): React.ReactElement {
  return (
    <div className="flex shrink-0 items-center justify-between border-b px-4 py-2">
      <div className="flex items-center gap-4">
        {/* Table name */}
        <Skeleton className="h-5 w-32" />
        {/* Row count and timing */}
        <Skeleton className="h-4 w-24" />
      </div>

      <div className="flex items-center gap-2">
        {/* Filter button */}
        <Skeleton className="h-8 w-20" />
        {/* Columns button */}
        <Skeleton className="h-8 w-24" />
        {/* Add record button */}
        <Skeleton className="h-8 w-28" />

        {/* Pagination */}
        <div className="ml-4 flex items-center gap-2 border-l pl-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="size-8" />
          <Skeleton className="size-8" />
          <Skeleton className="size-8" />
        </div>
      </div>
    </div>
  );
});

export const TablesPageSkeleton = memo(function TablesPageSkeleton(): React.ReactElement {
  return (
    <div className="flex h-full">
      {/* Schema Sidebar */}
      <aside className="w-64 shrink-0 border-r">
        <SchemaExplorerSkeleton
          schemaCount={2}
          tablesPerSchema={5}
          expandedSchema
          expandedTable={false}
        />
      </aside>

      {/* Table Data View */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Table Toolbar */}
        <TableToolbarSkeleton />

        {/* Data Grid */}
        <div className="flex-1 overflow-hidden">
          <TableDataGridSkeleton />
        </div>
      </div>
    </div>
  );
});

export const TablesEmptyStateSkeleton = memo(
  function TablesEmptyStateSkeleton(): React.ReactElement {
    return (
      <div className="flex h-full">
        {/* Schema Sidebar */}
        <aside className="w-64 shrink-0 border-r">
          <SchemaExplorerSkeleton
            schemaCount={2}
            tablesPerSchema={5}
            expandedSchema
            expandedTable={false}
          />
        </aside>

        {/* Empty State */}
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Skeleton className="mx-auto h-4 w-64" />
          </div>
        </div>
      </div>
    );
  },
);
