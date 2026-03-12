import { memo } from 'react';

import { Skeleton } from '@/components/ui/skeleton';

interface TableNodeSkeletonProps {
  columnCount?: number;
  isExpanded?: boolean;
}

const TableNodeSkeleton = memo(function TableNodeSkeleton({
  columnCount = 4,
  isExpanded = false,
}: TableNodeSkeletonProps): React.ReactElement {
  return (
    <div>
      <div className="flex items-center gap-1.5 rounded-md px-2 py-1 pl-2">
        <Skeleton className="size-4 shrink-0 w-full h-6" />
      </div>
      {isExpanded && (
        <div className="border-l ml-3 pl-2">
          {Array.from({ length: columnCount }).map((_, index) => (
            <div key={index} className="flex items-center gap-1.5 rounded-md px-2 py-1 pl-8">
              <Skeleton className="size-3.5 shrink-0" />
              <Skeleton className="h-4 w-16" />
              <div className="ml-auto">
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export interface SchemaExplorerSkeletonProps {
  schemaCount?: number;
  tablesPerSchema?: number;
  expandedSchema?: boolean;
  expandedTable?: boolean;
}

export const SchemaExplorerSkeleton = memo(function SchemaExplorerSkeleton({
  schemaCount = 2,
  tablesPerSchema = 4,
  expandedSchema = true,
  expandedTable = false,
}: SchemaExplorerSkeletonProps): React.ReactElement {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b px-3 py-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="size-7" />
      </div>

      {/* Tree structure */}
      <div className="flex-1 overflow-auto p-2">
        {Array.from({ length: schemaCount }).map((_, schemaIndex) => (
          <div key={schemaIndex} className="mb-1">
            {/* Schema node */}
            <div className="flex items-center gap-1.5 rounded-md px-2 py-1">
              <Skeleton className="size-4 shrink-0" />
              <Skeleton className="h-4 w-24" />
            </div>
            {expandedSchema && (
              <div className="ml-3 border-l pl-2">
                {Array.from({ length: tablesPerSchema }).map((_, tableIndex) => (
                  <TableNodeSkeleton key={tableIndex} isExpanded={expandedTable} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});
