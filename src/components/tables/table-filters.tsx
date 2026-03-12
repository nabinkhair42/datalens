'use client';

import { FilterIcon, PlusIcon, XIcon } from 'lucide-react';
import { memo, useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface TableFilter {
  id: string;
  column: string;
  operator: FilterOperator;
  value: string;
}

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'is_null'
  | 'is_not_null';

const OPERATORS: { value: FilterOperator; label: string; needsValue: boolean }[] = [
  { value: 'equals', label: 'equals', needsValue: true },
  { value: 'not_equals', label: 'not equals', needsValue: true },
  { value: 'contains', label: 'contains', needsValue: true },
  { value: 'starts_with', label: 'starts with', needsValue: true },
  { value: 'ends_with', label: 'ends with', needsValue: true },
  { value: 'greater_than', label: 'greater than', needsValue: true },
  { value: 'less_than', label: 'less than', needsValue: true },
  { value: 'is_null', label: 'is null', needsValue: false },
  { value: 'is_not_null', label: 'is not null', needsValue: false },
];

interface TableFiltersProps {
  columns: string[];
  filters: TableFilter[];
  onFiltersChange: (filters: TableFilter[]) => void;
}

function ActiveFilter({
  filter,
  onRemove,
}: {
  filter: TableFilter;
  onRemove: (id: string) => void;
}) {
  const operatorLabel = OPERATORS.find((op) => op.value === filter.operator)?.label;
  return (
    <div className="flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1.5 text-sm">
      <span className="font-mono font-medium">{filter.column}</span>
      <span className="text-muted-foreground">{operatorLabel}</span>
      {filter.value && <span className="font-mono text-primary">&quot;{filter.value}&quot;</span>}
      <Button
        variant="ghost"
        size="icon-sm"
        className="ml-auto size-5 shrink-0"
        onClick={() => onRemove(filter.id)}
      >
        <XIcon className="size-3" />
      </Button>
    </div>
  );
}

export const TableFilters = memo(function TableFilters({
  columns,
  filters,
  onFiltersChange,
}: TableFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newFilter, setNewFilter] = useState<Partial<TableFilter>>({
    column: columns[0] || '',
    operator: 'equals',
    value: '',
  });

  const handleAddFilter = useCallback(() => {
    if (!newFilter.column || !newFilter.operator) {
      return;
    }

    const operator = OPERATORS.find((op) => op.value === newFilter.operator);
    if (operator?.needsValue && !newFilter.value) {
      return;
    }

    const filter: TableFilter = {
      id: crypto.randomUUID(),
      column: newFilter.column,
      operator: newFilter.operator as FilterOperator,
      value: newFilter.value || '',
    };

    onFiltersChange([...filters, filter]);
    setNewFilter({
      column: columns[0] || '',
      operator: 'equals',
      value: '',
    });
  }, [newFilter, filters, columns, onFiltersChange]);

  const handleRemoveFilter = useCallback(
    (id: string) => {
      onFiltersChange(filters.filter((f) => f.id !== id));
    },
    [filters, onFiltersChange],
  );

  const handleClearAll = useCallback(() => {
    onFiltersChange([]);
  }, [onFiltersChange]);

  const currentOperator = OPERATORS.find((op) => op.value === newFilter.operator);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm">
            <FilterIcon className="size-4" />
            Filters
            {filters.length > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                {filters.length}
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent align="start" className="w-[420px] p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="text-sm font-medium">Filters</h4>
          {filters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground"
              onClick={handleClearAll}
            >
              Clear all
            </Button>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Active filters */}
          {filters.length > 0 && (
            <div className="space-y-1.5">
              {filters.map((filter) => (
                <ActiveFilter key={filter.id} filter={filter} onRemove={handleRemoveFilter} />
              ))}
            </div>
          )}

          {/* New filter form */}
          <div className="space-y-2.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Add filter
            </p>

            {/* Column + Operator row */}
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={newFilter.column}
                onValueChange={(value) =>
                  value && setNewFilter((prev) => ({ ...prev, column: value }))
                }
              >
                <SelectTrigger size="sm">
                  <SelectValue placeholder="Column" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>
                      <span className="font-mono text-sm">{col}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={newFilter.operator}
                onValueChange={(value) =>
                  setNewFilter((prev) => ({ ...prev, operator: value as FilterOperator }))
                }
              >
                <SelectTrigger size="sm">
                  <SelectValue placeholder="Operator" />
                </SelectTrigger>
                <SelectContent>
                  {OPERATORS.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Value + Add button row */}
            <div className="flex gap-2">
              {currentOperator?.needsValue ? (
                <Input
                  placeholder="Enter value..."
                  value={newFilter.value || ''}
                  onChange={(e) => setNewFilter((prev) => ({ ...prev, value: e.target.value }))}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddFilter();
                    }
                  }}
                />
              ) : (
                <div className="flex flex-1 items-center rounded-md border bg-muted/30 px-3 text-sm text-muted-foreground">
                  No value needed
                </div>
              )}

              <Button size="sm" onClick={handleAddFilter} className="shrink-0">
                <PlusIcon className="size-4" />
                Add
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});

// Helper to build WHERE clause from filters
export function buildWhereClause(filters: TableFilter[]): string {
  if (filters.length === 0) {
    return '';
  }

  const conditions = filters.map((filter) => {
    const col = `"${filter.column}"`;
    const val = filter.value.replace(/'/g, "''"); // Escape single quotes

    switch (filter.operator) {
      case 'equals':
        return `${col} = '${val}'`;
      case 'not_equals':
        return `${col} != '${val}'`;
      case 'contains':
        return `${col} ILIKE '%${val}%'`;
      case 'starts_with':
        return `${col} ILIKE '${val}%'`;
      case 'ends_with':
        return `${col} ILIKE '%${val}'`;
      case 'greater_than':
        return `${col} > '${val}'`;
      case 'less_than':
        return `${col} < '${val}'`;
      case 'is_null':
        return `${col} IS NULL`;
      case 'is_not_null':
        return `${col} IS NOT NULL`;
      default:
        return '';
    }
  });

  return `WHERE ${conditions.filter(Boolean).join(' AND ')}`;
}
