'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/config/constants';
import type { Connection, ConnectionFormData } from '@/schemas/connection.schema';
import connectionService from '@/services/connection.service';

export function useConnections() {
  return useQuery({
    queryKey: QUERY_KEYS.CONNECTIONS,
    queryFn: () => connectionService.list(),
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
      queryClient.setQueryData<Connection[]>(QUERY_KEYS.CONNECTIONS, (old) => {
        if (!old) {
          return [newConnection];
        }
        return [newConnection, ...old];
      });
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
      queryClient.setQueryData<Connection[]>(QUERY_KEYS.CONNECTIONS, (old) => {
        if (!old) {
          return [updatedConnection];
        }
        return old.map((conn) => (conn.id === updatedConnection.id ? updatedConnection : conn));
      });
    },
  });
}

export function useDeleteConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => connectionService.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: QUERY_KEYS.CONNECTION(deletedId) });
      queryClient.setQueryData<Connection[]>(QUERY_KEYS.CONNECTIONS, (old) => {
        if (!old) {
          return [];
        }
        return old.filter((conn) => conn.id !== deletedId);
      });
    },
  });
}

export function useTestConnection() {
  return useMutation({
    mutationFn: (id: string) => connectionService.test(id),
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
