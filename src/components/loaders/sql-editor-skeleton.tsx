import { memo } from 'react';

import { Skeleton } from '@/components/ui/skeleton';

export const SQLEditorSkeleton = memo(function SQLEditorSkeleton(): React.ReactElement {
  return (
    <div className="flex h-full flex-col">
      {/* Toolbar skeleton */}
      <div className="flex shrink-0 items-center gap-2 border-b bg-muted/30 px-3 py-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-8" />
      </div>

      {/* Split pane layout */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Editor area skeleton */}
        <div className="flex-1 border-b p-4">
          <div className="flex h-full flex-col gap-2">
            {/* Line numbers and code lines */}
            <div className="flex gap-3">
              <Skeleton className="h-5 w-6 shrink-0" />
              <Skeleton className="h-5 w-3/4" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-5 w-6 shrink-0" />
              <Skeleton className="h-5 w-1/2" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-5 w-6 shrink-0" />
              <Skeleton className="h-5 w-2/3" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-5 w-6 shrink-0" />
              <Skeleton className="h-5 w-1/3" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-5 w-6 shrink-0" />
              <Skeleton className="h-5 w-4/5" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-5 w-6 shrink-0" />
              <Skeleton className="h-5 w-1/4" />
            </div>
          </div>
        </div>

        {/* Results area skeleton */}
        <div className="flex h-1/3 shrink-0 flex-col">
          {/* Results header */}
          <div className="flex items-center justify-between border-b px-3 py-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-14" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>

          {/* Results table skeleton */}
          <div className="flex-1 overflow-hidden p-2">
            {/* Table header */}
            <div className="flex gap-4 border-b bg-muted/50 px-3 py-2">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 flex-1" />
            </div>
            {/* Table rows */}
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex gap-4 border-b px-3 py-2">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export const SQLEditorToolbarSkeleton = memo(
  function SQLEditorToolbarSkeleton(): React.ReactElement {
    return (
      <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-8" />
      </div>
    );
  },
);

export const QueryResultsSkeleton = memo(function QueryResultsSkeleton(): React.ReactElement {
  return (
    <div className="flex h-full flex-col">
      {/* Results header */}
      <div className="flex shrink-0 items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-14" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>

      {/* Results table */}
      <div className="flex-1 overflow-hidden">
        {/* Table header */}
        <div className="flex gap-4 border-b bg-muted px-3 py-2">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 flex-1" />
        </div>
        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex gap-4 border-b px-3 py-2">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
});
