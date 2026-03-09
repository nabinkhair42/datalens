'use client';

import {
  ChevronDownIcon,
  ChevronRightIcon,
  DatabaseIcon,
  FolderIcon,
  KeyIcon,
  RefreshCwIcon,
  SearchIcon,
  TableIcon,
  XIcon,
} from 'lucide-react';
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
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onTableSelect?: (schema: string, table: string) => void;
  onColumnSelect?: (schema: string, table: string, column: string) => void;
}

interface TreeNodeProps {
  label: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
  defaultExpanded?: boolean;
  forceExpanded?: boolean;
  highlight?: string | undefined;
  onClick?: () => void;
  className?: string;
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

function TreeNode({
  label,
  icon,
  children,
  defaultExpanded = false,
  forceExpanded = false,
  highlight,
  onClick,
  className,
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const hasChildren = !!children;
  const shouldExpand = forceExpanded || isExpanded;

  const handleToggle = useCallback(() => {
    if (hasChildren) {
      setIsExpanded((prev) => !prev);
    }
    onClick?.();
  }, [hasChildren, onClick]);

  return (
    <div className={className}>
      <button
        type="button"
        className={cn(
          'flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-sm hover:bg-accent',
          !hasChildren && 'pl-6',
        )}
        onClick={handleToggle}
      >
        {hasChildren && (
          <span className="shrink-0">
            {shouldExpand ? (
              <ChevronDownIcon className="size-4" />
            ) : (
              <ChevronRightIcon className="size-4" />
            )}
          </span>
        )}
        <span className="shrink-0">{icon}</span>
        <span className="truncate">
          <HighlightText text={label} highlight={highlight} />
        </span>
      </button>
      {hasChildren && shouldExpand && <div className="ml-3 border-l pl-2">{children}</div>}
    </div>
  );
}

function ColumnNode({ column, highlight }: { column: Column; highlight?: string | undefined }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm hover:bg-accent">
      <span className="shrink-0 pl-6">
        {column.isPrimaryKey ? (
          <KeyIcon className="size-3.5 text-yellow-500" />
        ) : (
          <span className="size-3.5" />
        )}
      </span>
      <span className="truncate">
        <HighlightText text={column.name} highlight={highlight} />
      </span>
      <span className="ml-auto shrink-0 text-xs text-muted-foreground">{column.type}</span>
      {column.nullable && <span className="text-xs text-muted-foreground">?</span>}
    </div>
  );
}

export const SchemaExplorer = memo(function SchemaExplorer({
  schemas,
  isLoading,
  isRefreshing,
  onRefresh,
  onTableSelect,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onColumnSelect: _onColumnSelect,
}: SchemaExplorerProps) {
  const [filter, setFilter] = useState('');

  // Filter schemas, tables, and columns based on search query
  const filteredSchemas = useMemo(() => {
    if (!filter.trim()) {
      return schemas;
    }

    const query = filter.toLowerCase();
    return schemas
      .map((schema) => {
        const schemaMatches = schema.name.toLowerCase().includes(query);
        const filteredTables = schema.tables
          .map((table) => {
            const tableMatches = table.name.toLowerCase().includes(query);
            const filteredColumns = table.columns.filter((col) =>
              col.name.toLowerCase().includes(query),
            );

            // Include table if it matches or any of its columns match
            if (tableMatches || filteredColumns.length > 0) {
              return {
                ...table,
                columns: tableMatches ? table.columns : filteredColumns,
                hasMatch: true,
              };
            }
            return null;
          })
          .filter(Boolean) as (Table & { hasMatch?: boolean })[];

        // Include schema if it matches or any of its tables match
        if (schemaMatches || filteredTables.length > 0) {
          return {
            ...schema,
            tables: schemaMatches ? schema.tables : filteredTables,
            hasMatch: true,
          };
        }
        return null;
      })
      .filter(Boolean) as Schema[];
  }, [schemas, filter]);

  const handleClearFilter = useCallback(() => {
    setFilter('');
  }, []);

  if (isLoading) {
    return <SchemaExplorerSkeleton schemaCount={2} tablesPerSchema={5} expandedSchema />;
  }

  if (schemas.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
        <DatabaseIcon className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No schemas found</p>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
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
        <h3 className="text-sm font-medium">Schema Explorer</h3>
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

      {/* Tree */}
      <div className="flex-1 overflow-auto p-2">
        {filteredSchemas.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <SearchIcon className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No matches found</p>
            <Button variant="link" size="sm" onClick={handleClearFilter}>
              Clear filter
            </Button>
          </div>
        ) : (
          filteredSchemas.map((schema) => (
            <TreeNode
              key={schema.name}
              label={schema.name}
              icon={<FolderIcon className="size-4 text-yellow-500" />}
              defaultExpanded={schema.name === 'public'}
              forceExpanded={!!filter}
              highlight={filter}
            >
              {schema.tables.map((table) => (
                <TreeNode
                  key={`${schema.name}.${table.name}`}
                  label={table.name}
                  icon={<TableIcon className="size-4 text-blue-500" />}
                  onClick={() => onTableSelect?.(schema.name, table.name)}
                  forceExpanded={!!filter}
                  highlight={filter}
                >
                  {table.columns.map((column) => (
                    <ColumnNode key={column.name} column={column} highlight={filter} />
                  ))}
                </TreeNode>
              ))}
            </TreeNode>
          ))
        )}
      </div>
    </div>
  );
});
