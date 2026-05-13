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
import { DeleteConnectionDialog } from '@/components/dialogs';
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
import { cn } from '@/lib/utils';
import type { Connection } from '@/schemas/connection.schema';

const DB_ACCENT: Record<string, string> = {
  postgresql: 'bg-sky-500',
  mysql: 'bg-orange-500',
  sqlite: 'bg-blue-500',
  mongodb: 'bg-emerald-500',
  mssql: 'bg-red-500',
};

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
        header: 'Connection',
        cell: ({ row }) => {
          const accent = DB_ACCENT[row.original.type] ?? 'bg-primary';
          return (
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="flex size-7 shrink-0 items-center justify-center rounded-lg border bg-background"
              >
                <span className={cn('size-2 rounded-full', accent)} />
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">{row.original.name}</span>
                <span className="truncate font-mono text-[11px] text-muted-foreground">
                  {row.original.host}:{row.original.port}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => {
          const accent = DB_ACCENT[row.original.type] ?? 'bg-primary';
          return (
            <Badge variant="secondary" className="gap-1.5 font-mono text-[11px]">
              <span className={cn('size-1.5 rounded-full', accent)} aria-hidden />
              {DATABASE_TYPE_LABELS[row.original.type as keyof typeof DATABASE_TYPE_LABELS] ??
                row.original.type}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'database',
        header: 'Database',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-mono text-xs">{row.original.database}</span>
            <span className="text-[11px] text-muted-foreground">{row.original.username}</span>
          </div>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 50,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              className="cursor-pointer rounded-md p-1 hover:bg-muted"
            >
              <MoreVerticalIcon className="size-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onConnect(row.original);
                }}
              >
                <PanelLeftOpen />
                Open
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(row.original);
                }}
              >
                <PenLine />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={(e) => handleDeleteClick(row.original.id, e)}
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
        searchPlaceholder="Search connections by name, host or database…"
        enableGlobalFilter
        enablePagination
        pageSize={10}
        onRowClick={onConnect}
        onRowHover={onHover}
        emptyState={{
          icon: <DatabaseIcon className="size-10" />,
          title: 'No connections yet',
          description:
            'Create your first database connection to start exploring tables and writing queries.',
          action: onCreateNew ? (
            <Button onClick={onCreateNew}>
              <PlusIcon />
              New connection
            </Button>
          ) : (
            <Button>
              <Link href="/connections/new">
                <PlusIcon />
                New connection
              </Link>
            </Button>
          ),
        }}
      />
    </>
  );
});
