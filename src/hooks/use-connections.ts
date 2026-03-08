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

/**
 * Hook for fetching paginated connections list
 * Supports search, sorting, and pagination
 */
export function useConnections(params?: PaginationParams) {
  return useQuery({
    queryKey: [...QUERY_KEYS.CONNECTIONS, params],
    queryFn: () => connectionService.list(params),
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
      // Invalidate all connection list queries to refetch with correct pagination
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONNECTIONS });
      // Optimistically update the current page cache if it exists
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
      // Update the individual connection cache
      queryClient.setQueryData<Connection>(
        QUERY_KEYS.CONNECTION(updatedConnection.id),
        updatedConnection,
      );
      // Update all paginated list caches
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
      // Remove individual connection query
      queryClient.removeQueries({ queryKey: QUERY_KEYS.CONNECTION(deletedId) });
      // Invalidate all list queries to refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONNECTIONS });
      // Optimistically update cached pages
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
