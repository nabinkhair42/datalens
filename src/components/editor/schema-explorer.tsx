'use client';

import { DatabaseIcon, RefreshCwIcon, SearchIcon, TableIcon, XIcon } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';

import { SchemaExplorerSkeleton } from '@/components/loaders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey?: boolean | undefined;
  isForeignKey?: boolean | undefined;
  defaultValue?: string | undefined;
}

interface Table {
  name: string;
  schema: string;
  columns: Column[];
  rowCount?: number | undefined;
}

interface Schema {
  name: string;
  tables: Table[];
}

interface SchemaExplorerProps {
  schemas: Schema[];
  selectedTable?: { schema: string; table: string } | null;
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onTableSelect?: (schema: string, table: string) => void;
  onColumnSelect?: (schema: string, table: string, column: string) => void;
}

function HighlightText({ text, highlight }: { text: string; highlight?: string | undefined }) {
  if (!highlight) {
    return <>{text}</>;
  }
  const parts = text.split(
    new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
  );
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

export const SchemaExplorer = memo(function SchemaExplorer({
  schemas,
  selectedTable,
  isLoading,
  isRefreshing,
  onRefresh,
  onTableSelect,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onColumnSelect: _onColumnSelect,
}: SchemaExplorerProps) {
  const [filter, setFilter] = useState('');

  // Flatten all tables from all schemas for simple list view
  const allTables = useMemo(() => {
    return schemas.flatMap((schema) =>
      schema.tables.map((table) => ({
        schema: schema.name,
        name: table.name,
        columns: table.columns,
        rowCount: table.rowCount,
      })),
    );
  }, [schemas]);

  // Filter tables based on search query
  const filteredTables = useMemo(() => {
    if (!filter.trim()) {
      return allTables;
    }
    const query = filter.toLowerCase();
    return allTables.filter((table) => table.name.toLowerCase().includes(query));
  }, [allTables, filter]);

  const handleClearFilter = useCallback(() => {
    setFilter('');
  }, []);

  if (isLoading) {
    return <SchemaExplorerSkeleton />;
  }

  if (schemas.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
        <DatabaseIcon className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No tables found</p>
        {onRefresh && (
          <Button variant="outline" onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCwIcon className={cn('size-4', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b px-3 py-2">
        <h3 className="text-sm font-medium">Tables</h3>
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onRefresh}
            title="Refresh schema"
            disabled={isRefreshing}
          >
            <RefreshCwIcon className={cn('size-4', isRefreshing && 'animate-spin')} />
          </Button>
        )}
      </div>

      {/* Search/Filter */}
      <div className="shrink-0 border-b px-3 py-2">
        <div className="relative">
          <SearchIcon className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter tables..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-8 pl-8 pr-8 text-sm"
          />
          {filter && (
            <button
              type="button"
              onClick={handleClearFilter}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 hover:bg-accent"
            >
              <XIcon className="size-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Table List */}
      <div className="flex-1 overflow-auto py-1">
        {filteredTables.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <SearchIcon className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No matches found</p>
            <Button variant="link" onClick={handleClearFilter}>
              Clear filter
            </Button>
          </div>
        ) : (
          filteredTables.map((table) => {
            const isSelected =
              selectedTable?.schema === table.schema && selectedTable?.table === table.name;
            return (
              <button
                key={`${table.schema}.${table.name}`}
                type="button"
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors',
                  'hover:bg-accent',
                  isSelected && 'bg-accent',
                )}
                onClick={() => onTableSelect?.(table.schema, table.name)}
              >
                <TableIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">
                  <HighlightText text={table.name} highlight={filter} />
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
});
