'use client';

import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { MySQL, PostgreSQL, SQLite, sql } from '@codemirror/lang-sql';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { memo, useCallback, useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

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
      oneDark,
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
        },
        '.cm-scroller': {
          overflow: 'auto',
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
        },
        '.cm-content': {
          padding: '12px 0',
        },
        '.cm-line': {
          padding: '0 16px',
        },
        '.cm-gutters': {
          backgroundColor: 'transparent',
          border: 'none',
        },
        '.cm-activeLineGutter': {
          backgroundColor: 'transparent',
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
