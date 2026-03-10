'use client';

import { useQueryClient } from '@tanstack/react-query';
import { PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { PageLoader } from '@/components/loaders/spinner';
import { useAuth } from '@/components/providers/auth-provider';
import { ConnectionsTable } from '@/components/tables/connections-table';
import { Button } from '@/components/ui/button';
import { ConnectionForm } from '@/components/workspace/connection-form';
import { QUERY_KEYS } from '@/config/constants';
import { useConnections, useDeleteConnection } from '@/hooks/use-connections';
import type { Connection, PaginationParams } from '@/schemas/connection.schema';
import connectionService from '@/services/connection.service';

export default function WorkspacePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoading: isAuthLoading, isAuthenticated } = useAuth();
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

      // Fetch full connection (with password) via React Query cache.
      // If cached from a previous edit, this returns instantly. Otherwise fetches in background.
      const fullConnection = await queryClient.fetchQuery({
        queryKey: QUERY_KEYS.CONNECTION(connection.id),
        queryFn: () => connectionService.get(connection.id),
        staleTime: 2 * 60 * 1000, // 2 min — don't refetch if recently loaded
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

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-medium">Connections</h1>
            <Button size="sm" onClick={handleOpenForm}>
              <PlusIcon className="size-4" />
              New Connection
            </Button>
          </div>

          {error ? (
            <div className="py-12 text-center">
              <p className="text-destructive">Failed to load connections</p>
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
