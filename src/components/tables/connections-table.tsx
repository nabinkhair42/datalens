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
import { memo, useCallback, useMemo } from 'react';
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
}

export const ConnectionsTable = memo(function ConnectionsTable({
  data,
  isLoading,
  onConnect,
  onEdit,
  onDelete,
  onCreateNew,
}: ConnectionsTableProps): React.ReactElement {
  const handleDelete = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm('Are you sure you want to delete this connection?')) {
        onDelete(id);
      }
    },
    [onDelete],
  );

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
              <MoreVerticalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onConnect(row.original);
                }}
                className="flex gap-2 items-center justify-start"
              >
                <PanelLeftOpen className="size-4" />
                Open
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(row.original);
                }}
                className="flex gap-2 items-center justify-start"
              >
                <PenLine className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => handleDelete(row.original.id, e)}
                className="flex gap-2 items-center justify-start text-destructive"
              >
                <TrashIcon className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [onConnect, onEdit, handleDelete],
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading ?? false}
      searchPlaceholder="Search connections..."
      enableGlobalFilter
      enablePagination
      pageSize={10}
      onRowClick={onConnect}
      emptyState={{
        icon: <DatabaseIcon className="size-12" />,
        title: 'No connections yet',
        description: 'Create your first database connection to get started',
        action: onCreateNew ? (
          <Button onClick={onCreateNew}>
            <PlusIcon className="size-4" />
            New Connection
          </Button>
        ) : (
          <Button asChild>
            <Link href="/connections/new">
              <PlusIcon className="size-4" />
              New Connection
            </Link>
          </Button>
        ),
      }}
    />
  );
});
