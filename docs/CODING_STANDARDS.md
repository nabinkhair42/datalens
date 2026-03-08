# Coding Standards & Conventions

> Next.js 16 + TypeScript + Tailwind CSS + tRPC + Drizzle ORM
> Last Updated: March 2026

This document defines the coding standards, conventions, and best practices for this project. All contributors must follow these guidelines to maintain consistency, quality, and maintainability.

---

## Table of Contents

1. [TypeScript Configuration](#1-typescript-configuration)
2. [ESLint & Formatting](#2-eslint--formatting)
3. [Project Structure](#3-project-structure)
4. [Naming Conventions](#4-naming-conventions)
5. [Component Conventions](#5-component-conventions)
6. [Code Style Rules](#6-code-style-rules)
7. [Database & Drizzle ORM](#7-database--drizzle-orm)
8. [tRPC API Conventions](#8-trpc-api-conventions)
9. [Testing Standards](#9-testing-standards)
10. [Git Conventions](#10-git-conventions)
11. [Tooling & Automation](#11-tooling--automation)

---

## 1. TypeScript Configuration

### Strict Mode (Required)

All projects MUST use TypeScript strict mode. This catches entire categories of bugs at compile time.

```json
// tsconfig.json
{
  "compilerOptions": {
    // Strict Mode - Required
    "strict": true,

    // Additional Strict Checks - Recommended
    "noUncheckedIndexedAccess": true,
    "noPropertyAccessFromIndexSignature": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "allowUnreachableCode": false,
    "allowUnusedLabels": false,

    // Module Resolution
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],

    // Path Aliases
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/types/*": ["./src/types/*"],
      "@/db/*": ["./src/db/*"],
      "@/server/*": ["./src/server/*"]
    },

    // Next.js Requirements
    "jsx": "preserve",
    "incremental": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,

    // Plugins
    "plugins": [
      { "name": "next" }
    ]
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

### Type Rules

```typescript
// NEVER use `any` - use `unknown` and narrow types
// Bad
function process(data: any) { ... }

// Good
function process(data: unknown) {
  if (isValidData(data)) { ... }
}

// ALWAYS use explicit return types for exported functions
// Bad
export function calculateTotal(items: Item[]) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Good
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Use `satisfies` for type checking while preserving literal types
const config = {
  endpoint: '/api/users',
  method: 'GET',
} satisfies RequestConfig;

// Use utility types effectively
type NonNullUser = NonNullable<User>;
type RequiredProfile = Required<Profile>;
type ReadonlySettings = Readonly<Settings>;
```

---

## 2. ESLint & Formatting

### Option A: Biome (Recommended for New Projects)

Biome is 10-25x faster than ESLint + Prettier and provides a unified toolchain.

```json
// biome.json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "complexity": {
        "noExcessiveCognitiveComplexity": "error",
        "noVoid": "error"
      },
      "correctness": {
        "noUnusedImports": "error",
        "noUnusedVariables": "error",
        "useExhaustiveDependencies": "warn"
      },
      "style": {
        "noNonNullAssertion": "warn",
        "useBlockStatements": "error",
        "useConst": "error",
        "useExportType": "error",
        "useImportType": "error",
        "useNamingConvention": {
          "level": "error",
          "options": {
            "strictCase": false,
            "conventions": [
              {
                "selector": { "kind": "typeAlias" },
                "formats": ["PascalCase"]
              },
              {
                "selector": { "kind": "interface" },
                "formats": ["PascalCase"]
              },
              {
                "selector": { "kind": "enum" },
                "formats": ["PascalCase"]
              }
            ]
          }
        }
      },
      "suspicious": {
        "noExplicitAny": "error",
        "noArrayIndexKey": "warn"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "always",
      "trailingCommas": "all",
      "arrowParentheses": "always"
    }
  },
  "files": {
    "ignore": [
      "node_modules",
      ".next",
      "dist",
      "build",
      "coverage"
    ]
  }
}
```

### Option B: ESLint + Prettier (Traditional Setup)

For projects requiring maximum customization or specific ESLint plugins.

```javascript
// eslint.config.mjs (ESLint 9+ Flat Config)
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import nextPlugin from '@next/eslint-plugin-next';
import importPlugin from 'eslint-plugin-import';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default tseslint.config(
  // Ignore patterns
  {
    ignores: ['node_modules/**', '.next/**', 'dist/**', 'build/**'],
  },

  // Base configs
  ...compat.extends('eslint:recommended'),

  // TypeScript
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
  },

  // React & Next.js
  {
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
      '@next/next': nextPlugin,
      import: importPlugin,
    },
    rules: {
      // React
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/self-closing-comp': 'error',
      'react/jsx-curly-brace-presence': ['error', 'never'],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Next.js
      '@next/next/no-html-link-for-pages': 'error',

      // TypeScript
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'warn',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',

      // Import ordering
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'type',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-duplicates': 'error',

      // General
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
    },
  }
);
```

### Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "tabWidth": 2,
  "useTabs": false,
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindStylesheet": "./src/app/globals.css"
}
```

---

## 3. Project Structure

### Directory Layout

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route group: auth pages
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (dashboard)/              # Route group: dashboard
│   │   ├── layout.tsx
│   │   └── [workspace]/
│   │       ├── page.tsx
│   │       └── settings/
│   │           └── page.tsx
│   ├── api/                      # API routes
│   │   └── trpc/
│   │       └── [trpc]/
│   │           └── route.ts
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   ├── globals.css               # Global styles
│   ├── error.tsx                 # Global error boundary
│   ├── loading.tsx               # Global loading state
│   └── not-found.tsx             # 404 page
│
├── components/                   # React components
│   ├── ui/                       # Primitive UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── index.ts              # Barrel export
│   ├── forms/                    # Form components
│   │   ├── login-form.tsx
│   │   └── signup-form.tsx
│   ├── layouts/                  # Layout components
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   └── footer.tsx
│   └── features/                 # Feature-specific components
│       ├── users/
│       │   ├── user-card.tsx
│       │   ├── user-list.tsx
│       │   └── user-avatar.tsx
│       └── projects/
│           ├── project-card.tsx
│           └── project-list.tsx
│
├── lib/                          # Shared utilities
│   ├── utils.ts                  # General utilities (cn, etc.)
│   ├── constants.ts              # App constants
│   └── validations.ts            # Shared Zod schemas
│
├── hooks/                        # Custom React hooks
│   ├── use-debounce.ts
│   ├── use-local-storage.ts
│   └── use-media-query.ts
│
├── types/                        # TypeScript type definitions
│   ├── index.ts                  # Shared types
│   └── api.ts                    # API-specific types
│
├── db/                           # Database layer (Drizzle)
│   ├── index.ts                  # Database connection
│   ├── schema/                   # Schema definitions
│   │   ├── index.ts              # Re-exports all schemas
│   │   ├── users.ts
│   │   ├── projects.ts
│   │   └── _helpers.ts           # Shared column helpers
│   └── migrations/               # Generated migrations
│
├── server/                       # Server-side code
│   ├── trpc/                     # tRPC configuration
│   │   ├── index.ts              # tRPC initialization
│   │   ├── context.ts            # Request context
│   │   ├── middleware.ts         # Shared middleware
│   │   └── routers/              # tRPC routers
│   │       ├── index.ts          # Root router
│   │       ├── users.ts
│   │       └── projects.ts
│   └── services/                 # Business logic layer
│       ├── user.service.ts
│       └── project.service.ts
│
└── _tests/                       # Test utilities (private folder)
    ├── setup.ts
    ├── mocks/
    └── factories/
```

### Key Conventions

1. **Use `src/` directory** - Separates application code from config files
2. **Route Groups `(name)/`** - Organize routes without affecting URL
3. **Private Folders `_name/`** - Excluded from routing (use for tests, utilities)
4. **Parallel Routes `@slot/`** - For complex layouts (dashboards, modals)
5. **Dynamic Routes `[param]/`** - For parameterized routes

---

## 4. Naming Conventions

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | `kebab-case.tsx` | `user-profile.tsx` |
| Hooks | `use-[name].ts` | `use-debounce.ts` |
| Utilities | `kebab-case.ts` | `format-date.ts` |
| Types | `kebab-case.ts` | `api-types.ts` |
| Constants | `kebab-case.ts` | `route-constants.ts` |
| Tests | `[name].test.ts(x)` | `user-profile.test.tsx` |
| Schemas (Drizzle) | `kebab-case.ts` | `users.ts`, `user-settings.ts` |
| Routers (tRPC) | `kebab-case.ts` | `users.ts`, `projects.ts` |

### Code Naming

```typescript
// Components: PascalCase
export function UserProfile() { ... }
export function DataTable<T>() { ... }

// Props interfaces: ComponentNameProps
interface UserProfileProps {
  user: User;
  onUpdate?: (user: User) => void;
}

// Hooks: camelCase with "use" prefix
export function useDebounce<T>(value: T, delay: number): T { ... }
export function useLocalStorage<T>(key: string): [T, (value: T) => void] { ... }

// Functions: camelCase
export function formatDate(date: Date): string { ... }
export function calculateTotal(items: Item[]): number { ... }

// Constants: SCREAMING_SNAKE_CASE for true constants
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const API_ENDPOINTS = {
  users: '/api/users',
  projects: '/api/projects',
} as const;

// Type aliases & Interfaces: PascalCase
type UserRole = 'admin' | 'member' | 'guest';
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

// Enums: PascalCase (name and values)
enum UserStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Pending = 'PENDING',
}

// Database tables (Drizzle): snake_case
export const users = pgTable('users', { ... });
export const userSettings = pgTable('user_settings', { ... });

// Database columns: snake_case
id: serial('id').primaryKey(),
createdAt: timestamp('created_at').defaultNow(),
userId: integer('user_id').references(() => users.id),

// tRPC routers: camelCase
export const userRouter = createTRPCRouter({ ... });

// tRPC procedures: camelCase with verb prefix
getById: publicProcedure.input(...),
create: protectedProcedure.input(...),
updateProfile: protectedProcedure.input(...),
deleteAccount: protectedProcedure.input(...),
```

### Boolean Naming

```typescript
// Prefix with is, has, can, should, will
interface UserState {
  isLoading: boolean;
  isAuthenticated: boolean;
  hasPermission: boolean;
  canEdit: boolean;
  shouldRefresh: boolean;
}
```

---

## 5. Component Conventions

### Server vs Client Components

```typescript
// Default: Server Components (no directive needed)
// src/components/features/users/user-list.tsx
import { db } from '@/db';

export async function UserList() {
  const users = await db.query.users.findMany();

  return (
    <ul>
      {users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </ul>
  );
}

// Client Components: Add "use client" directive
// src/components/ui/counter.tsx
'use client';

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

### When to Use "use client"

Add `'use client'` ONLY when you need:

- **React hooks**: `useState`, `useEffect`, `useReducer`, etc.
- **Event handlers**: `onClick`, `onChange`, `onSubmit`, etc.
- **Browser APIs**: `window`, `document`, `localStorage`, etc.
- **Third-party hooks**: Libraries that use client-side state

```typescript
// RULE: Push "use client" to leaf components
// BAD - Entire page is client-side
'use client';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  return <div>...</div>;
}

// GOOD - Only interactive part is client-side
// page.tsx (Server Component)
export default async function DashboardPage() {
  const data = await fetchData();
  return (
    <div>
      <StaticHeader data={data} />
      <InteractiveChart data={data} /> {/* Client Component */}
    </div>
  );
}

// interactive-chart.tsx
'use client';
export function InteractiveChart({ data }: Props) {
  const [zoom, setZoom] = useState(1);
  // ...
}
```

### Component Composition Pattern

```typescript
// Pass Server Components as children to Client Components
// client-wrapper.tsx
'use client';

interface ClientWrapperProps {
  children: React.ReactNode;
}

export function ClientWrapper({ children }: ClientWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
      {isOpen && children}
    </div>
  );
}

// page.tsx (Server Component)
export default async function Page() {
  const data = await fetchData();

  return (
    <ClientWrapper>
      <ServerComponent data={data} />
    </ClientWrapper>
  );
}
```

### Props Typing

```typescript
// Props interface pattern
interface UserCardProps {
  user: User;
  variant?: 'default' | 'compact' | 'detailed';
  onSelect?: (user: User) => void;
  className?: string;
}

export function UserCard({
  user,
  variant = 'default',
  onSelect,
  className,
}: UserCardProps) {
  // ...
}

// Children typing
interface LayoutProps {
  children: React.ReactNode;
}

// Polymorphic components with "as" prop
interface ButtonProps<T extends React.ElementType = 'button'> {
  as?: T;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Button<T extends React.ElementType = 'button'>({
  as,
  children,
  variant = 'primary',
  ...props
}: ButtonProps<T> & Omit<React.ComponentPropsWithoutRef<T>, keyof ButtonProps<T>>) {
  const Component = as || 'button';
  return <Component {...props}>{children}</Component>;
}
```

---

## 6. Code Style Rules

### Functions

```typescript
// Prefer arrow functions for components with simple logic
export const Badge = ({ label }: BadgeProps) => (
  <span className="badge">{label}</span>
);

// Use function declarations for complex components
export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  onSort,
}: DataTableProps<T>) {
  // Complex logic here
  return <table>...</table>;
}

// Always use arrow functions for callbacks
const handleClick = () => { ... };
const filteredItems = items.filter((item) => item.active);

// Use explicit return types for exported functions
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
```

### Exports

```typescript
// Named exports for utilities, hooks, types (PREFERRED)
export function formatDate(date: Date): string { ... }
export function useDebounce<T>(value: T): T { ... }
export type UserRole = 'admin' | 'member';

// Default exports ONLY for:
// 1. Next.js pages (required)
export default function HomePage() { ... }

// 2. Next.js layouts (required)
export default function RootLayout({ children }: LayoutProps) { ... }

// 3. Next.js route handlers (required)
export async function GET(request: Request) { ... }
export async function POST(request: Request) { ... }

// Barrel exports in index.ts
// src/components/ui/index.ts
export { Button } from './button';
export { Input } from './input';
export { Card, CardHeader, CardContent } from './card';
export type { ButtonProps, InputProps, CardProps } from './types';
```

### Error Handling

```typescript
// Use Result pattern for operations that can fail
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export async function fetchUser(id: string): Promise<Result<User>> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      return { success: false, error: new Error('User not found') };
    }

    return { success: true, data: user };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

// Usage
const result = await fetchUser(id);
if (!result.success) {
  console.error(result.error);
  return;
}
const user = result.data;

// Async/await with proper error boundaries
export default async function UserPage({ params }: Props) {
  const result = await fetchUser(params.id);

  if (!result.success) {
    notFound(); // Next.js not-found boundary
  }

  return <UserProfile user={result.data} />;
}
```

### Async Patterns

```typescript
// Always handle promises - never leave floating
// BAD
someAsyncFunction();

// GOOD
await someAsyncFunction();

// Or explicitly void if fire-and-forget
void someAsyncFunction();

// Use Promise.all for parallel operations
const [users, projects] = await Promise.all([
  fetchUsers(),
  fetchProjects(),
]);

// Use Promise.allSettled when some failures are acceptable
const results = await Promise.allSettled([
  fetchCriticalData(),
  fetchOptionalData(),
]);

// Handle each result
results.forEach((result) => {
  if (result.status === 'fulfilled') {
    console.log(result.value);
  } else {
    console.error(result.reason);
  }
});
```

### Conditional Rendering

```typescript
// Early returns for cleaner code
export function UserProfile({ user }: UserProfileProps) {
  if (!user) {
    return <EmptyState message="No user found" />;
  }

  if (user.isDeleted) {
    return <DeletedUserPlaceholder />;
  }

  return (
    <div>
      <h1>{user.name}</h1>
      {/* Main content */}
    </div>
  );
}

// Avoid nested ternaries
// BAD
{isLoading ? <Spinner /> : error ? <Error /> : <Content />}

// GOOD
{isLoading && <Spinner />}
{error && <Error message={error.message} />}
{!isLoading && !error && <Content />}

// Or use early returns in a wrapper component
```

---

## 7. Database & Drizzle ORM

### Schema Organization

```
src/db/
├── index.ts              # Database connection & exports
├── schema/
│   ├── index.ts          # Re-exports all schemas
│   ├── _helpers.ts       # Reusable column patterns
│   ├── users.ts
│   ├── projects.ts
│   └── project-members.ts
└── migrations/           # Generated by drizzle-kit
```

### Reusable Column Helpers

```typescript
// src/db/schema/_helpers.ts
import { timestamp, uuid } from 'drizzle-orm/pg-core';

// Standard timestamps for all tables
export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

// Soft delete support
export const softDelete = {
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
};

// Primary key helper using identity (PostgreSQL 10+ recommended)
export const primaryId = {
  id: uuid('id').defaultRandom().primaryKey(),
};
```

### Schema Definition

```typescript
// src/db/schema/users.ts
import { pgTable, text, varchar, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { primaryId, timestamps, softDelete } from './_helpers';

export const users = pgTable(
  'users',
  {
    ...primaryId,
    email: varchar('email', { length: 255 }).unique().notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    avatarUrl: text('avatar_url'),
    role: varchar('role', { length: 50 }).default('member').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    ...timestamps,
    ...softDelete,
  },
  (table) => [
    index('users_email_idx').on(table.email),
    index('users_role_idx').on(table.role),
  ]
);

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projectMembers),
  createdProjects: many(projects),
}));

// Export inferred types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

### Naming Conventions (Database)

| Element | Convention | Example |
|---------|------------|---------|
| Tables | `snake_case`, plural | `users`, `project_members` |
| Columns | `snake_case` | `created_at`, `user_id` |
| Primary Keys | `id` | `id` |
| Foreign Keys | `[table]_id` | `user_id`, `project_id` |
| Indexes | `[table]_[column]_idx` | `users_email_idx` |
| Unique Constraints | `[table]_[column]_unique` | `users_email_unique` |

### Query Patterns

```typescript
// src/server/services/user.service.ts
import { eq, and, isNull, desc } from 'drizzle-orm';
import { db } from '@/db';
import { users, type User, type NewUser } from '@/db/schema';

export const userService = {
  // Find active users (respecting soft delete)
  async findMany(): Promise<User[]> {
    return db.query.users.findMany({
      where: isNull(users.deletedAt),
      orderBy: desc(users.createdAt),
    });
  },

  // Find by ID
  async findById(id: string): Promise<User | undefined> {
    return db.query.users.findFirst({
      where: and(
        eq(users.id, id),
        isNull(users.deletedAt),
      ),
    });
  },

  // Create with type safety
  async create(data: NewUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  },

  // Update
  async update(id: string, data: Partial<NewUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  },

  // Soft delete
  async delete(id: string): Promise<void> {
    await db
      .update(users)
      .set({ deletedAt: new Date() })
      .where(eq(users.id, id));
  },
};
```

### Drizzle Config

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

---

## 8. tRPC API Conventions

### Router Organization

```
src/server/trpc/
├── index.ts          # tRPC initialization & exports
├── context.ts        # Request context creation
├── middleware.ts     # Reusable middleware
└── routers/
    ├── index.ts      # Root router (merges all routers)
    ├── users.ts
    ├── projects.ts
    └── auth.ts
```

### Initialization

```typescript
// src/server/trpc/index.ts
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import type { Context } from './context';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// Protected procedure (requires auth)
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.session.user,
    },
  });
});

// Admin procedure
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next({ ctx });
});
```

### Router Definition

```typescript
// src/server/trpc/routers/users.ts
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../index';
import { userService } from '@/server/services/user.service';

// Shared schemas in a separate file for reuse
export const userSchemas = {
  getById: z.object({
    id: z.string().uuid(),
  }),

  create: z.object({
    email: z.string().email(),
    name: z.string().min(2).max(100),
    role: z.enum(['admin', 'member', 'guest']).default('member'),
  }),

  update: z.object({
    id: z.string().uuid(),
    name: z.string().min(2).max(100).optional(),
    avatarUrl: z.string().url().nullable().optional(),
  }),

  list: z.object({
    limit: z.number().min(1).max(100).default(50),
    cursor: z.string().uuid().optional(),
  }),
};

export const userRouter = createTRPCRouter({
  // Query: Get single user
  getById: publicProcedure
    .input(userSchemas.getById)
    .query(async ({ input }) => {
      const user = await userService.findById(input.id);

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return user;
    }),

  // Query: List users with pagination
  list: publicProcedure
    .input(userSchemas.list)
    .query(async ({ input }) => {
      return userService.findMany(input);
    }),

  // Mutation: Create user
  create: protectedProcedure
    .input(userSchemas.create)
    .mutation(async ({ input }) => {
      return userService.create(input);
    }),

  // Mutation: Update user
  update: protectedProcedure
    .input(userSchemas.update)
    .mutation(async ({ ctx, input }) => {
      // Authorization check
      if (ctx.user.id !== input.id && ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to update this user',
        });
      }

      return userService.update(input.id, input);
    }),

  // Mutation: Delete user
  delete: protectedProcedure
    .input(userSchemas.getById)
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id !== input.id && ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to delete this user',
        });
      }

      await userService.delete(input.id);
      return { success: true };
    }),
});
```

### Procedure Naming Conventions

| Action | Prefix | Example |
|--------|--------|---------|
| Fetch single | `get`, `find` | `getById`, `findByEmail` |
| Fetch list | `list`, `getAll` | `list`, `listByProject` |
| Create | `create` | `create`, `createMany` |
| Update | `update` | `update`, `updateProfile` |
| Delete | `delete`, `remove` | `delete`, `softDelete` |
| Toggle/Switch | `toggle`, `set` | `toggleActive`, `setStatus` |
| Check | `check`, `validate` | `checkEmail`, `validateToken` |

### Root Router

```typescript
// src/server/trpc/routers/index.ts
import { createTRPCRouter } from '../index';
import { userRouter } from './users';
import { projectRouter } from './projects';
import { authRouter } from './auth';

export const appRouter = createTRPCRouter({
  user: userRouter,
  project: projectRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
```

---

## 9. Testing Standards

### Test File Organization

```
src/
├── components/
│   └── ui/
│       ├── button.tsx
│       └── button.test.tsx     # Colocated tests
│
├── server/
│   └── services/
│       ├── user.service.ts
│       └── user.service.test.ts
│
└── _tests/                      # Global test utilities
    ├── setup.ts                 # Vitest setup
    ├── mocks/
    │   ├── handlers.ts          # MSW handlers
    │   └── db.ts                # Mock database
    └── factories/
        ├── user.factory.ts
        └── project.factory.ts
```

### Vitest Configuration

```typescript
// vitest.config.mts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/_tests/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/_tests/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
});
```

### Test Setup

```typescript
// src/_tests/setup.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock environment variables
vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test');
```

### Component Testing

```typescript
// src/components/ui/button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant classes correctly', () => {
    render(<Button variant="destructive">Delete</Button>);

    expect(screen.getByRole('button')).toHaveClass('bg-destructive');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Service/API Testing

```typescript
// src/server/services/user.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { userService } from './user.service';
import { db } from '@/db';

// Mock the database
vi.mock('@/db', () => ({
  db: {
    query: {
      users: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
  },
}));

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findById', () => {
    it('returns user when found', async () => {
      const mockUser = { id: '1', name: 'John', email: 'john@example.com' };
      vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser);

      const result = await userService.findById('1');

      expect(result).toEqual(mockUser);
    });

    it('returns undefined when user not found', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);

      const result = await userService.findById('nonexistent');

      expect(result).toBeUndefined();
    });
  });
});
```

### Testing Best Practices

1. **Test behavior, not implementation** - Focus on what the component does, not how
2. **Use Testing Library queries in priority order**: `getByRole` > `getByLabelText` > `getByText`
3. **Avoid testing implementation details** - Don't test internal state or methods
4. **Use factories for test data** - Create consistent, typed test fixtures
5. **Mock at the boundary** - Mock external APIs and database, not internal modules
6. **Test error states** - Verify error handling and edge cases
7. **Keep tests independent** - Each test should set up its own state

---

## 10. Git Conventions

### Commit Message Format (Conventional Commits)

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature for users |
| `fix` | Bug fix for users |
| `docs` | Documentation changes |
| `style` | Code style (formatting, semicolons) |
| `refactor` | Code refactoring (no feature/fix) |
| `perf` | Performance improvements |
| `test` | Adding or fixing tests |
| `build` | Build system or dependencies |
| `ci` | CI/CD configuration |
| `chore` | Maintenance tasks |
| `revert` | Reverting a previous commit |

### Examples

```bash
# Feature
feat(auth): add OAuth2 Google login support

# Bug fix
fix(api): handle null user in profile endpoint

# Breaking change (note the !)
feat(api)!: change user endpoint response format

BREAKING CHANGE: The `/api/users` endpoint now returns
`{ data: User[] }` instead of `User[]` directly.

# With scope
refactor(db): migrate from Prisma to Drizzle ORM

# With body
fix(ui): prevent double form submission

Added disabled state to submit button while request is pending.
Also added loading spinner for better UX.

Closes #123
```

### Branch Naming

```
<type>/<ticket-id>-<short-description>

Examples:
feat/PROJ-123-add-user-dashboard
fix/PROJ-456-login-redirect-loop
refactor/PROJ-789-migrate-to-drizzle
chore/update-dependencies
```

### Pull Request Template

```markdown
<!-- .github/pull_request_template.md -->
## Summary

Brief description of the changes.

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)

## Related Issues

Closes #(issue number)

## Changes Made

- Change 1
- Change 2
- Change 3

## Testing

Describe how you tested your changes:

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Checklist

- [ ] My code follows the project's coding standards
- [ ] I have performed a self-review of my code
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing unit tests pass locally
- [ ] I have updated documentation as needed
- [ ] My changes generate no new warnings
```

---

## 11. Tooling & Automation

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "prepare": "husky"
  }
}
```

### Husky Git Hooks

```bash
# Install
npm install -D husky lint-staged @commitlint/cli @commitlint/config-conventional

# Initialize
npx husky init
```

```bash
# .husky/pre-commit
npx lint-staged
```

```bash
# .husky/commit-msg
npx --no -- commitlint --edit ${1}
```

### lint-staged Configuration

```json
// package.json or .lintstagedrc.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "biome check --write --no-errors-on-unmatched",
      "vitest related --run"
    ],
    "*.{json,md}": [
      "biome format --write --no-errors-on-unmatched"
    ]
  }
}
```

### Commitlint Configuration

```javascript
// commitlint.config.mjs
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100],
  },
};
```

### VS Code Settings

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "biomejs.biome",
  "editor.codeActionsOnSave": {
    "source.organizeImports.biome": "explicit",
    "quickfix.biome": "explicit"
  },
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[json]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "typescript.updateImportsOnFileMove.enabled": "always",
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

### VS Code Extensions (Recommended)

```json
// .vscode/extensions.json
{
  "recommendations": [
    "biomejs.biome",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-playwright.playwright",
    "vitest.explorer"
  ]
}
```

---

## Quick Reference Card

### Do's

- Use TypeScript strict mode
- Default to Server Components
- Push "use client" to leaf components
- Use named exports (except for pages/layouts)
- Use kebab-case for files, PascalCase for components
- Validate all inputs with Zod
- Use Result pattern for error handling
- Write tests for critical paths
- Use Conventional Commits
- Run lint-staged on pre-commit

### Don'ts

- Never use `any` type
- Don't make entire pages client components
- Don't skip TypeScript strict checks
- Don't commit without proper message format
- Don't leave floating promises
- Don't use default exports for utilities
- Don't mix naming conventions
- Don't skip input validation
- Don't test implementation details
- Don't commit secrets or env files

---

## Sources & References

- [Next.js 16 ESLint Configuration](https://nextjs.org/docs/app/api-reference/config/eslint)
- [Next.js ESLint Flat Config Setup](https://chris.lu/web_development/tutorials/next-js-16-linting-setup-eslint-9-flat-config)
- [TypeScript Strict Mode Guide](https://oneuptime.com/blog/post/2026-02-20-typescript-strict-mode-guide/view)
- [Biome vs ESLint Comparison](https://medium.com/better-dev-nextjs-react/biome-vs-eslint-prettier-the-2025-linting-revolution-you-need-to-know-about-ec01c5d5b6c8)
- [Next.js Project Structure](https://nextjs.org/docs/app/getting-started/project-structure)
- [React Server Components Best Practices](https://www.growin.com/blog/react-server-components/)
- [Drizzle ORM Schema Documentation](https://orm.drizzle.team/docs/sql-schema-declaration)
- [tRPC v11 Announcement](https://trpc.io/blog/announcing-trpc-v11)
- [Prettier Tailwind Plugin](https://github.com/tailwindlabs/prettier-plugin-tailwindcss)
- [Commitlint Documentation](https://github.com/conventional-changelog/commitlint)
- [Vitest with Next.js](https://nextjs.org/docs/app/guides/testing/vitest)
