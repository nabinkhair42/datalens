import { memo } from 'react';

import { Skeleton } from './skeleton';

export const WorkspaceHeaderSkeleton = memo(function WorkspaceHeaderSkeleton(): React.ReactElement {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-3">
        {/* Back button */}
        <Skeleton className="size-8" />
        {/* Connection selector */}
        <div className="flex items-center gap-2">
          <Skeleton className="size-4" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="size-4" />
        </div>
        {/* Database type badge */}
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>

      {/* Navigation tabs */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="size-8" />
      </div>
    </header>
  );
});

export interface WorkspaceSkeletonProps {
  variant?: 'tables' | 'sql-editor' | 'default';
}

export const WorkspaceSkeleton = memo(function WorkspaceSkeleton({
  variant = 'default',
}: WorkspaceSkeletonProps): React.ReactElement {
  return (
    <div className="flex h-screen flex-col">
      {/* Header skeleton */}
      <WorkspaceHeaderSkeleton />

      {/* Content area skeleton */}
      <div className="flex flex-1 overflow-hidden">
        {variant === 'tables' && <TablesContentSkeleton />}
        {variant === 'sql-editor' && <SQLEditorContentSkeleton />}
        {variant === 'default' && <DefaultContentSkeleton />}
      </div>
    </div>
  );
});

const TablesContentSkeleton = memo(function TablesContentSkeleton(): React.ReactElement {
  return (
    <div className="flex flex-1 flex-col p-6">
      {/* Page title */}
      <div className="mb-6">
        <Skeleton className="mb-2 h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Search and filters */}
      <div className="mb-4 flex items-center gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border">
        {/* Header */}
        <div className="flex gap-4 border-b bg-muted/50 px-4 py-3">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
        </div>
        {/* Rows */}
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex gap-4 border-b px-4 py-3">
            <div className="flex flex-1 items-center gap-2">
              <Skeleton className="size-4" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="size-8" />
          </div>
        ))}
      </div>
    </div>
  );
});

// Pre-defined widths that look varied but are deterministic
const EDITOR_LINE_WIDTHS = ['72%', '58%', '85%', '45%', '68%', '52%'];

const SQLEditorContentSkeleton = memo(function SQLEditorContentSkeleton(): React.ReactElement {
  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar - Schema Explorer */}
      <aside className="w-64 shrink-0 border-r">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="size-7" />
          </div>
          <div className="flex-1 p-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex items-center gap-1.5 rounded-md px-2 py-1">
                <Skeleton className="size-4" />
                <Skeleton className="size-4" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main editor area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
          <div className="flex-1" />
          <Skeleton className="h-8 w-28" />
        </div>

        {/* Editor */}
        <div className="flex-1 border-b p-4">
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex gap-3">
                <Skeleton className="h-5 w-6" />
                <Skeleton className="h-5" style={{ width: EDITOR_LINE_WIDTHS[index] }} />
              </div>
            ))}
          </div>
        </div>

        {/* Results area */}
        <div className="h-1/3 shrink-0">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <Skeleton className="h-4 w-20" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
          <div className="p-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex gap-4 border-b px-3 py-2">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
});

const DefaultContentSkeleton = memo(function DefaultContentSkeleton(): React.ReactElement {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="space-y-4 text-center">
        <Skeleton className="mx-auto size-16 rounded-lg" />
        <Skeleton className="mx-auto h-6 w-48" />
        <Skeleton className="mx-auto h-4 w-64" />
      </div>
    </div>
  );
});

export const DashboardSkeleton = memo(function DashboardSkeleton(): React.ReactElement {
  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-8" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="size-8" />
          <Skeleton className="size-8 rounded-full" />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-6xl">
          {/* Page header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Skeleton className="mb-2 h-8 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-10 w-36" />
          </div>

          {/* Cards grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-md" />
                    <div>
                      <Skeleton className="mb-1 h-5 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="size-8" />
                </div>
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
});
