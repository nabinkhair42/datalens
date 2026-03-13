'use client';

import { DatabaseIcon, RefreshCwIcon, SearchIcon, TableIcon, TrashIcon, XIcon } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';

import { SchemaExplorerSkeleton } from '@/components/loaders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  onTableDrop?: (schema: string, table: string) => void;
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
          <mark key={i} className="rounded bg-yellow-200 px-0.5 dark:bg-yellow-800">
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
  onTableDrop,
}: SchemaExplorerProps) {
  const [filter, setFilter] = useState('');

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
      {/* Search + Refresh */}
      <div className="shrink-0 border-b p-2">
        <div className="relative flex items-center gap-1">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter tables..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-7 pl-7 pr-7 text-xs"
            />
            {filter && (
              <button
                type="button"
                onClick={handleClearFilter}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 hover:bg-accent"
              >
                <XIcon className="size-3 text-muted-foreground" />
              </button>
            )}
          </div>
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onRefresh}
              title="Refresh schema"
              disabled={isRefreshing}
            >
              <RefreshCwIcon className={cn('size-3.5', isRefreshing && 'animate-spin')} />
            </Button>
          )}
        </div>
      </div>

      {/* Table List */}
      <ScrollArea className="flex-1">
        {filteredTables.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <SearchIcon className="size-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">No matches found</p>
            <Button variant="link" size="xs" onClick={handleClearFilter}>
              Clear filter
            </Button>
          </div>
        ) : (
          <TooltipProvider>
            {filteredTables.map((table) => {
              const isSelected =
                selectedTable?.schema === table.schema && selectedTable?.table === table.name;
              return (
                <button
                  key={`${table.schema}.${table.name}`}
                  type="button"
                  className={cn(
                    'group flex w-full items-center gap-1.5 px-2.5 py-1 text-xs transition-colors',
                    'cursor-pointer hover:bg-accent',
                    isSelected && 'bg-accent',
                  )}
                  onClick={() => onTableSelect?.(table.schema, table.name)}
                >
                  <TableIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">
                    <HighlightText text={table.name} highlight={filter} />
                  </span>
                  {onTableDrop && (
                    <Tooltip>
                      <TooltipTrigger
                        className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTableDrop(table.schema, table.name);
                        }}
                      >
                        <TrashIcon className="size-3" />
                      </TooltipTrigger>
                      <TooltipContent side="right">Drop table</TooltipContent>
                    </Tooltip>
                  )}
                </button>
              );
            })}
          </TooltipProvider>
        )}
      </ScrollArea>
    </div>
  );
});
