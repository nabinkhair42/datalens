'use client';

import { DatabaseIcon, PlusIcon } from 'lucide-react';
import { useCallback, useState } from 'react';

import { ConnectionListSkeleton } from '@/components/loaders';
import { Button } from '@/components/ui/button';
import { useConnections } from '@/hooks/use-connections';
import type { Connection } from '@/schemas/connection.schema';
import { ConnectionCard } from './connection-card';
import { ConnectionForm } from './connection-form';

interface ConnectionListProps {
  onConnect: (connection: Connection) => void;
}

// rendering-hoist-jsx: Extract static empty state JSX
const EmptyStateIcon = <DatabaseIcon className="size-12 text-muted-foreground/50" />;

export function ConnectionList({ onConnect }: ConnectionListProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | undefined>();

  const { data: connections, isLoading, error } = useConnections();

  // rerender-functional-setstate: Use useCallback for stable references
  const handleEdit = useCallback((connection: Connection) => {
    setEditingConnection(connection);
    setFormOpen(true);
  }, []);

  const handleFormClose = useCallback((open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setEditingConnection(undefined);
    }
  }, []);

  const handleOpenForm = useCallback(() => {
    setFormOpen(true);
  }, []);

  if (isLoading) {
    return <ConnectionListSkeleton count={3} />;
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
        <p className="text-destructive">Failed to load connections</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Connections</h2>
          <p className="text-sm text-muted-foreground">Manage your database connections</p>
        </div>
        <Button onClick={handleOpenForm}>
          <PlusIcon className="size-4" />
          New Connection
        </Button>
      </div>

      {!connections?.length ? (
        <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-lg border border-dashed">
          {EmptyStateIcon}
          <div className="text-center">
            <p className="font-medium">No connections yet</p>
            <p className="text-sm text-muted-foreground">
              Add your first database connection to get started
            </p>
          </div>
          <Button onClick={handleOpenForm}>
            <PlusIcon className="size-4" />
            Add Connection
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {connections.map((connection) => (
            <ConnectionCard
              key={connection.id}
              connection={connection}
              onEdit={handleEdit}
              onConnect={onConnect}
            />
          ))}
        </div>
      )}

      <ConnectionForm
        open={formOpen}
        onOpenChange={handleFormClose}
        connection={editingConnection}
      />
    </div>
  );
}
