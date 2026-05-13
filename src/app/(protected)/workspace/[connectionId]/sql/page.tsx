'use client';

import { useHotkey } from '@tanstack/react-hotkeys';
import {
  CheckCircle2Icon,
  ClockIcon,
  Loader2,
  PlayIcon,
  SaveIcon,
  StarIcon,
  Trash2Icon,
  XCircleIcon,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { use, useCallback, useEffect, useRef, useState } from 'react';

import { SaveQueryDialog } from '@/components/dialogs';
import { QueryResults } from '@/components/editor/query-results';
import { WorkspaceSidebar } from '@/components/layout/workspace-sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useConnection } from '@/hooks/use-connections';
import {
  useCreateSavedQuery,
  useDeleteSavedQuery,
  useExecuteQuery,
  useQueryHistory,
  useSavedQueries,
} from '@/hooks/use-queries';
import { cn } from '@/lib/utils';

// Dynamic import for SQL Editor to avoid SSR issues with CodeMirror
const SQLEditor = dynamic(
  () => import('@/components/editor/sql-editor').then((mod) => mod.SQLEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

interface SQLEditorPageProps {
  params: Promise<{ connectionId: string }>;
}

interface SidebarTabProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  count?: number | undefined;
  onClick: () => void;
}

function SidebarTab({ active, icon, label, count, onClick }: SidebarTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-active={active}
      className={cn(
        'group relative inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-colors',
        active ? 'text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'absolute inset-0 -z-10 rounded-md bg-background shadow-sm ring-1 ring-border transition-opacity',
          active ? 'opacity-100' : 'opacity-0',
        )}
      />
      <span className="[&_svg]:size-3.5">{icon}</span>
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            'rounded-full px-1.5 py-px font-mono text-[10px] tabular-nums',
            active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function formatRelativeTime(value: string | Date | undefined) {
  if (!value) {
    return '';
  }
  const date = typeof value === 'string' ? new Date(value) : value;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ago`;
  }
  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}h ago`;
  }
  return `${Math.floor(seconds / 86400)}d ago`;
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
  const [results, setResults] = useState<{
    data: Record<string, unknown>[];
    columns: string[];
    executionTime?: number | undefined;
    error?: string | null | undefined;
  }>({
    data: [],
    columns: [],
  });

  const resultsRef = useRef(results);
  useEffect(() => {
    resultsRef.current = results;
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
    const { data, columns } = resultsRef.current;
    if (data.length === 0) {
      return;
    }

    const headers = columns.join(',');
    const rows = data.map((row) =>
      columns
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
  }, []);

  const handleExportJSON = useCallback(() => {
    const { data } = resultsRef.current;
    if (data.length === 0) {
      return;
    }

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleCopy = useCallback(() => {
    const { data, columns } = resultsRef.current;
    if (data.length === 0) {
      return;
    }

    const headers = columns.join('\t');
    const rows = data.map((row) =>
      columns
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
  }, []);

  const handleHistoryClick = useCallback((historyQuery: string) => {
    setQuery(historyQuery);
  }, []);

  const handleSaveQuery = useCallback(
    async (name: string, description: string | undefined) => {
      await createSavedQuery.mutateAsync({
        name,
        description,
        query: query.trim(),
        connectionId,
      });
      setSaveDialogOpen(false);
    },
    [query, connectionId, createSavedQuery],
  );

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

  // --- Keyboard shortcuts ---
  useHotkey('Mod+S', (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSaveDialogOpen(true);
    }
  });

  useHotkey('Mod+Enter', (e) => {
    e.preventDefault();
    handleExecute();
  });

  const queryCharCount = query.length;
  const hasQuery = query.trim().length > 0;

  return (
    <div className="flex h-full">
      <WorkspaceSidebar connectionId={connectionId}>
        <div className="shrink-0 px-2 py-2">
          <div
            role="tablist"
            aria-label="Query source"
            className="flex items-center gap-1 rounded-lg bg-muted/60 p-1"
          >
            <SidebarTab
              active={activeTab === 'history'}
              icon={<ClockIcon />}
              label="History"
              count={history?.length}
              onClick={() => setActiveTab('history')}
            />
            <SidebarTab
              active={activeTab === 'saved'}
              icon={<StarIcon />}
              label="Saved"
              count={savedQueries?.length}
              onClick={() => setActiveTab('saved')}
            />
          </div>
        </div>

        <Separator />

        <ScrollArea className="flex-1 p-1.5">
          {activeTab === 'saved' ? (
            <SavedQueriesList
              items={savedQueries}
              onLoad={handleLoadSavedQuery}
              onDelete={handleDeleteSavedQuery}
              isDeleting={deleteSavedQuery.isPending}
            />
          ) : (
            <HistoryList items={history} onLoad={handleHistoryClick} />
          )}
        </ScrollArea>
      </WorkspaceSidebar>

      {/* Main editor area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top toolbar */}
        <div className="flex h-11 shrink-0 items-center justify-between gap-3 border-b bg-background px-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <PlayIcon className="size-3.5" />
            <span className="font-medium text-foreground">Query editor</span>
            {hasQuery && (
              <>
                <Separator orientation="vertical" className="mx-1 h-3" />
                <span className="font-mono tabular-nums">{queryCharCount} chars</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              disabled={!hasQuery}
              onClick={() => setSaveDialogOpen(true)}
              hotKeys="Mod+S"
            >
              <SaveIcon />
              Save
            </Button>
            <Separator orientation="vertical" className="mx-1 h-5" />
            <Button
              size="sm"
              onClick={handleExecute}
              disabled={executeQuery.isPending || !hasQuery}
              hotKeys="Mod+Enter"
            >
              {executeQuery.isPending ? <Loader2 className="animate-spin" /> : <PlayIcon />}
              {executeQuery.isPending ? 'Running…' : 'Run'}
            </Button>
            <SaveQueryDialog
              open={saveDialogOpen}
              onOpenChange={setSaveDialogOpen}
              query={query}
              onSave={handleSaveQuery}
              isSaving={createSavedQuery.isPending}
            />
          </div>
        </div>

        {/* SQL editor */}
        <div className="min-h-0 flex-1">
          <SQLEditor
            value={query}
            onChange={setQuery}
            onExecute={handleExecute}
            dialect={(connection?.type as 'postgresql' | 'mysql' | 'sqlite') ?? 'postgresql'}
            placeholder="Write your SQL query here…"
          />
        </div>

        {/* Results panel */}
        <div className="h-72 shrink-0 border-t">
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

interface SavedQueryItem {
  id: string;
  name: string;
  description?: string | null | undefined;
  query: string;
}

interface SavedQueriesListProps {
  items: SavedQueryItem[] | undefined;
  onLoad: (query: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  isDeleting: boolean;
}

function SavedQueriesList({ items, onLoad, onDelete, isDeleting }: SavedQueriesListProps) {
  if (!items || items.length === 0) {
    return <SidebarEmptyState icon={<StarIcon />} message="No saved queries yet" />;
  }
  return (
    <div className="flex flex-col gap-1">
      {items.map((item) => (
        <div
          key={item.id}
          className="group relative rounded-md p-2 transition-colors hover:bg-accent/60"
        >
          <button
            type="button"
            className="block w-full text-left"
            onClick={() => onLoad(item.query)}
          >
            <div className="flex items-center gap-1.5">
              <StarIcon className="size-3 shrink-0 text-amber-500" />
              <p className="min-w-0 flex-1 truncate text-xs font-medium">{item.name}</p>
            </div>
            <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground/80">
              {item.query}
            </p>
            {item.description && (
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {item.description}
              </p>
            )}
          </button>
          <button
            type="button"
            className="absolute right-1.5 top-1.5 rounded p-1 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
            onClick={(e) => onDelete(item.id, e)}
            disabled={isDeleting}
            aria-label="Delete saved query"
          >
            <Trash2Icon className="size-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

interface HistoryItem {
  id: string;
  query: string;
  success: boolean;
  rowCount?: number | null | undefined;
  executionTime?: number | null | undefined;
  createdAt?: string | Date | undefined;
}

interface HistoryListProps {
  items: HistoryItem[] | undefined;
  onLoad: (query: string) => void;
}

function HistoryList({ items, onLoad }: HistoryListProps) {
  if (!items || items.length === 0) {
    return <SidebarEmptyState icon={<ClockIcon />} message="Your history is empty" />;
  }
  return (
    <div className="flex flex-col gap-1">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="group flex flex-col gap-1.5 rounded-md p-2 text-left transition-colors hover:bg-accent/60"
          onClick={() => onLoad(item.query)}
        >
          <p className="line-clamp-2 font-mono text-[11px] leading-snug text-foreground/90">
            {item.query}
          </p>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            {item.success ? (
              <Badge
                variant="outline"
                className="h-4 gap-1 border-emerald-500/30 px-1.5 text-[10px] text-emerald-600 dark:text-emerald-400"
              >
                <CheckCircle2Icon className="size-2.5" />
                {item.rowCount ?? 0} {item.rowCount === 1 ? 'row' : 'rows'}
              </Badge>
            ) : (
              <Badge variant="destructive" className="h-4 gap-1 px-1.5 text-[10px]">
                <XCircleIcon className="size-2.5" />
                Failed
              </Badge>
            )}
            {item.executionTime !== undefined && item.executionTime !== null && (
              <span className="tabular-nums">{item.executionTime}ms</span>
            )}
            {item.createdAt && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span>{formatRelativeTime(item.createdAt)}</span>
              </>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

function SidebarEmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <div className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-4">
        {icon}
      </div>
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}
