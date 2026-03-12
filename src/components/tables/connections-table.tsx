'use client';

import type { ColumnDef } from '@tanstack/react-table';
import {
  DatabaseIcon,
  MoreVerticalIcon,
  PanelLeftOpen,
  PenLine,
  PlusIcon,
  TrashIcon,
} from 'lucide-react';
import Link from 'next/link';
import { memo, useCallback, useMemo, useState } from 'react';
import { DeleteConnectionDialog } from '@/components/dialogs/delete-connection-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DATABASE_TYPE_LABELS } from '@/config/constants';
import { formatDateTime } from '@/lib/formatters';
import type { Connection } from '@/schemas/connection.schema';

export interface ConnectionsTableProps {
  data: Connection[];
  isLoading?: boolean;
  onConnect: (connection: Connection) => void;
  onEdit: (connection: Connection) => void;
  onDelete: (id: string) => void;
  onCreateNew?: () => void;
  onHover?: (connection: Connection) => void;
}

export const ConnectionsTable = memo(function ConnectionsTable({
  data,
  isLoading,
  onConnect,
  onEdit,
  onDelete,
  onCreateNew,
  onHover,
}: ConnectionsTableProps): React.ReactElement {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleDeleteClick = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingDeleteId(id);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (pendingDeleteId) {
      onDelete(pendingDeleteId);
      setPendingDeleteId(null);
    }
  }, [pendingDeleteId, onDelete]);

  const columns = useMemo<ColumnDef<Connection>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => (
          <Badge variant="secondary">
            {DATABASE_TYPE_LABELS[row.original.type as keyof typeof DATABASE_TYPE_LABELS] ??
              row.original.type}
          </Badge>
        ),
      },
      {
        id: 'username',
        accessorFn: (row) => `${row.username}`,
        header: 'Username',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.username}</span>,
      },
      {
        accessorKey: 'database',
        header: 'Database',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.database}</span>,
      },
      {
        accessorKey: 'createdAt',
        header: 'Created at',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 50,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger onClick={(e) => e.stopPropagation()} className={'cursor-pointer'}>
              <MoreVerticalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onConnect(row.original);
                }}
                className="flex gap-2 items-center justify-start"
              >
                <PanelLeftOpen />
                Open
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(row.original);
                }}
                className="flex gap-2 items-center justify-start"
              >
                <PenLine />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => handleDeleteClick(row.original.id, e)}
                className="flex gap-2 items-center justify-start text-destructive"
              >
                <TrashIcon />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [onConnect, onEdit, handleDeleteClick],
  );

  return (
    <>
      <DeleteConnectionDialog
        open={!!pendingDeleteId}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
        onConfirm={handleDeleteConfirm}
      />
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading ?? false}
        searchPlaceholder="Search connections..."
        enableGlobalFilter
        enablePagination
        pageSize={10}
        onRowClick={onConnect}
        onRowHover={onHover}
        emptyState={{
          icon: <DatabaseIcon className="size-12" />,
          title: 'No connections yet',
          description: 'Create your first database connection to get started',
          action: onCreateNew ? (
            <Button onClick={onCreateNew}>
              <PlusIcon />
              New Connection
            </Button>
          ) : (
            <Button>
              <Link href="/connections/new">
                <PlusIcon />
                New Connection
              </Link>
            </Button>
          ),
        }}
      />
    </>
  );
});
