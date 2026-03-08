import { API_ENDPOINTS } from '@/config/api-endpoints';
import { del, get, post, put } from '@/config/axios';
import type {
  ExecuteQueryFormData,
  QueryHistoryItem,
  QueryResult,
  SavedQuery,
  SavedQueryFormData,
} from '@/schemas/query.schema';

export interface QueryHistoryParams {
  connectionId?: string;
  limit?: number;
  cursor?: string;
}

export const queryService = {
  async execute(data: ExecuteQueryFormData): Promise<QueryResult> {
    return post<QueryResult>(API_ENDPOINTS.QUERIES.EXECUTE, data);
  },

  async getHistory(params?: QueryHistoryParams): Promise<QueryHistoryItem[]> {
    return get<QueryHistoryItem[]>(
      API_ENDPOINTS.QUERIES.HISTORY,
      params as Record<string, unknown>,
    );
  },

  saved: {
    async list(): Promise<SavedQuery[]> {
      return get<SavedQuery[]>(API_ENDPOINTS.QUERIES.SAVED.LIST);
    },

    async get(id: string): Promise<SavedQuery> {
      return get<SavedQuery>(API_ENDPOINTS.QUERIES.SAVED.GET(id));
    },

    async create(data: SavedQueryFormData): Promise<SavedQuery> {
      return post<SavedQuery>(API_ENDPOINTS.QUERIES.SAVED.CREATE, data);
    },

    async update(id: string, data: Partial<SavedQueryFormData>): Promise<SavedQuery> {
      return put<SavedQuery>(API_ENDPOINTS.QUERIES.SAVED.UPDATE(id), data);
    },

    async delete(id: string): Promise<{ success: boolean }> {
      return del<{ success: boolean }>(API_ENDPOINTS.QUERIES.SAVED.DELETE(id));
    },
  },
};

export default queryService;
