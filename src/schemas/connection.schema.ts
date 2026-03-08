import { z } from 'zod';

import { DATABASE_TYPES, type DatabaseType } from '@/config/constants';

const databaseTypeValues = [
  DATABASE_TYPES.POSTGRESQL,
  DATABASE_TYPES.MYSQL,
  DATABASE_TYPES.SQLITE,
  DATABASE_TYPES.MONGODB,
  DATABASE_TYPES.MSSQL,
] as const;

export const connectionSchema = z.object({
  name: z
    .string()
    .min(1, 'Connection name is required')
    .max(100, 'Connection name must be less than 100 characters'),
  type: z.enum(databaseTypeValues, {
    message: 'Please select a database type',
  }),
  host: z.string().min(1, 'Host is required'),
  port: z
    .number()
    .int('Port must be an integer')
    .positive('Port must be positive')
    .max(65535, 'Port must be less than 65535'),
  database: z.string().min(1, 'Database name is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  ssl: z.boolean().default(true),
  sshEnabled: z.boolean().default(false),
  sshHost: z.string().optional(),
  sshPort: z.number().int().positive().max(65535).optional(),
  sshUsername: z.string().optional(),
  sshKey: z.string().optional(),
});

export type ConnectionFormData = z.infer<typeof connectionSchema>;

export const connectionUpdateSchema = connectionSchema.partial().extend({
  id: z.string(),
});

export type ConnectionUpdateFormData = z.infer<typeof connectionUpdateSchema>;

// Response types
export interface Connection {
  id: string;
  name: string;
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  ssl: boolean;
  sshEnabled: boolean;
  sshHost: string | null;
  sshPort: number | null;
  sshUsername: string | null;
  createdAt: string;
  updatedAt: string;
  // Password is included when fetching single connection for editing
  password?: string;
}

export interface ConnectionTestResult {
  success: boolean;
  latency?: number;
  version?: string;
  error?: string;
}
