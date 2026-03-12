'use client';

import { CheckIcon, Loader2Icon, PencilIcon, XIcon } from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { ColumnInfo } from '@/server/db-adapters/types';

type EditorType = 'text' | 'boolean' | 'enum' | 'number' | 'date' | 'json';

function getEditorType(columnInfo?: ColumnInfo): EditorType {
  if (!columnInfo) {
    return 'text';
  }

  const type = columnInfo.type.toLowerCase();

  if (type === 'boolean') {
    return 'boolean';
  }

  if (columnInfo.enumValues && columnInfo.enumValues.length > 0) {
    return 'enum';
  }

  if (
    type === 'integer' ||
    type === 'bigint' ||
    type === 'smallint' ||
    type === 'numeric' ||
    type === 'real' ||
    type === 'double precision'
  ) {
    return 'number';
  }

  if (type === 'date' || type === 'timestamp' || type === 'timestamptz' || type === 'time') {
    return 'date';
  }

  if (type === 'json' || type === 'jsonb') {
    return 'json';
  }

  return 'text';
}

// --- Sub-editors ---

interface SubEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onTab?: ((shiftKey: boolean) => void) | undefined;
  isSaving: boolean;
}

function BooleanEditor({ value, onChange, onSave, isSaving }: SubEditorProps) {
  return (
    <Select
      value={value || 'null'}
      onValueChange={(v) => {
        onChange(v === 'null' || v === null ? '' : v);
        // Auto-save on selection
        requestAnimationFrame(() => onSave());
      }}
      disabled={isSaving}
    >
      <SelectTrigger className="h-7 min-w-[120px] font-mono text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="true">true</SelectItem>
        <SelectItem value="false">false</SelectItem>
        <SelectItem value="null">NULL</SelectItem>
      </SelectContent>
    </Select>
  );
}

interface EnumEditorProps extends SubEditorProps {
  enumValues: string[];
  nullable: boolean;
}

function EnumEditor({ value, onChange, onSave, enumValues, nullable, isSaving }: EnumEditorProps) {
  return (
    <Select
      value={value || '__null__'}
      onValueChange={(v) => {
        onChange(v === '__null__' || v === null ? '' : v);
        requestAnimationFrame(() => onSave());
      }}
      disabled={isSaving}
    >
      <SelectTrigger className="h-7 min-w-[120px] font-mono text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {nullable && <SelectItem value="__null__">NULL</SelectItem>}
        {enumValues.map((val) => (
          <SelectItem key={val} value={val}>
            {val}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function NumberEditor({ value, onChange, onSave, onCancel, onTab, isSaving }: SubEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        onTab?.(e.shiftKey);
      }
    },
    [onSave, onCancel, onTab],
  );

  return (
    <Input
      ref={inputRef}
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={onCancel}
      className="h-7 min-w-[120px] font-mono text-sm"
      placeholder="NULL"
      disabled={isSaving}
      step="any"
    />
  );
}

function DateEditor({
  value,
  onChange,
  onSave,
  onCancel,
  onTab,
  isSaving,
}: SubEditorProps & { columnType: string }) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        onTab?.(e.shiftKey);
      }
    },
    [onSave, onCancel, onTab],
  );

  return (
    <Input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={onCancel}
      className="h-7 min-w-[160px] font-mono text-sm"
      placeholder="YYYY-MM-DD"
      disabled={isSaving}
    />
  );
}

function JsonEditor({ value, onChange, onSave, onCancel, isSaving }: SubEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    });
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    },
    [onSave, onCancel],
  );

  return (
    <div className="flex flex-col gap-1">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={onCancel}
        className={cn(
          'min-h-[80px] min-w-[200px] rounded-md border border-input bg-background px-2 py-1',
          'font-mono text-xs resize-y focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        )}
        placeholder="JSON value"
        disabled={isSaving}
      />
      <span className="text-xs text-muted-foreground">Ctrl+Enter to save</span>
    </div>
  );
}

function TextEditor({ value, onChange, onSave, onCancel, onTab, isSaving }: SubEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        onTab?.(e.shiftKey);
      }
    },
    [onSave, onCancel, onTab],
  );

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={onCancel}
      className="h-7 min-w-[120px] font-mono text-sm"
      placeholder="NULL"
      disabled={isSaving}
    />
  );
}

// --- Editor resolver ---

function CellEditorSwitch({
  editorType,
  subEditorProps,
  columnInfo,
}: {
  editorType: EditorType;
  subEditorProps: SubEditorProps;
  columnInfo?: ColumnInfo | undefined;
}) {
  switch (editorType) {
    case 'boolean':
      return <BooleanEditor {...subEditorProps} />;
    case 'enum':
      return (
        <EnumEditor
          {...subEditorProps}
          enumValues={columnInfo?.enumValues ?? []}
          nullable={columnInfo?.nullable ?? true}
        />
      );
    case 'number':
      return <NumberEditor {...subEditorProps} />;
    case 'date':
      return <DateEditor {...subEditorProps} columnType={columnInfo?.type ?? 'date'} />;
    case 'json':
      return <JsonEditor {...subEditorProps} />;
    default:
      return <TextEditor {...subEditorProps} />;
  }
}

// --- Display value ---

function CellDisplayValue({ value }: { value: unknown }) {
  if (value === null) {
    return <span className="text-muted-foreground italic">NULL</span>;
  }
  if (typeof value === 'boolean') {
    return <span className={value ? 'text-green-600' : 'text-red-500'}>{String(value)}</span>;
  }
  if (typeof value === 'object') {
    return <span className="text-xs">{JSON.stringify(value)}</span>;
  }
  return <>{String(value)}</>;
}

// --- Inline save/cancel buttons ---

function SaveCancelButtons({
  onSave,
  onCancel,
  isSaving,
}: {
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        onMouseDown={(e) => {
          e.preventDefault();
          onSave();
        }}
        className="size-6 shrink-0"
        disabled={isSaving}
      >
        {isSaving ? (
          <Loader2Icon className="size-3 animate-spin" />
        ) : (
          <CheckIcon className="size-3 text-green-600" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onMouseDown={(e) => {
          e.preventDefault();
          onCancel();
        }}
        className="size-6 shrink-0"
        disabled={isSaving}
      >
        <XIcon className="size-3 text-destructive" />
      </Button>
    </>
  );
}

// --- Main EditableCell ---

interface EditableCellProps {
  value: unknown;
  columnInfo?: ColumnInfo | undefined;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (value: string) => Promise<void>;
  onCancel: () => void;
  onTab?: ((shiftKey: boolean) => void) | undefined;
}

export const EditableCell = memo(function EditableCell({
  value,
  columnInfo,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
  onTab,
}: EditableCellProps) {
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const editorType = getEditorType(columnInfo);

  useEffect(() => {
    if (isEditing) {
      const stringValue =
        value === null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
      setEditValue(stringValue);
    }
  }, [isEditing, value]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave(editValue);
    } finally {
      setIsSaving(false);
    }
  }, [editValue, onSave]);

  if (isEditing) {
    const subEditorProps: SubEditorProps = {
      value: editValue,
      onChange: setEditValue,
      onSave: handleSave,
      onCancel,
      onTab,
      isSaving,
    };

    const showSaveCancel = editorType !== 'boolean' && editorType !== 'enum';

    return (
      <div className="flex items-center gap-1 -my-1">
        <CellEditorSwitch
          editorType={editorType}
          subEditorProps={subEditorProps}
          columnInfo={columnInfo}
        />
        {showSaveCancel && (
          <SaveCancelButtons onSave={handleSave} onCancel={onCancel} isSaving={isSaving} />
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        'group/cell max-w-[300px] truncate cursor-pointer rounded px-1 -mx-1 hover:bg-accent/50 text-left',
        'font-mono text-sm inline-flex items-center gap-1',
      )}
      onDoubleClick={onStartEdit}
      title="Double-click to edit"
    >
      <span className="truncate">
        <CellDisplayValue value={value} />
      </span>
      <PencilIcon className="size-3 shrink-0 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity" />
    </button>
  );
});
