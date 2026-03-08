import { API_ENDPOINTS } from '@/config/api-endpoints';
import { del, get, post, put } from '@/config/axios';
import type {
  Connection,
  ConnectionFormData,
  ConnectionTestResult,
} from '@/schemas/connection.schema';
import type { SchemaInfo } from '@/server/db-adapters/types';

export const connectionService = {
  async list(): Promise<Connection[]> {
    return get<Connection[]>(API_ENDPOINTS.CONNECTIONS.LIST);
  },

  async get(id: string): Promise<Connection> {
    return get<Connection>(API_ENDPOINTS.CONNECTIONS.GET(id));
  },

  async create(data: ConnectionFormData): Promise<Connection> {
    return post<Connection>(API_ENDPOINTS.CONNECTIONS.CREATE, data);
  },

  async update(id: string, data: Partial<ConnectionFormData>): Promise<Connection> {
    return put<Connection>(API_ENDPOINTS.CONNECTIONS.UPDATE(id), data);
  },

  async delete(id: string): Promise<{ success: boolean }> {
    return del<{ success: boolean }>(API_ENDPOINTS.CONNECTIONS.DELETE(id));
  },

  async test(id: string): Promise<ConnectionTestResult> {
    return post<ConnectionTestResult>(API_ENDPOINTS.CONNECTIONS.TEST(id));
  },

  /**
   * Test a new connection configuration before saving
   */
  async testNew(data: ConnectionFormData): Promise<ConnectionTestResult> {
    return post<ConnectionTestResult>(API_ENDPOINTS.CONNECTIONS.TEST_NEW, data);
  },

  async getSchema(id: string): Promise<SchemaInfo[]> {
    return get<SchemaInfo[]>(API_ENDPOINTS.CONNECTIONS.SCHEMA(id));
  },
};

export default connectionService;
