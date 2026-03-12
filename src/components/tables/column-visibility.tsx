'use client';

import { CheckIcon, SearchIcon, SlidersHorizontal } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
  const [search, setSearch] = useState('');

  const filteredColumns = useMemo(() => {
    if (!search.trim()) {
      return columns;
    }
    const term = search.toLowerCase();
    return columns.filter((col) => col.toLowerCase().includes(term));
  }, [columns, search]);

  const handleToggle = useCallback(
    (column: string) => {
      const newVisible = new Set(visibleColumns);
      if (newVisible.has(column)) {
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

  const handleDeselectAll = useCallback(() => {
    // Keep only the first column visible
    const first = columns[0];
    if (first) {
      onVisibilityChange(new Set([first]));
    }
  }, [columns, onVisibilityChange]);

  const handleSelectAll = useCallback(() => {
    onVisibilityChange(new Set(columns));
  }, [columns, onVisibilityChange]);

  const hiddenCount = columns.length - visibleColumns.size;
  const allVisible = hiddenCount === 0;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline">
            <SlidersHorizontal />
            Columns
            {hiddenCount > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                {hiddenCount} hidden
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-60 p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <span className="text-sm font-medium">Toggle columns</span>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={allVisible ? handleDeselectAll : handleSelectAll}
          >
            {allVisible ? 'Deselect all' : 'Select all'}
          </button>
        </div>

        {/* Search */}
        <div className="border-b px-3 py-2">
          <div className="relative">
            <SearchIcon className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search columns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>

        {/* Column list */}
        <div className="max-h-64 overflow-y-auto py-1">
          {filteredColumns.length > 0 ? (
            filteredColumns.map((column) => {
              const isVisible = visibleColumns.has(column);
              return (
                <button
                  key={column}
                  type="button"
                  className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted"
                  onClick={() => handleToggle(column)}
                >
                  <span className="flex size-4 shrink-0 items-center justify-center">
                    {isVisible && <CheckIcon className="size-3.5 text-foreground" />}
                  </span>
                  <span className="truncate font-mono text-sm">{column}</span>
                </button>
              );
            })
          ) : (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">No columns match</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
});
