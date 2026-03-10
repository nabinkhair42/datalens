'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/config/constants';
import type {
  ExecuteQueryFormData,
  QueryHistoryItem,
  SavedQuery,
  SavedQueryFormData,
} from '@/schemas/query.schema';
import queryService, { type QueryHistoryParams } from '@/services/query.service';

export function useExecuteQuery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ExecuteQueryFormData) => queryService.execute(data),
    onSuccess: (result, variables) => {
      // Skip history update for automatic queries (table data loading, etc.)
      if (variables.skipHistory) {
        return;
      }

      // Optimistic update: prepend new history entry to all cached history lists.
      // No invalidation needed — the entry is constructed from the mutation result.
      queryClient.setQueriesData<QueryHistoryItem[]>(
        { queryKey: QUERY_KEYS.QUERY_HISTORY },
        (old) => {
          if (!old) {
            return old;
          }
          const newEntry: QueryHistoryItem = {
            id: `temp-${Date.now()}`,
            connectionId: variables.connectionId,
            query: variables.query,
            executedAt: new Date().toISOString(),
            executionTime: result.executionTime,
            rowCount: result.rowCount,
            success: true,
            error: null,
          };
          return [newEntry, ...old];
        },
      );
    },
    onError: (_error, variables) => {
      if (variables.skipHistory) {
        return;
      }
      // Server may still create a failed history entry — invalidate to fetch it
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.QUERY_HISTORY });
    },
  });
}

export function useQueryHistory(params?: QueryHistoryParams) {
  return useQuery({
    queryKey: [...QUERY_KEYS.QUERY_HISTORY, params],
    queryFn: () => queryService.getHistory(params),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useSavedQueries() {
  return useQuery({
    queryKey: QUERY_KEYS.SAVED_QUERIES,
    queryFn: () => queryService.saved.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes
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
