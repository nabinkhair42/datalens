import { z } from 'zod';

import { QUERY_LIMITS } from '@/config/constants';

export const executeQuerySchema = z.object({
  connectionId: z.string().min(1, 'Connection is required'),
  query: z
    .string()
    .min(1, 'Query is required')
    .max(
      QUERY_LIMITS.MAX_QUERY_LENGTH,
      `Query must be less than ${QUERY_LIMITS.MAX_QUERY_LENGTH} characters`,
    ),
  timeout: z
    .number()
    .int()
    .positive()
    .max(QUERY_LIMITS.MAX_TIMEOUT_MS)
    .default(QUERY_LIMITS.DEFAULT_TIMEOUT_MS)
    .optional(),
});

export type ExecuteQueryFormData = z.infer<typeof executeQuerySchema>;

export const savedQuerySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  query: z.string().min(1, 'Query is required'),
  connectionId: z.string().optional(),
});

export type SavedQueryFormData = z.infer<typeof savedQuerySchema>;

// Response types
export interface QueryColumn {
  name: string;
  type: string;
  nullable: boolean;
}

export interface QueryResult {
  columns: QueryColumn[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTime: number;
}

export interface QueryHistoryItem {
  id: string;
  connectionId: string;
  query: string;
  executedAt: string;
  executionTime: number | null;
  rowCount: number | null;
  success: boolean;
  error: string | null;
}

export interface SavedQuery {
  id: string;
  name: string;
  description: string | null;
  query: string;
  connectionId: string | null;
  createdAt: string;
  updatedAt: string;
}
