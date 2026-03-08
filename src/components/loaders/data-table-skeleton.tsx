import { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Pre-defined widths for skeleton rows
const SKELETON_ROW_WIDTHS = [
  ['65%', '45%', '75%', '55%'],
  ['72%', '58%', '42%', '68%'],
  ['48%', '82%', '65%', '52%'],
  ['78%', '45%', '58%', '72%'],
  ['55%', '68%', '80%', '45%'],
];

export interface DataTableSkeletonProps {
  columnCount?: number;
  rowCount?: number;
  hasSearch?: boolean;
}

export const DataTableSkeleton = memo(function DataTableSkeleton({
  columnCount = 5,
  rowCount = 5,
  hasSearch = true,
}: DataTableSkeletonProps): React.ReactElement {
  return (
    <div className="space-y-4">
      {/* Search skeleton */}
      {hasSearch && <Skeleton className="h-10 w-64" />}

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-lg border">
        {/* Header */}
        <div className="flex gap-4 border-b bg-muted/50 px-4 py-3">
          {Array.from({ length: columnCount }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {/* Rows */}
        {SKELETON_ROW_WIDTHS.slice(0, rowCount).map((widths, rowIndex) => (
          <div key={rowIndex} className="flex gap-4 border-b px-4 py-3">
            {Array.from({ length: columnCount }).map((_, colIndex) => (
              <div key={colIndex} className="flex flex-1 items-center gap-2">
                {colIndex === 0 && <Skeleton className="size-4 shrink-0" />}
                <Skeleton className="h-4" style={{ width: widths[colIndex % widths.length] }} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});
