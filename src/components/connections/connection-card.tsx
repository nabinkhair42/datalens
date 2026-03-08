'use client';

import {
  CheckCircleIcon,
  LoaderIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlayIcon,
  Trash2Icon,
  XCircleIcon,
} from 'lucide-react';
import { memo, useCallback, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DATABASE_TYPE_LABELS } from '@/config/constants';
import { useDeleteConnection, useTestConnection } from '@/hooks/use-connections';
import type { Connection } from '@/schemas/connection.schema';

interface ConnectionCardProps {
  connection: Connection;
  onEdit: (connection: Connection) => void;
  onConnect: (connection: Connection) => void;
}

// rerender-memo: Memoize component to prevent unnecessary re-renders
export const ConnectionCard = memo(function ConnectionCard({
  connection,
  onEdit,
  onConnect,
}: ConnectionCardProps) {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const testConnection = useTestConnection();
  const deleteConnection = useDeleteConnection();

  // rerender-functional-setstate: Use useCallback for stable handler references
  const handleTest = useCallback(async () => {
    setTestStatus('testing');
    try {
      await testConnection.mutateAsync(connection.id);
      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 3000);
    } catch {
      setTestStatus('error');
      setTimeout(() => setTestStatus('idle'), 3000);
    }
  }, [connection.id, testConnection]);

  const handleDelete = useCallback(async () => {
    if (window.confirm(`Are you sure you want to delete "${connection.name}"?`)) {
      await deleteConnection.mutateAsync(connection.id);
    }
  }, [connection.id, connection.name, deleteConnection]);

  const handleEditClick = useCallback(() => {
    onEdit(connection);
  }, [connection, onEdit]);

  const handleConnectClick = useCallback(() => {
    onConnect(connection);
  }, [connection, onConnect]);

  const getStatusIcon = () => {
    switch (testStatus) {
      case 'testing':
        return <LoaderIcon className="size-4 animate-spin text-muted-foreground" />;
      case 'success':
        return <CheckCircleIcon className="size-4 text-green-500" />;
      case 'error':
        return <XCircleIcon className="size-4 text-destructive" />;
      default:
        return null;
    }
  };

  const dbLabel =
    DATABASE_TYPE_LABELS[connection.type as keyof typeof DATABASE_TYPE_LABELS] ?? connection.type;

  return (
    <div className="group relative flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/50">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-medium">{connection.name}</h3>
            {getStatusIcon()}
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {connection.host}:{connection.port}/{connection.database}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
            <MoreHorizontalIcon className="size-4" />
            <span className="sr-only">Connection options</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEditClick}>
              <PencilIcon />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleTest} disabled={testStatus === 'testing'}>
              <PlayIcon />
              Test Connection
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteConnection.isPending}
            >
              <Trash2Icon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary">{dbLabel}</Badge>
        {connection.ssl && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline">SSL</Badge>
            </TooltipTrigger>
            <TooltipContent>SSL/TLS encryption enabled</TooltipContent>
          </Tooltip>
        )}
        {connection.sshEnabled && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline">SSH</Badge>
            </TooltipTrigger>
            <TooltipContent>
              SSH Tunnel via {connection.sshHost}:{connection.sshPort}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="mt-auto pt-2">
        <Button className="w-full" onClick={handleConnectClick}>
          Connect
        </Button>
      </div>
    </div>
  );
});
