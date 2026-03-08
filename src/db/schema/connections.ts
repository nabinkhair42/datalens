import { boolean, integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { users } from './auth';

export const databaseTypeEnum = pgEnum('database_type', [
  'postgresql',
  'mysql',
  'sqlite',
  'mongodb',
  'mssql',
]);

export const connections = pgTable('connections', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: databaseTypeEnum('type').notNull(),
  host: text('host').notNull(),
  port: integer('port').notNull(),
  database: text('database').notNull(),
  username: text('username').notNull(),
  encryptedPassword: text('encrypted_password').notNull(),
  ssl: boolean('ssl').notNull().default(true),
  sshEnabled: boolean('ssh_enabled').notNull().default(false),
  sshHost: text('ssh_host'),
  sshPort: integer('ssh_port'),
  sshUsername: text('ssh_username'),
  encryptedSshKey: text('encrypted_ssh_key'),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const queryHistory = pgTable('query_history', {
  id: text('id').primaryKey(),
  connectionId: text('connection_id')
    .notNull()
    .references(() => connections.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  query: text('query').notNull(),
  executionTime: integer('execution_time'),
  rowCount: integer('row_count'),
  success: boolean('success').notNull().default(true),
  error: text('error'),
  executedAt: timestamp('executed_at').notNull().defaultNow(),
});

export const savedQueries = pgTable('saved_queries', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  query: text('query').notNull(),
  connectionId: text('connection_id').references(() => connections.id, { onDelete: 'set null' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
