'use client';

import { useQueryClient } from '@tanstack/react-query';
import { DatabaseIcon, PlusIcon, SparklesIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { PageLoader } from '@/components/loaders/spinner';
import { useAuth } from '@/components/providers/auth-provider';
import { ConnectionsTable } from '@/components/tables';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConnectionForm } from '@/components/workspace/connection-form';
import { QUERY_KEYS } from '@/config/constants';
import { useConnections, useDeleteConnection } from '@/hooks/use-connections';
import type { Connection, PaginationParams } from '@/schemas/connection.schema';
import connectionService from '@/services/connection.service';

export default function WorkspacePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoading: isAuthLoading, isAuthenticated, session } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | undefined>(undefined);
  const paginationParams = useMemo<PaginationParams>(
    () => ({
      page: 1,
      limit: 50,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }),
    [],
  );

  const { data: paginatedData, isLoading, error } = useConnections(paginationParams);
  const connections = paginatedData?.data;
  const deleteConnection = useDeleteConnection();

  const handleConnect = useCallback(
    (connection: Connection) => {
      router.push(`/workspace/${connection.id}/tables`);
    },
    [router],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteConnection.mutate(id);
    },
    [deleteConnection],
  );

  const handleOpenForm = useCallback(() => {
    setEditingConnection(undefined);
    setFormOpen(true);
  }, []);

  const handleEdit = useCallback(
    async (connection: Connection) => {
      // Open form instantly with data we already have from the list (everything except password)
      setEditingConnection(connection);
      setFormOpen(true);

      // Fetch full connection (with password) from the server.
      // If we have a cached version WITH a password (from a previous edit), use it.
      // Otherwise always fetch fresh — the hover-seeded cache has no password.
      const cached = queryClient.getQueryData<Connection>(QUERY_KEYS.CONNECTION(connection.id));
      const fullConnection =
        cached?.password !== undefined
          ? cached
          : await queryClient.fetchQuery({
              queryKey: QUERY_KEYS.CONNECTION(connection.id),
              queryFn: () => connectionService.get(connection.id),
              staleTime: 0, // always refetch to ensure password is included
            });

      // Update form with full data (password field fills in)
      setEditingConnection(fullConnection);
    },
    [queryClient],
  );

  // Seed the individual connection cache on hover so navigation is instant.
  // Do NOT prefetch schema here — it takes 10s+ on serverless DB and blocks
  // the browser's 6-connection limit, queuing critical requests behind it.
  // Schema is prefetched later in the workspace header once user has committed.
  const handleHover = useCallback(
    (connection: Connection) => {
      queryClient.setQueryData(QUERY_KEYS.CONNECTION(connection.id), connection);
    },
    [queryClient],
  );

  const handleFormClose = useCallback((open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setEditingConnection(undefined);
    }
  }, []);

  // Show loader only while auth is resolving — connections are already fetching in parallel.
  // Once auth resolves: if not authenticated, AuthProvider redirects; if authenticated, data may already be cached.
  if (isAuthLoading || !isAuthenticated) {
    return <PageLoader />;
  }

  const connectionCount = connections?.length ?? 0;
  const userName = session?.user?.name?.split(' ')[0] ?? session?.user?.email?.split('@')[0];

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="space-y-6">
          {/* Hero header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-2">
              {userName && (
                <Badge
                  variant="secondary"
                  className="w-fit gap-1.5 px-2.5 py-0.5 font-mono text-[11px]"
                >
                  <SparklesIcon className="size-3 text-primary" />
                  Welcome back, {userName}
                </Badge>
              )}
              <div className="flex items-end gap-3">
                <h1 className="font-heading text-2xl font-semibold tracking-tight">Connections</h1>
                {!isLoading && connectionCount > 0 && (
                  <Badge
                    variant="outline"
                    className="mb-1 h-5 gap-1 px-1.5 font-mono text-[10px] tabular-nums"
                  >
                    <DatabaseIcon className="size-3" />
                    {connectionCount}
                  </Badge>
                )}
              </div>
              <p className="max-w-xl text-sm text-muted-foreground">
                Pick a database to explore tables, run SQL, and edit rows in a single workspace.
              </p>
            </div>
            <Button onClick={handleOpenForm} size="lg">
              <PlusIcon />
              New connection
            </Button>
          </div>

          {error ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
              <p className="text-sm font-medium text-destructive">Failed to load connections</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Check your network and refresh the page.
              </p>
            </div>
          ) : (
            <ConnectionsTable
              data={connections ?? []}
              isLoading={isLoading}
              onConnect={handleConnect}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCreateNew={handleOpenForm}
              onHover={handleHover}
            />
          )}
        </div>
      </main>

      <ConnectionForm
        open={formOpen}
        onOpenChange={handleFormClose}
        connection={editingConnection}
      />
    </div>
  );
}
