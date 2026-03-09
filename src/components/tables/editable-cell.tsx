'use client';

import { CheckIcon, XIcon } from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EditableCellProps {
  value: unknown;
  rowIndex: number;
  column: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (value: string) => void;
  onCancel: () => void;
}

export const EditableCell = memo(function EditableCell({
  value,
  rowIndex: _rowIndex,
  column: _column,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
}: EditableCellProps) {
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      const stringValue =
        value === null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
      setEditValue(stringValue);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isEditing, value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onSave(editValue);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    },
    [editValue, onSave, onCancel],
  );

  const handleSave = useCallback(() => {
    onSave(editValue);
  }, [editValue, onSave]);

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-7 min-w-[100px] font-mono text-sm"
          placeholder="NULL"
        />
        <Button variant="ghost" size="icon-sm" onClick={handleSave} className="size-6 shrink-0">
          <CheckIcon className="size-3" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onCancel} className="size-6 shrink-0">
          <XIcon className="size-3" />
        </Button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        'max-w-[300px] truncate cursor-pointer rounded px-1 -mx-1 hover:bg-accent/50 text-left',
        'font-mono text-sm',
      )}
      onDoubleClick={onStartEdit}
      title="Double-click to edit"
    >
      {value === null ? (
        <span className="text-muted-foreground">NULL</span>
      ) : typeof value === 'object' ? (
        <span className="text-xs">{JSON.stringify(value)}</span>
      ) : (
        String(value)
      )}
    </button>
  );
});
