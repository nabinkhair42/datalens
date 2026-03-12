import { memo } from 'react';

import { Skeleton } from '@/components/ui/skeleton';

export const SchemaExplorerSkeleton = memo(function SchemaExplorerSkeleton() {
  return (
    <div className="flex h-full flex-col">
      {/* Header — matches "Tables" + refresh button */}
      <div className="flex shrink-0 items-center justify-between border-b px-3 py-2">
        <Skeleton className="h-4 w-14" />
        <Skeleton className="size-7 rounded-md" />
      </div>

      {/* Search bar */}
      <div className="shrink-0 border-b px-3 py-2">
        <Skeleton className="h-8 w-full rounded-md" />
      </div>

      {/* Table list */}
      <div className="flex-1 overflow-hidden py-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-1.5">
            <Skeleton className="size-4 shrink-0 rounded" />
            <Skeleton className="h-4 rounded" style={{ width: `${55 + ((i * 17) % 35)}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
});
