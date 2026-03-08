'use client';

import { ClockIcon, PlayIcon, SaveIcon, StarIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { use, useCallback, useState } from 'react';

import { QueryResults } from '@/components/editor/query-results';
import { Button } from '@/components/ui/button';
import { useConnection } from '@/hooks/use-connections';
import { useExecuteQuery, useQueryHistory } from '@/hooks/use-queries';

// Dynamic import for SQL Editor to avoid SSR issues with CodeMirror
const SQLEditor = dynamic(
  () => import('@/components/editor/sql-editor').then((mod) => mod.SQLEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    ),
  },
);

interface SQLEditorPageProps {
  params: Promise<{ connectionId: string }>;
}

export default function SQLEditorPage({ params }: SQLEditorPageProps) {
  const { connectionId } = use(params);
  const { data: connection } = useConnection(connectionId);
  const { data: history, refetch: refetchHistory } = useQueryHistory({ connectionId, limit: 20 });
  const executeQuery = useExecuteQuery();

  const [query, setQuery] = useState('SELECT * FROM users LIMIT 10;');
  const [activeTab, setActiveTab] = useState<'saved' | 'history'>('history');
  const [results, setResults] = useState<{
    data: Record<string, unknown>[];
    columns: string[];
    executionTime?: number | undefined;
    error?: string | null | undefined;
  }>({
    data: [],
    columns: [],
  });

  const handleExecute = useCallback(async () => {
    if (!query.trim()) {
      return;
    }

    setResults((prev) => ({ ...prev, error: null }));

    try {
      const result = await executeQuery.mutateAsync({
        connectionId,
        query: query.trim(),
      });

      setResults({
        data: result.rows || [],
        columns: result.columns?.map((c) => c.name) || [],
        executionTime: result.executionTime ?? undefined,
        error: null,
      });

      // Refresh history after execution
      refetchHistory();
    } catch (error) {
      setResults({
        data: [],
        columns: [],
        error: error instanceof Error ? error.message : 'Query execution failed',
      });
    }
  }, [query, connectionId, executeQuery, refetchHistory]);

  const handleExportCSV = useCallback(() => {
    if (results.data.length === 0) {
      return;
    }

    const headers = results.columns.join(',');
    const rows = results.data.map((row) =>
      results.columns
        .map((col) => {
          const value = row[col];
          if (value === null) {
            return '';
          }
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value);
        })
        .join(','),
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results]);

  const handleExportJSON = useCallback(() => {
    if (results.data.length === 0) {
      return;
    }

    const json = JSON.stringify(results.data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results]);

  const handleHistoryClick = useCallback((historyQuery: string) => {
    setQuery(historyQuery);
  }, []);

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Saved & History */}
      <aside className="flex w-64 shrink-0 flex-col border-r">
        {/* Tabs */}
        <div className="flex border-b">
          <button
            type="button"
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'saved'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('saved')}
          >
            <StarIcon className="mr-1 inline-block size-4" />
            Saved
          </button>
          <button
            type="button"
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('history')}
          >
            <ClockIcon className="mr-1 inline-block size-4" />
            History
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-2">
          {activeTab === 'saved' ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <StarIcon className="mb-2 size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No saved queries yet</p>
              <p className="text-xs text-muted-foreground">Save queries for quick access</p>
            </div>
          ) : (
            <div className="space-y-1">
              {history && history.length > 0 ? (
                history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="w-full rounded-md p-2 text-left text-sm transition-colors hover:bg-muted"
                    onClick={() => handleHistoryClick(item.query)}
                  >
                    <p className="truncate font-mono text-xs">{item.query}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.success ? (
                        <span className="text-green-600">{item.rowCount} rows</span>
                      ) : (
                        <span className="text-destructive">Failed</span>
                      )}
                      {' • '}
                      {item.executionTime}ms
                    </p>
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <ClockIcon className="mb-2 size-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Your history is empty</p>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Editor Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Editor Toolbar */}
        <div className="flex shrink-0 items-center justify-between border-b px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Untitled</span>
            <Button variant="outline" size="sm" disabled>
              <SaveIcon className="size-4" />
              Save
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Press Cmd/Ctrl + Enter to run</span>
          </div>
        </div>

        {/* SQL Editor */}
        <div className="flex-1 border-b">
          <SQLEditor
            value={query}
            onChange={setQuery}
            onExecute={handleExecute}
            dialect={(connection?.type as 'postgresql' | 'mysql' | 'sqlite') ?? 'postgresql'}
            placeholder="Write your SQL query here..."
          />
        </div>

        {/* Run Button Bar */}
        <div className="flex shrink-0 items-center gap-2 border-b bg-muted/30 px-4 py-2">
          <span className="text-sm text-muted-foreground">Ready to connect</span>
          <Button
            size="sm"
            onClick={handleExecute}
            disabled={executeQuery.isPending || !query.trim()}
          >
            <PlayIcon className="size-4" />
            {executeQuery.isPending ? 'Running...' : 'Run'}
          </Button>
        </div>

        {/* Results Panel */}
        <div className="h-72 shrink-0">
          <QueryResults
            data={results.data}
            columns={results.columns}
            executionTime={results.executionTime}
            isLoading={executeQuery.isPending}
            error={results.error}
            onExportCSV={handleExportCSV}
            onExportJSON={handleExportJSON}
          />
        </div>
      </div>
    </div>
  );
}
