import { memo } from 'react';

import { Skeleton } from '@/components/ui/skeleton';

interface TableSkeletonRowProps {
  isHeader?: boolean;
}

const TableSkeletonRow = memo(function TableSkeletonRow({
  isHeader = false,
}: TableSkeletonRowProps): React.ReactElement {
  return (
    <div className={`flex items-center gap-4 border-b px-4 py-3 ${isHeader ? 'bg-muted/50' : ''}`}>
      {/* Name column with icon */}
      <div className="flex flex-1 items-center gap-2">
        <Skeleton className="size-4 shrink-0" />
        <Skeleton className={`h-4 ${isHeader ? 'w-16' : 'w-32'}`} />
      </div>
      {/* Type column */}
      <div className="flex-1">
        <Skeleton className={`h-5 ${isHeader ? 'w-12' : 'w-20'} rounded-full`} />
      </div>
      {/* Host column */}
      <div className="flex-1">
        <Skeleton className={`h-4 ${isHeader ? 'w-12' : 'w-36'}`} />
      </div>
      {/* Database column */}
      <div className="flex-1">
        <Skeleton className={`h-4 ${isHeader ? 'w-20' : 'w-24'}`} />
      </div>
      {/* Created at column */}
      <div className="flex-1">
        <Skeleton className={`h-4 ${isHeader ? 'w-24' : 'w-28'}`} />
      </div>
      {/* Actions column */}
      <div className="w-8 shrink-0">
        <Skeleton className="size-8 rounded-md" />
      </div>
    </div>
  );
});

export interface ConnectionsTableSkeletonProps {
  rows?: number;
}

export const ConnectionsTableSkeleton = memo(function ConnectionsTableSkeleton({
  rows = 5,
}: ConnectionsTableSkeletonProps): React.ReactElement {
  return (
    <div className="space-y-4">
      {/* Search bar skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border">
        {/* Header row */}
        <TableSkeletonRow isHeader />

        {/* Data rows */}
        {Array.from({ length: rows }).map((_, index) => (
          <TableSkeletonRow key={index} />
        ))}
      </div>
    </div>
  );
});
