'use client';

import { Loader2Icon, PlusIcon } from 'lucide-react';
import { memo, useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ColumnInfo } from '@/server/db-adapters/types';

interface AddRecordDialogProps {
  columns: ColumnInfo[];
  onInsert: (values: Record<string, string>) => Promise<void>;
  disabled?: boolean;
}

export const AddRecordDialog = memo(function AddRecordDialog({
  columns,
  onInsert,
  disabled,
}: AddRecordDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isInserting, setIsInserting] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const handleOpen = useCallback((open: boolean) => {
    setIsOpen(open);
    if (open) {
      setValues({});
      setError(null);
    }
  }, []);

  const handleValueChange = useCallback((column: string, value: string) => {
    setValues((prev) => ({ ...prev, [column]: value }));
  }, []);

  const handleInsert = useCallback(async () => {
    setIsInserting(true);
    setError(null);
    try {
      await onInsert(values);
      setIsOpen(false);
      setValues({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to insert record');
    } finally {
      setIsInserting(false);
    }
  }, [values, onInsert]);

  const editableColumns = columns.filter(
    (col) => !col.defaultValue?.includes('nextval') && !col.isPrimaryKey,
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" disabled={disabled || columns.length === 0}>
            <PlusIcon className="size-4" />
            Add record
          </Button>
        }
      />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Record</DialogTitle>
          <DialogDescription>
            Enter values for the new record. Leave fields empty to use default values.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-4 py-4">
            {editableColumns.map((column) => (
              <div key={column.name} className="grid gap-2">
                <Label htmlFor={column.name} className="flex items-center gap-2">
                  <span className="font-mono text-sm">{column.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {column.type}
                    {!column.nullable && ' • required'}
                  </span>
                </Label>
                <Input
                  id={column.name}
                  placeholder={column.nullable ? 'NULL' : `Enter ${column.type}`}
                  value={values[column.name] || ''}
                  onChange={(e) => handleValueChange(column.name, e.target.value)}
                />
              </div>
            ))}

            {columns.length > editableColumns.length && (
              <p className="text-xs text-muted-foreground">
                {columns.length - editableColumns.length} column(s) hidden (auto-generated)
              </p>
            )}
          </div>
        </ScrollArea>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isInserting}>
            Cancel
          </Button>
          <Button onClick={handleInsert} disabled={isInserting}>
            {isInserting && <Loader2Icon className="size-4 animate-spin" />}
            Insert Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

// Helper to build INSERT statement
export function buildInsertQuery(
  schema: string,
  table: string,
  values: Record<string, string>,
): string {
  const entries = Object.entries(values).filter(([, v]) => v !== '');

  if (entries.length === 0) {
    throw new Error('At least one value is required');
  }

  const columns = entries.map(([col]) => `"${col}"`).join(', ');
  const placeholders = entries
    .map(([, val]) => {
      // Handle NULL explicitly
      if (val.toLowerCase() === 'null') {
        return 'NULL';
      }
      // Escape single quotes
      const escaped = val.replace(/'/g, "''");
      return `'${escaped}'`;
    })
    .join(', ');

  return `INSERT INTO "${schema}"."${table}" (${columns}) VALUES (${placeholders})`;
}
