'use client';

import {
  ChevronDownIcon,
  ChevronRightIcon,
  DatabaseIcon,
  FolderIcon,
  KeyIcon,
  RefreshCwIcon,
  TableIcon,
} from 'lucide-react';
import { memo, useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
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
  onRefresh?: () => void;
  onTableSelect?: (schema: string, table: string) => void;
  onColumnSelect?: (schema: string, table: string, column: string) => void;
}

interface TreeNodeProps {
  label: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
  defaultExpanded?: boolean;
  onClick?: () => void;
  className?: string;
}

function TreeNode({
  label,
  icon,
  children,
  defaultExpanded = false,
  onClick,
  className,
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const hasChildren = !!children;

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
            {isExpanded ? (
              <ChevronDownIcon className="size-4" />
            ) : (
              <ChevronRightIcon className="size-4" />
            )}
          </span>
        )}
        <span className="shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </button>
      {hasChildren && isExpanded && <div className="ml-3 border-l pl-2">{children}</div>}
    </div>
  );
}

function ColumnNode({ column }: { column: Column }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm hover:bg-accent">
      <span className="shrink-0 pl-6">
        {column.isPrimaryKey ? (
          <KeyIcon className="size-3.5 text-yellow-500" />
        ) : (
          <span className="size-3.5" />
        )}
      </span>
      <span className="truncate">{column.name}</span>
      <span className="ml-auto shrink-0 text-xs text-muted-foreground">{column.type}</span>
      {column.nullable && <span className="text-xs text-muted-foreground">?</span>}
    </div>
  );
}

export const SchemaExplorer = memo(function SchemaExplorer({
  schemas,
  isLoading,
  onRefresh,
  onTableSelect,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onColumnSelect: _onColumnSelect,
}: SchemaExplorerProps) {
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span className="text-sm">Loading schema...</span>
        </div>
      </div>
    );
  }

  if (schemas.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
        <DatabaseIcon className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No schemas found</p>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCwIcon className="size-4" />
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
          <Button variant="ghost" size="icon-sm" onClick={onRefresh} title="Refresh schema">
            <RefreshCwIcon className="size-4" />
          </Button>
        )}
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-auto p-2">
        {schemas.map((schema) => (
          <TreeNode
            key={schema.name}
            label={schema.name}
            icon={<FolderIcon className="size-4 text-yellow-500" />}
            defaultExpanded={schema.name === 'public'}
          >
            {schema.tables.map((table) => (
              <TreeNode
                key={`${schema.name}.${table.name}`}
                label={table.name}
                icon={<TableIcon className="size-4 text-blue-500" />}
                onClick={() => onTableSelect?.(schema.name, table.name)}
              >
                {table.columns.map((column) => (
                  <ColumnNode key={column.name} column={column} />
                ))}
              </TreeNode>
            ))}
          </TreeNode>
        ))}
      </div>
    </div>
  );
});
