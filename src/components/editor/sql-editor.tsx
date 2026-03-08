'use client';

import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { MySQL, PostgreSQL, SQLite, sql } from '@codemirror/lang-sql';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { tags } from '@lezer/highlight';
import { basicSetup } from 'codemirror';
import { memo, useCallback, useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

// Theme-aware syntax highlighting using CSS variables
const syntaxColors = HighlightStyle.define([
  { tag: tags.keyword, color: 'var(--syntax-keyword, #7c3aed)' },
  { tag: tags.string, color: 'var(--syntax-string, #059669)' },
  { tag: tags.number, color: 'var(--syntax-number, #d97706)' },
  { tag: tags.comment, color: 'var(--syntax-comment, #6b7280)', fontStyle: 'italic' },
  { tag: tags.operator, color: 'var(--syntax-operator, #dc2626)' },
  { tag: tags.function(tags.variableName), color: 'var(--syntax-function, #2563eb)' },
  { tag: tags.typeName, color: 'var(--syntax-type, #0891b2)' },
  { tag: tags.propertyName, color: 'var(--syntax-property, #7c3aed)' },
]);

type DatabaseDialect = 'postgresql' | 'mysql' | 'sqlite';

interface SQLEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  onExecute?: (query: string) => void;
  dialect?: DatabaseDialect;
  schema?: Record<string, string[]>;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

const DIALECT_MAP = {
  postgresql: PostgreSQL,
  mysql: MySQL,
  sqlite: SQLite,
} as const;

export const SQLEditor = memo(function SQLEditor({
  value = '',
  onChange,
  onExecute,
  dialect = 'postgresql',
  schema,
  placeholder: placeholderText = 'SELECT * FROM users WHERE ...',
  readOnly = false,
  className,
}: SQLEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onExecuteRef = useRef(onExecute);

  // Keep refs updated
  onChangeRef.current = onChange;
  onExecuteRef.current = onExecute;

  // Execute query handler (Cmd/Ctrl + Enter)
  const executeQuery = useCallback(() => {
    if (viewRef.current && onExecuteRef.current) {
      const state = viewRef.current.state;
      const selection = state.selection.main;

      // If there's a selection, execute only selected text
      // Otherwise, execute the entire content
      const queryText = selection.empty
        ? state.doc.toString()
        : state.sliceDoc(selection.from, selection.to);

      if (queryText.trim()) {
        onExecuteRef.current(queryText.trim());
      }
    }
    return true;
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: value is intentionally excluded - the second useEffect handles value updates
  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    const sqlDialect = DIALECT_MAP[dialect];

    const extensions = [
      basicSetup,
      sql({
        dialect: sqlDialect,
        upperCaseKeywords: true,
        ...(schema && { schema }),
      }),
      syntaxHighlighting(syntaxColors),
      placeholder(placeholderText),
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged && onChangeRef.current) {
          onChangeRef.current(update.state.doc.toString());
        }
      }),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        {
          key: 'Mod-Enter',
          run: executeQuery,
        },
      ]),
      history(),
      EditorState.readOnly.of(readOnly),
      EditorView.theme({
        '&': {
          height: '100%',
          fontSize: '14px',
          backgroundColor: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
        },
        '.cm-scroller': {
          overflow: 'auto',
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
        },
        '.cm-content': {
          padding: '12px 0',
          caretColor: 'hsl(var(--foreground))',
        },
        '.cm-line': {
          padding: '0 16px',
        },
        '.cm-gutters': {
          backgroundColor: 'hsl(var(--muted))',
          color: 'hsl(var(--muted-foreground))',
          border: 'none',
          borderRight: '1px solid hsl(var(--border))',
        },
        '.cm-activeLineGutter': {
          backgroundColor: 'hsl(var(--accent))',
        },
        '.cm-activeLine': {
          backgroundColor: 'hsl(var(--accent) / 0.5)',
        },
        '.cm-selectionBackground': {
          backgroundColor: 'hsl(var(--primary) / 0.2) !important',
        },
        '.cm-cursor': {
          borderLeftColor: 'hsl(var(--foreground))',
        },
        '.cm-placeholder': {
          color: 'hsl(var(--muted-foreground))',
        },
      }),
    ];

    const state = EditorState.create({
      doc: value,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [dialect, schema, placeholderText, readOnly, executeQuery]);

  // Update content when value prop changes externally
  useEffect(() => {
    if (viewRef.current) {
      const currentValue = viewRef.current.state.doc.toString();
      if (value !== currentValue) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: currentValue.length,
            insert: value,
          },
        });
      }
    }
  }, [value]);

  return (
    <div
      ref={editorRef}
      className={cn('h-full w-full overflow-hidden rounded-md border bg-background', className)}
    />
  );
});
