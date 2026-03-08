'use client';

import { PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState, useTransition } from 'react';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { ConnectionsTable } from '@/components/tables/connections-table';
import { Button } from '@/components/ui/button';
import { ConnectionForm } from '@/components/workspace/connection-form';
import { useConnections, useDeleteConnection } from '@/hooks/use-connections';
import type { Connection, PaginationParams } from '@/schemas/connection.schema';
import connectionService from '@/services/connection.service';

export default function WorkspacePage() {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

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

  // Use transition to avoid blocking UI while fetching
  const handleEdit = useCallback((connection: Connection) => {
    startTransition(async () => {
      const fullConnection = await connectionService.get(connection.id);
      setEditingConnection(fullConnection);
      setFormOpen(true);
    });
  }, []);

  const handleFormClose = useCallback((open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setEditingConnection(undefined);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-medium">
              {paginatedData?.pagination.total === 1 ? 'Connection' : 'Connections'}
              {paginatedData?.pagination.total ? (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({paginatedData.pagination.total})
                </span>
              ) : null}
            </h1>
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
              isLoading={isLoading || isPending}
              onConnect={handleConnect}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCreateNew={handleOpenForm}
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
