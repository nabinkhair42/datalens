'use client';
import {
  ChevronDownIcon,
  DatabaseIcon,
  RefreshCwIcon,
  SearchIcon,
  TableIcon,
  TrashIcon,
  XIcon,
} from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';

import { SchemaExplorerSkeleton } from '@/components/loaders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
          <mark key={i} className="rounded-sm bg-primary/15 px-0.5 text-primary dark:bg-primary/25">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

function formatRowCount(count?: number) {
  if (count === undefined || count === null) {
    return null;
  }
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return count.toLocaleString();
}

interface TableRowItemProps {
  schema: string;
  name: string;
  rowCount?: number | undefined;
  filter: string;
  isSelected: boolean;
  onTableSelect?: ((schema: string, table: string) => void) | undefined;
  onTableDrop?: ((schema: string, table: string) => void) | undefined;
}

function TableRowItem({
  schema,
  name,
  rowCount,
  filter,
  isSelected,
  onTableSelect,
  onTableDrop,
}: TableRowItemProps) {
  const formattedCount = formatRowCount(rowCount);
  const handleSelect = () => onTableSelect?.(schema, name);
  return (
    <div
      role="button"
      tabIndex={0}
      data-selected={isSelected}
      className={cn(
        'group relative flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
        'cursor-pointer hover:bg-accent/60',
        isSelected && 'bg-accent text-foreground',
      )}
      onClick={handleSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSelect();
        }
      }}
    >
      <span
        aria-hidden
        className={cn(
          'absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-primary transition-opacity',
          isSelected ? 'opacity-100' : 'opacity-0',
        )}
      />
      <TableIcon
        className={cn(
          'size-3.5 shrink-0 transition-colors',
          isSelected ? 'text-primary' : 'text-muted-foreground',
        )}
      />
      <span className="min-w-0 flex-1 truncate font-medium">
        <HighlightText text={name} highlight={filter} />
      </span>
      {formattedCount && (
        <span
          className={cn(
            'shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground/70 transition-opacity',
            onTableDrop ? 'group-hover:opacity-0' : '',
          )}
        >
          {formattedCount}
        </span>
      )}
      {onTableDrop && (
        <Tooltip>
          <TooltipTrigger
            className="absolute right-1.5 top-1/2 shrink-0 -translate-y-1/2 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onTableDrop(schema, name);
            }}
          >
            <TrashIcon className="size-3" />
          </TooltipTrigger>
          <TooltipContent side="right">Drop table</TooltipContent>
        </Tooltip>
      )}
    </div>
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
  const [collapsedSchemas, setCollapsedSchemas] = useState<Set<string>>(new Set());

  const totalTables = useMemo(
    () => schemas.reduce((acc, s) => acc + s.tables.length, 0),
    [schemas],
  );

  const filteredSchemas = useMemo(() => {
    if (!filter.trim()) {
      return schemas;
    }
    const query = filter.toLowerCase();
    return schemas
      .map((schema) => ({
        ...schema,
        tables: schema.tables.filter((t) => t.name.toLowerCase().includes(query)),
      }))
      .filter((s) => s.tables.length > 0);
  }, [schemas, filter]);

  const filteredCount = useMemo(
    () => filteredSchemas.reduce((acc, s) => acc + s.tables.length, 0),
    [filteredSchemas],
  );

  const handleClearFilter = useCallback(() => {
    setFilter('');
  }, []);

  const toggleSchema = useCallback((name: string) => {
    setCollapsedSchemas((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  if (isLoading) {
    return <SchemaExplorerSkeleton />;
  }

  if (schemas.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
          <DatabaseIcon className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">No tables found</p>
          <p className="text-xs text-muted-foreground">
            This connection has no schemas or tables yet.
          </p>
        </div>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCwIcon className={cn(isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
        )}
      </div>
    );
  }

  // Auto-expand single-schema view; for multiple, render collapsible groups.
  const showSchemaGroups = schemas.length > 1;

  return (
    <div className="flex h-full flex-col">
      {/* Search + Refresh */}
      <div className="shrink-0 px-2 py-2">
        <InputGroup className="h-8">
          <InputGroupAddon align="inline-start">
            <SearchIcon className="size-3.5" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Filter tables..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-7 text-xs"
          />
          <InputGroupAddon align="inline-end">
            {filter && (
              <InputGroupButton
                variant="ghost"
                size="icon-xs"
                onClick={handleClearFilter}
                aria-label="Clear filter"
              >
                <XIcon />
              </InputGroupButton>
            )}
            {onRefresh && (
              <InputGroupButton
                variant="ghost"
                size="icon-xs"
                onClick={onRefresh}
                disabled={isRefreshing}
                aria-label="Refresh schema"
              >
                <RefreshCwIcon className={cn(isRefreshing && 'animate-spin')} />
              </InputGroupButton>
            )}
          </InputGroupAddon>
        </InputGroup>
      </div>

      <Separator />

      {/* Table list */}
      <ScrollArea className="flex-1">
        {filteredCount === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
            <SearchIcon className="size-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              No tables match <span className="font-medium text-foreground">"{filter}"</span>
            </p>
            <Button variant="link" size="xs" onClick={handleClearFilter}>
              Clear filter
            </Button>
          </div>
        ) : (
          <TooltipProvider>
            <div className="flex flex-col gap-0.5 p-1.5">
              {filteredSchemas.map((schema) => {
                const isCollapsed = collapsedSchemas.has(schema.name);
                return (
                  <div key={schema.name} className="flex flex-col">
                    {showSchemaGroups && (
                      <button
                        type="button"
                        className="group flex items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
                        onClick={() => toggleSchema(schema.name)}
                      >
                        <ChevronDownIcon
                          className={cn(
                            'size-3 shrink-0 transition-transform',
                            isCollapsed && '-rotate-90',
                          )}
                        />
                        <DatabaseIcon className="size-3 shrink-0" />
                        <span className="min-w-0 flex-1 truncate">{schema.name}</span>
                        <span className="shrink-0 font-mono text-[10px] font-medium tabular-nums text-muted-foreground/70">
                          {schema.tables.length}
                        </span>
                      </button>
                    )}
                    {!isCollapsed && (
                      <div className={cn('flex flex-col gap-0.5', showSchemaGroups && 'pl-1')}>
                        {schema.tables.map((table) => {
                          const isSelected =
                            selectedTable?.schema === schema.name &&
                            selectedTable?.table === table.name;
                          return (
                            <TableRowItem
                              key={`${schema.name}.${table.name}`}
                              schema={schema.name}
                              name={table.name}
                              rowCount={table.rowCount}
                              filter={filter}
                              isSelected={isSelected}
                              onTableSelect={onTableSelect}
                              onTableDrop={onTableDrop}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </TooltipProvider>
        )}
      </ScrollArea>

      {/* Footer count */}
      <div className="shrink-0 border-t px-3 py-1.5">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <TableIcon className="size-3" />
            {filter ? (
              <>
                <span className="font-medium tabular-nums text-foreground">{filteredCount}</span>
                <span>of</span>
                <span className="tabular-nums">{totalTables}</span>
              </>
            ) : (
              <>
                <span className="font-medium tabular-nums text-foreground">{totalTables}</span>
                <span>{totalTables === 1 ? 'table' : 'tables'}</span>
              </>
            )}
          </span>
          {schemas.length > 1 && (
            <Badge variant="outline" className="h-4 gap-1 px-1.5 text-[10px]">
              {schemas.length} schemas
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
});
