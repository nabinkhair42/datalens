'use client';

import { PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { ConnectionsTable } from '@/components/tables/connections-table';
import { Button } from '@/components/ui/button';
import { ConnectionForm } from '@/components/workspace/connection-form';
import { useConnections, useDeleteConnection } from '@/hooks/use-connections';
import type { Connection } from '@/schemas/connection.schema';
import connectionService from '@/services/connection.service';

export default function WorkspacePage() {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | undefined>(undefined);
  const { data: connections, isLoading, error } = useConnections();
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

  const handleEdit = useCallback(async (connection: Connection) => {
    // Fetch connection with password for editing
    const fullConnection = await connectionService.get(connection.id);
    setEditingConnection(fullConnection);
    setFormOpen(true);
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
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-medium">
              {connections?.length === 1 ? 'Connection' : 'Connections'}
            </h1>
            <Button size="sm" onClick={handleOpenForm}>
              <PlusIcon className="size-4" />
              New Connection
            </Button>
          </div>

          {/* Error State */}
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
