'use client';

import { ColumnsIcon } from 'lucide-react';
import { memo, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ColumnVisibilityProps {
  columns: string[];
  visibleColumns: Set<string>;
  onVisibilityChange: (columns: Set<string>) => void;
}

export const ColumnVisibility = memo(function ColumnVisibility({
  columns,
  visibleColumns,
  onVisibilityChange,
}: ColumnVisibilityProps) {
  const handleToggle = useCallback(
    (column: string) => {
      const newVisible = new Set(visibleColumns);
      if (newVisible.has(column)) {
        // Don't allow hiding all columns
        if (newVisible.size > 1) {
          newVisible.delete(column);
        }
      } else {
        newVisible.add(column);
      }
      onVisibilityChange(newVisible);
    },
    [visibleColumns, onVisibilityChange],
  );

  const handleShowAll = useCallback(() => {
    onVisibilityChange(new Set(columns));
  }, [columns, onVisibilityChange]);

  const hiddenCount = columns.length - visibleColumns.size;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm">
            <ColumnsIcon className="size-4" />
            Columns
            {hiddenCount > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-1.5 text-xs">
                {hiddenCount} hidden
              </span>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Toggle columns</span>
          {hiddenCount > 0 && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handleShowAll}>
              Show all
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-64 overflow-y-auto">
          {columns.map((column) => (
            <DropdownMenuItem
              key={column}
              className="flex items-center gap-2"
              onSelect={(e) => {
                e.preventDefault();
                handleToggle(column);
              }}
            >
              <Checkbox
                checked={visibleColumns.has(column)}
                onCheckedChange={() => handleToggle(column)}
              />
              <span className="truncate font-mono text-sm">{column}</span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
