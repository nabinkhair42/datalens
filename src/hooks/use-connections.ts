'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/config/constants';
import type {
  Connection,
  ConnectionFormData,
  PaginatedConnections,
  PaginationParams,
} from '@/schemas/connection.schema';
import connectionService from '@/services/connection.service';

// Fetch paginated connections list
export function useConnections(params?: PaginationParams) {
  return useQuery({
    queryKey: [...QUERY_KEYS.CONNECTIONS, params],
    queryFn: () => connectionService.list(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useConnection(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.CONNECTION(id),
    queryFn: () => connectionService.get(id),
    enabled: !!id,
  });
}

export function useCreateConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ConnectionFormData) => connectionService.create(data),
    onSuccess: (newConnection) => {
      // Set optimistic data — don't also invalidate or it refetches immediately and wastes the update
      queryClient.setQueriesData<PaginatedConnections>(
        { queryKey: QUERY_KEYS.CONNECTIONS },
        (old) => {
          if (!old) {
            return old;
          }
          return {
            ...old,
            data: [newConnection, ...old.data],
            pagination: {
              ...old.pagination,
              total: old.pagination.total + 1,
            },
          };
        },
      );
    },
  });
}

export function useUpdateConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ConnectionFormData> }) =>
      connectionService.update(id, data),
    onSuccess: (updatedConnection) => {
      queryClient.setQueryData<Connection>(
        QUERY_KEYS.CONNECTION(updatedConnection.id),
        updatedConnection,
      );
      queryClient.setQueriesData<PaginatedConnections>(
        { queryKey: QUERY_KEYS.CONNECTIONS },
        (old) => {
          if (!old) {
            return old;
          }
          return {
            ...old,
            data: old.data.map((conn) =>
              conn.id === updatedConnection.id ? updatedConnection : conn,
            ),
          };
        },
      );
    },
  });
}

export function useDeleteConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => connectionService.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: QUERY_KEYS.CONNECTION(deletedId) });
      // Set optimistic data directly — no need to also invalidate and refetch
      queryClient.setQueriesData<PaginatedConnections>(
        { queryKey: QUERY_KEYS.CONNECTIONS },
        (old) => {
          if (!old) {
            return old;
          }
          return {
            ...old,
            data: old.data.filter((conn) => conn.id !== deletedId),
            pagination: {
              ...old.pagination,
              total: Math.max(0, old.pagination.total - 1),
            },
          };
        },
      );
    },
  });
}

export function useTestConnection() {
  return useMutation({
    mutationFn: (id: string) => connectionService.test(id),
  });
}

export function useTestNewConnection() {
  return useMutation({
    mutationFn: (data: ConnectionFormData) => connectionService.testNew(data),
  });
}

export function useConnectionSchema(connectionId: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.CONNECTION(connectionId), 'schema'],
    queryFn: () => connectionService.getSchema(connectionId),
    enabled: !!connectionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
