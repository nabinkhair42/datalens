import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

const connectionString = process.env['DATABASE_URL'];

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const client = postgres(connectionString, {
  max: 10,
  // biome-ignore lint/style/useNamingConvention: postgres.js API
  idle_timeout: 20,
  // biome-ignore lint/style/useNamingConvention: postgres.js API
  connect_timeout: 10,
  prepare: false,
});

export const db = drizzle(client, { schema });

export type Database = typeof db;
