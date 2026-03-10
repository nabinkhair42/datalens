'use client';

import { ClockIcon, PlayIcon, SaveIcon, StarIcon, Trash2Icon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { use, useCallback, useState } from 'react';

import { QueryResults } from '@/components/editor/query-results';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useConnection } from '@/hooks/use-connections';
import {
  useCreateSavedQuery,
  useDeleteSavedQuery,
  useExecuteQuery,
  useQueryHistory,
  useSavedQueries,
} from '@/hooks/use-queries';

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
  const { data: history } = useQueryHistory({
    connectionId,
    limit: 20,
  });
  const { data: savedQueries } = useSavedQueries();
  const executeQuery = useExecuteQuery();
  const createSavedQuery = useCreateSavedQuery();
  const deleteSavedQuery = useDeleteSavedQuery();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'saved' | 'history'>('history');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [queryName, setQueryName] = useState('');
  const [queryDescription, setQueryDescription] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
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
    } catch (error) {
      setResults({
        data: [],
        columns: [],
        error: error instanceof Error ? error.message : 'Query execution failed',
      });
    }
  }, [query, connectionId, executeQuery]);

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

  const handleCopy = useCallback(() => {
    if (results.data.length === 0) {
      return;
    }

    const headers = results.columns.join('\t');
    const rows = results.data.map((row) =>
      results.columns
        .map((col) => {
          const value = row[col];
          if (value === null) {
            return '';
          }
          return String(value);
        })
        .join('\t'),
    );

    const text = [headers, ...rows].join('\n');
    navigator.clipboard.writeText(text);
  }, [results]);

  const handleHistoryClick = useCallback((historyQuery: string) => {
    setQuery(historyQuery);
  }, []);

  const handleSaveQuery = useCallback(async () => {
    if (!queryName.trim() || !query.trim()) {
      setSaveError('Query name is required');
      return;
    }

    setSaveError(null);

    try {
      await createSavedQuery.mutateAsync({
        name: queryName.trim(),
        description: queryDescription.trim() || undefined,
        query: query.trim(),
        connectionId,
      });

      // Reset form and close dialog
      setQueryName('');
      setQueryDescription('');
      setSaveDialogOpen(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save query');
    }
  }, [queryName, queryDescription, query, connectionId, createSavedQuery]);

  const handleLoadSavedQuery = useCallback((savedQuery: string) => {
    setQuery(savedQuery);
  }, []);

  const handleDeleteSavedQuery = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await deleteSavedQuery.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete query:', error);
      }
    },
    [deleteSavedQuery],
  );

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Saved & History */}
      <aside className="flex w-64 shrink-0 flex-col border-r">
        {/* Tabs */}
        <div className="flex border-b">
          <Button
            className={`flex items-center justify-center ${
              activeTab === 'saved'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            variant={'ghost'}
            onClick={() => setActiveTab('saved')}
          >
            <StarIcon className="mr-1 inline-block size-4" />
            Saved
          </Button>
          <Button
            className={`flex items-center justify-center ${
              activeTab === 'history'
                ? 'border-b-2 border text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('history')}
            variant={'ghost'}
          >
            <ClockIcon className="mr-1 inline-block size-4" />
            History
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-2">
          {activeTab === 'saved' ? (
            <div className="space-y-1">
              {savedQueries && savedQueries.length > 0 ? (
                savedQueries.map((item) => (
                  <div
                    key={item.id}
                    className="group relative w-full rounded-md p-2 text-left text-sm transition-colors hover:bg-muted"
                  >
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => handleLoadSavedQuery(item.query)}
                    >
                      <p className="truncate font-medium text-sm">{item.name}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {item.query}
                      </p>
                      {item.description && (
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </button>
                    <button
                      type="button"
                      className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => handleDeleteSavedQuery(item.id, e)}
                      disabled={deleteSavedQuery.isPending}
                    >
                      <Trash2Icon className="size-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <StarIcon className="mb-2 size-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No saved queries yet</p>
                  <p className="text-xs text-muted-foreground">Save queries for quick access</p>
                </div>
              )}
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
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger
                render={
                  <Button variant="outline" size="sm" disabled={!query.trim()}>
                    <SaveIcon className="size-4" />
                    Save
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Save Query</DialogTitle>
                  <DialogDescription>Save this query for quick access later.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label htmlFor="query-name">Name</Label>
                    <Input
                      id="query-name"
                      placeholder="My query"
                      value={queryName}
                      onChange={(e) => setQueryName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="query-description">Description (optional)</Label>
                    <Input
                      id="query-description"
                      placeholder="What does this query do?"
                      value={queryDescription}
                      onChange={(e) => setQueryDescription(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Query Preview</Label>
                    <div className="max-h-24 overflow-auto rounded-md bg-muted p-2 font-mono text-xs">
                      {query}
                    </div>
                  </div>
                  {saveError && <p className="text-sm text-destructive">{saveError}</p>}
                </div>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                  <Button
                    onClick={handleSaveQuery}
                    disabled={createSavedQuery.isPending || !queryName.trim()}
                  >
                    {createSavedQuery.isPending ? 'Saving...' : 'Save Query'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
            onCopy={handleCopy}
            onExportCSV={handleExportCSV}
            onExportJSON={handleExportJSON}
          />
        </div>
      </div>
    </div>
  );
}
