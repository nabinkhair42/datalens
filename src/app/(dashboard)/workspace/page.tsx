'use client';

import { PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { DashboardHeader } from '@/components/layout/dashboard-header';
import { ConnectionsTable } from '@/components/tables/connections-table';
import { Button } from '@/components/ui/button';
import { useConnections, useDeleteConnection } from '@/hooks/use-connections';
import type { Connection } from '@/schemas/connection.schema';

export default function WorkspacePage() {
  const router = useRouter();
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
            <Button size="sm" asChild>
              <Link href="/connections/new">
                <PlusIcon className="size-4" />
                New Connection
              </Link>
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
              onDelete={handleDelete}
            />
          )}
        </div>
      </main>
    </div>
  );
}
