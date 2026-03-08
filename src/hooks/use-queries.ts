'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/config/constants';
import type { ExecuteQueryFormData, SavedQuery, SavedQueryFormData } from '@/schemas/query.schema';
import queryService, { type QueryHistoryParams } from '@/services/query.service';

export function useExecuteQuery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ExecuteQueryFormData) => queryService.execute(data),
    onSuccess: () => {
      // Invalidate query history after executing a new query
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.QUERY_HISTORY });
    },
  });
}

export function useQueryHistory(params?: QueryHistoryParams) {
  return useQuery({
    queryKey: [...QUERY_KEYS.QUERY_HISTORY, params],
    queryFn: () => queryService.getHistory(params),
  });
}

export function useSavedQueries() {
  return useQuery({
    queryKey: QUERY_KEYS.SAVED_QUERIES,
    queryFn: () => queryService.saved.list(),
  });
}

export function useCreateSavedQuery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SavedQueryFormData) => queryService.saved.create(data),
    onSuccess: (newQuery) => {
      queryClient.setQueryData<SavedQuery[]>(QUERY_KEYS.SAVED_QUERIES, (old) => {
        if (!old) {
          return [newQuery];
        }
        return [newQuery, ...old];
      });
    },
  });
}

export function useUpdateSavedQuery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SavedQueryFormData> }) =>
      queryService.saved.update(id, data),
    onSuccess: (updatedQuery) => {
      queryClient.setQueryData<SavedQuery[]>(QUERY_KEYS.SAVED_QUERIES, (old) => {
        if (!old) {
          return [updatedQuery];
        }
        return old.map((q) => (q.id === updatedQuery.id ? updatedQuery : q));
      });
    },
  });
}

export function useDeleteSavedQuery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => queryService.saved.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<SavedQuery[]>(QUERY_KEYS.SAVED_QUERIES, (old) => {
        if (!old) {
          return [];
        }
        return old.filter((q) => q.id !== deletedId);
      });
    },
  });
}
