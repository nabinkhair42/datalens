# DataLens - Project Blueprint

> **"Figma for your database"** - The web-native, collaborative database IDE

**Last Updated:** March 2026
**Tech Stack Version:** 2.0 (Latest 2026 stack)

---

## Executive Summary

DataLens is a modern, web-based database visualization and management tool that differentiates through **real-time collaboration**, **AI-native experience**, and **fair pricing** (SSO included in Team tier). Built for developers who want TablePlus-level UX in the browser with team features.

**Target Market:** Developer teams frustrated with sluggish tools (pgAdmin, DBeaver) or expensive enterprise solutions (Retool at $50/user)

**Market Opportunity:** $100B+ DBMS market with clear gaps in web-based, collaborative, AI-powered tools

---

## 1. Product Positioning

### 1.1 Tagline Options
- "Figma for your database"
- "The web-native database IDE"
- "Database management, together"

### 1.2 Key Differentiators

| Feature | Competitors | DataLens |
|---------|-------------|----------|
| Real-time Collaboration | Almost none have it | Figma-style live cursors, shared queries |
| AI Integration | Bolted-on | Native - NLP to SQL, query optimization |
| Web-First | Most are desktop | No install, works anywhere |
| SSO Pricing | Enterprise only ($$$) | Included in Team tier |
| Modern UX | Dated interfaces | TablePlus-level clean design |
| Audit Logs | Enterprise tier | Team tier |

### 1.3 Target Personas

| Persona | Needs | Priority |
|---------|-------|----------|
| **Backend Developer** | Quick queries, debugging, data inspection | P0 |
| **Data Analyst** | Complex queries, exports, reporting | P0 |
| **DevOps Engineer** | Connection management, monitoring | P1 |
| **DBA** | Schema management, performance | P1 |
| **Non-Technical User** | View data, simple edits | P2 |

---

## 2. Tech Stack (March 2026 - Latest)

### 2.1 Frontend

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Framework** | Next.js 16 (App Router) | Turbopack default, 2-5x faster builds, React 19 |
| **Language** | TypeScript 5.7+ | Type safety, strict mode required for tRPC |
| **Styling** | Tailwind CSS v4 | 5x faster builds, Rust core (Lightning CSS) |
| **UI Components** | shadcn/ui + Tremor | Accessible components + data visualization |
| **SQL Editor** | CodeMirror 6 | 300KB vs Monaco's 2.4MB, mobile-friendly |
| **Data Grid** | TanStack Table v8 | Headless, MIT license, ~30KB |
| **ERD Diagrams** | React Flow (xyflow) | Customizable, performant |
| **State (Client)** | Zustand | Simple, 3KB, no boilerplate |
| **State (Server)** | TanStack Query v5 | Caching, background refetch, devtools |
| **Real-time** | PartyKit + Yjs | Edge-native CRDTs, Cloudflare Workers |

### 2.2 Backend

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Runtime** | Bun | 3x faster than Node, native TypeScript |
| **Framework** | Hono | 62k req/sec, 14KB, runs everywhere |
| **API Layer** | tRPC v11 | End-to-end type safety, RSC support |
| **ORM** | Drizzle ORM | SQL transparency, serverless-optimized |
| **Database Adapters** | Drizzle + native drivers | Multi-DB with type safety |
| **Query Parser** | node-sql-parser | AST validation, multi-dialect |
| **Caching** | Redis (Upstash) | Serverless Redis, global replication |
| **Job Queue** | Inngest | Serverless-friendly, event-driven |

### 2.3 Authentication

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Auth Library** | Better Auth v1.5+ | TypeScript-first, Auth.js team joined |
| **Adapter** | Drizzle Adapter | Built-in, schema generation |
| **Features** | 2FA, RBAC, Organizations | All via plugins |
| **OAuth** | GitHub, Google | 35+ providers supported |
| **Sessions** | Cookie-based | Auto-refresh, trusted devices |

```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { twoFactor, admin, organization } from "better-auth/plugins";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    github: { clientId: "...", clientSecret: "..." },
    google: { clientId: "...", clientSecret: "..." },
  },
  plugins: [twoFactor(), admin(), organization()],
});
```

### 2.4 Infrastructure

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Frontend Hosting** | Vercel | Native Next.js 16 support, edge functions |
| **Backend Hosting** | Vercel Functions / Cloudflare Workers | Edge deployment, low latency |
| **Real-time Server** | PartyKit | Cloudflare edge, built-in Yjs |
| **Database (App)** | PostgreSQL (Neon) | Serverless, branching, scale-to-zero |
| **Secrets** | Infisical / HashiCorp Vault | Open-source secrets management |
| **Monitoring** | Sentry + PostHog | Errors + product analytics |
| **AI** | OpenAI API / Anthropic Claude | NLP-to-SQL, query optimization |

### 2.4 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                   │
│           Next.js 16 + React 19 + Tailwind v4 + shadcn/ui           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ CodeMirror 6 │  │ TanStack     │  │ React Flow   │              │
│  │ (SQL Editor) │  │ Table (Grid) │  │ (ERD)        │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         └─────────────────┼─────────────────┘                       │
│              Zustand (UI) + TanStack Query (Server)                  │
│                           │                                          │
└───────────────────────────┼──────────────────────────────────────────┘
                            │ HTTPS / WSS (tRPC + PartyKit)
┌───────────────────────────┼──────────────────────────────────────────┐
│                    BACKEND (Bun + Hono + tRPC)                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              Drizzle ORM + Database Adapter Layer            │    │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌───────┐  │    │
│  │  │   pg   │  │ mysql2 │  │mongodb │  │ mssql  │  │ redis │  │    │
│  │  └────────┘  └────────┘  └────────┘  └────────┘  └───────┘  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                           │                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐    │
│  │ Query      │  │ Schema     │  │ Session    │  │ AI Service │    │
│  │ Engine     │  │ Manager    │  │ Manager    │  │ (NLP→SQL)  │    │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────┴──────────────────────────────────────────┐
│                         EDGE LAYER                                    │
│  ┌────────────────────┐  ┌────────────────────┐                     │
│  │    PartyKit        │  │   Vercel Edge      │                     │
│  │ (Real-time/Collab) │  │   (API Routes)     │                     │
│  └────────────────────┘  └────────────────────┘                     │
└──────────────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────────────┐
│                    CUSTOMER DATABASES                                 │
│  PostgreSQL │ MySQL │ MongoDB │ SQL Server │ Redis │ SQLite          │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.5 Key Stack Decisions Explained

| Decision | Why This Over Alternatives |
|----------|---------------------------|
| **CodeMirror 6 > Monaco** | 8x smaller bundle (300KB vs 2.4MB), mobile support, used by Replit |
| **Bun > Node.js** | 3x faster cold starts, 41k vs 14k req/sec, native TypeScript |
| **Hono > Fastify** | 4x faster (62k req/sec), edge-native, 14KB bundle |
| **tRPC > REST** | Change backend → TypeScript catches frontend errors instantly |
| **Drizzle > Prisma** | SQL transparency (users see real queries), 7KB vs larger bundle |
| **PartyKit > Socket.io** | Edge-native, built-in Yjs, Cloudflare infrastructure |
| **Tailwind v4 > v3** | 5x faster builds, Rust core, automatic content detection |

---

## 3. MVP Features (Phase 1)

### 3.1 Must-Have (Week 1-6)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Connection Manager** | Add/edit/delete database connections with encrypted credential storage | P0 |
| **Multi-DB Support** | PostgreSQL, MySQL, SQLite (minimum viable) | P0 |
| **SQL Editor** | Monaco-based with syntax highlighting, autocomplete | P0 |
| **Query Execution** | Run queries, display results, show execution time | P0 |
| **Data Grid** | View results with sorting, filtering, pagination | P0 |
| **Schema Browser** | Tree view of databases, schemas, tables, columns | P0 |
| **Dark Mode** | Essential for developers | P0 |
| **Export** | CSV, JSON export | P0 |
| **Query History** | Last 100 queries per connection | P0 |
| **SSH Tunneling** | Connect through bastion hosts | P0 |

### 3.2 Differentiators (Week 7-10)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Command Palette** | Cmd+K for quick actions (Linear/Notion style) | P1 |
| **NLP to SQL** | "Show all users who signed up last week" | P1 |
| **Query Optimization** | AI-powered suggestions to improve queries | P1 |
| **ER Diagrams** | Auto-generated schema visualization | P1 |
| **Saved Queries** | Save and organize frequently used queries | P1 |

### 3.3 Non-Goals for MVP
- Real-time collaboration (Phase 2)
- Team features / workspaces (Phase 2)
- NoSQL databases beyond MongoDB (Phase 2)
- Schema migration tools (Phase 3)
- API generation (Phase 3)

---

## 4. Security Requirements (Non-Negotiable)

### 4.1 Credential Security

```typescript
// REQUIRED: Never store credentials in plain text
interface CredentialStorage {
  // AES-256 encryption with user-specific keys
  encrypt(credentials: DBCredentials, userKey: string): EncryptedCredentials;

  // Session-only option (recommended default)
  sessionStorage: boolean;

  // Zero-knowledge option for persistent storage
  clientSideEncryption: boolean;
}
```

**Implementation:**
- AES-256 encryption for all stored credentials
- Envelope encryption with KMS (AWS KMS or HashiCorp Vault)
- 90-day key rotation
- Session-only storage as default (opt-in persistent)

### 4.2 Query Safety

```typescript
// REQUIRED: Validate all queries before execution
interface QueryValidator {
  // Parse and validate SQL
  validate(sql: string): ValidationResult;

  // Block dangerous operations
  blocklist: ['DROP', 'TRUNCATE', 'ALTER', 'CREATE', 'GRANT'];

  // Enforce timeouts
  statementTimeout: 30000; // 30 seconds default

  // Parameterize user inputs
  parameterize(sql: string, params: any[]): PreparedStatement;
}
```

### 4.3 Network Security

- **TLS 1.3** for all connections (WSS, HTTPS)
- **SSL mode `verify-full`** for database connections
- **SSH tunneling** for on-premise databases
- **SSRF prevention**: Block private IPs (10.x, 172.16.x, 192.168.x) and metadata endpoints (169.254.169.254)

### 4.4 Multi-Tenancy (Phase 2+)

- Row-Level Security (RLS) for shared database
- Tenant context in JWT tokens
- Per-tenant connection limits
- Complete audit logging

---

## 5. Development Phases

### Phase 1: MVP (Weeks 1-10)
**Goal:** Functional single-user database client

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1-2 | Project setup | Next.js scaffolding, Tailwind, TypeScript config, CI/CD |
| 3-4 | Core backend | Database adapters (PG, MySQL, SQLite), connection manager |
| 5-6 | Query engine | SQL editor, query execution, result display |
| 7 | Schema browser | Table tree, column inspection, ERD viewer |
| 8-9 | Polish + AI | Dark mode, export, NLP-to-SQL integration |
| 10 | Security hardening | Credential encryption, query validation, SSH tunnels |

**MVP Launch Target:** Week 10

### Phase 2: Collaboration (Weeks 11-18)
**Goal:** Team features, real-time collaboration

| Week | Focus | Deliverables |
|------|-------|--------------|
| 11-12 | Auth + Teams | User accounts, team workspaces, invitations |
| 13-14 | Shared connections | Team connection pools, permission levels |
| 15-16 | Real-time collab | Yjs integration, live cursors, presence |
| 17-18 | Audit + SSO | Activity logs, SAML/OIDC integration |

### Phase 3: Enterprise (Weeks 19-26)
**Goal:** Enterprise-ready features

- Self-hosted deployment (Docker, Kubernetes)
- Advanced security (MFA, IP allowlisting, audit export)
- NoSQL expansion (Redis, Cassandra, DynamoDB)
- Schema migration tools
- API generation from database
- Data masking and anonymization

### Phase 4: Scale (Weeks 27+)
- Usage-based pricing infrastructure
- Global edge deployment
- Advanced analytics and monitoring
- Plugin/extension system

---

## 6. Pricing Strategy

### 6.1 Tier Structure

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 2 connections, 1 user, community support |
| **Pro** | $12/month | Unlimited connections, AI features, export, query history |
| **Team** | $25/user/month | Shared workspaces, SSO, audit logs, real-time collab |
| **Enterprise** | Custom | Self-hosted, SAML, SLA, dedicated support |

### 6.2 Key Pricing Decisions

- **SSO in Team tier** (not Enterprise) - major differentiator
- **Audit logs in Team tier** - competitors gate behind Enterprise
- **No per-connection pricing** - unlimited connections in paid tiers
- **Usage-based add-on** for AI features (tokens/queries)

---

## 7. Go-to-Market Strategy

### 7.1 Launch Plan

1. **Week 10:** Soft launch to 50 beta users (developer communities)
2. **Week 12:** Product Hunt launch
3. **Week 14:** Open source community edition
4. **Week 16:** HackerNews "Show HN" post
5. **Week 20:** Team tier launch

### 7.2 Growth Channels

| Channel | Strategy |
|---------|----------|
| **Product Hunt** | Primary launch platform for dev tools |
| **Reddit** | r/database, r/webdev, r/programming |
| **Twitter/X** | Build in public, dev engagement |
| **HackerNews** | Technical deep-dives, Show HN |
| **Dev.to / Hashnode** | Technical blog posts |
| **YouTube** | Demo videos, tutorials |

### 7.3 Messaging

**For frustrated pgAdmin users:**
> "Tired of pgAdmin's sluggish interface? DataLens is the modern, fast alternative that works in your browser."

**For DBeaver users:**
> "Love DBeaver but hate the 2GB RAM usage? DataLens gives you the same power in a lightweight web app."

**For teams on Retool:**
> "Retool is $50/user. DataLens Team is $25/user with SSO included."

---

## 8. Success Metrics

### 8.1 MVP Success (Week 10)

| Metric | Target |
|--------|--------|
| Beta signups | 500+ |
| Daily active users | 50+ |
| Queries executed | 10,000+ |
| NPS score | 40+ |
| Critical bugs | 0 |

### 8.2 Growth Metrics (Week 20)

| Metric | Target |
|--------|--------|
| Total users | 5,000+ |
| Paid conversions | 2% (100 Pro users) |
| Team tier trials | 50+ |
| MRR | $2,000+ |

---

## 9. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| **Security breach** | Zero-knowledge architecture, session-only default, SOC 2 prep |
| **Performance issues** | Cursor-based pagination, query timeouts, streaming |
| **Competitor response** | Speed to market, focus on collaboration (unique), open source community |
| **AI accuracy** | Start with simple queries, human review for complex, confidence scores |
| **Enterprise trust** | Security docs, compliance badges, open source core |

---

## 10. Claude Code Skills

### Recommended Skills for This Project

Install these skills to ensure consistent, high-quality code generation:

```bash
# Core Planning (most important - 13.4K installs)
npx skills add OthmanAdi/planning-with-files -a claude-code -y

# React & Next.js (Official Vercel)
npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices -a claude-code -y
npx skills add vercel-labs/next-skills -a claude-code -y

# UI & Design (Official Anthropic)
npx skills add anthropics/skills --skill frontend-design -a claude-code -y
npx skills add secondsky/claude-skills --skill tailwind-v4-shadcn -a claude-code -y
npx skills add giuseppe-trisciuoglio/developer-kit --skill shadcn-ui -a claude-code -y

# TanStack Table (prevents 12 documented errors)
npx skills add jezweb/claude-skills --skill tanstack-table -a claude-code -y

# Backend (Bun + Hono)
npx skills add secondsky/claude-skills --skill bun-hono-integration -a claude-code -y
npx skills add madappgang/claude-code --skill bunjs -a claude-code -y

# Authentication
npx skills add better-auth/skills -a claude-code -y

# Testing
npx skills add anthropics/skills --skill webapp-testing -a claude-code -y
npx skills add secondsky/claude-skills --skill vitest-testing -a claude-code -y
npx skills add greyhaven-ai/claude-code-config --skill tdd-typescript -a claude-code -y

# Deployment
npx skills add supercent-io/skills-template --skill vercel-deploy -a claude-code -y
```

### Why Skills?
- Skills provide **strict patterns** that AI must follow
- Prevents AI from "guessing" - forces adherence to best practices
- Skills are project-specific and travel with the repo
- Run `npx skills list` to see installed skills

---

## 11. Coding Standards

**All code must follow the standards in `CODING_STANDARDS.md`**

### Quick Rules

| Rule | Enforcement |
|------|-------------|
| TypeScript strict mode | `tsconfig.json` |
| No `any` types | Biome + TypeScript |
| Named exports only | ESLint/Biome |
| kebab-case files | Convention |
| PascalCase components | Convention |
| Server Components default | Push "use client" to leaves |
| Conventional Commits | commitlint |
| Pre-commit linting | Husky + lint-staged |

### Tooling Stack

| Tool | Purpose |
|------|---------|
| **Biome** | Linting + Formatting (10-25x faster than ESLint+Prettier) |
| **Husky** | Git hooks |
| **lint-staged** | Run linters on staged files |
| **commitlint** | Enforce Conventional Commits |
| **Vitest** | Unit testing |
| **Playwright** | E2E testing |

### Key Files
- `CODING_STANDARDS.md` - Full standards document
- `biome.json` - Linter configuration
- `tsconfig.json` - TypeScript strict settings
- `.husky/` - Git hooks
- `commitlint.config.mjs` - Commit message rules

---

## 12. Immediate Next Steps

### This Week

1. **Initialize project structure**
   ```bash
   # Create Next.js 16 project with Bun
   bunx create-next-app@latest datalens --typescript --tailwind --app --turbopack
   cd datalens

   # Initialize shadcn/ui
   bunx shadcn@latest init

   # Add Tremor for data components
   bun add @tremor/react

   # Install core dependencies
   bun add @codemirror/lang-sql @codemirror/view @codemirror/state
   bun add @tanstack/react-table @tanstack/react-query
   bun add zustand @xyflow/react
   bun add @trpc/server @trpc/client @trpc/react-query
   bun add drizzle-orm postgres
   bun add hono @hono/trpc-server

   # Authentication
   bun add better-auth

   # Dev dependencies
   bun add -d drizzle-kit @types/node
   bun add -d husky lint-staged @commitlint/cli @commitlint/config-conventional
   bun add -d @biomejs/biome vitest @vitejs/plugin-react @testing-library/react
   ```

2. **Set up tooling**
   ```bash
   # Initialize Biome
   bunx @biomejs/biome init

   # Initialize Husky
   bunx husky init

   # Install Claude Code skills
   npx skills add OthmanAdi/planning-with-files -a claude-code -y
   npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices -a claude-code -y
   npx skills add anthropics/skills --skill frontend-design -a claude-code -y
   npx skills add better-auth/skills -a claude-code -y
   ```

3. **Set up core infrastructure**
   - Neon PostgreSQL for app data (serverless)
   - Upstash Redis for sessions/caching
   - GitHub repo + Vercel deployment
   - Better Auth configuration
   - PartyKit for real-time (later)

4. **Build authentication flow**
   - Better Auth setup with Drizzle adapter
   - Login/Register pages (shadcn/ui)
   - Protected routes middleware
   - OAuth providers (GitHub, Google)

5. **Build connection manager**
   - Connection form UI (shadcn/ui)
   - Credential encryption (AES-256)
   - PostgreSQL adapter via Drizzle

6. **Implement SQL editor**
   - CodeMirror 6 integration
   - Basic query execution via tRPC
   - TanStack Table result grid

---

## Appendix: Project Documents

### Research Reports
- `MARKET_RESEARCH_REPORT.md` - Competitors, pricing, gaps
- `ARCHITECTURE_REPORT.md` - Technical patterns, libraries
- `SECURITY_RESEARCH_REPORT.md` - Security requirements, compliance
- `UX-RESEARCH-REPORT.md` - Personas, features, UX patterns

### Standards & Configuration
- `CODING_STANDARDS.md` - TypeScript, Biome, naming, testing, git conventions
- `biome.json` - Linter/formatter configuration
- `tsconfig.json` - TypeScript strict settings
- `commitlint.config.mjs` - Conventional Commits rules
- `.husky/` - Git hooks (pre-commit, commit-msg)

---

## Appendix: Tech Stack Comparison (2026)

### Why We Chose This Stack

| Category | Chosen | Considered | Decision Factor |
|----------|--------|------------|-----------------|
| **Framework** | Next.js 16 | SvelteKit, Remix | Largest ecosystem, Turbopack, Vercel support |
| **SQL Editor** | CodeMirror 6 | Monaco | 8x smaller (300KB vs 2.4MB), mobile-ready |
| **Runtime** | Bun | Node.js 22, Deno | 3x faster, native TS, production-ready |
| **Backend** | Hono | Fastify, Elysia | Edge-native, multi-runtime, 14KB |
| **ORM** | Drizzle | Prisma 7 | SQL transparency, serverless-optimized |
| **Real-time** | PartyKit | Socket.io, Liveblocks | Edge-native, built-in Yjs/CRDTs |
| **Styling** | Tailwind v4 | Panda CSS | 5x faster, ecosystem, v4 Rust core |
| **Data Grid** | TanStack Table | AG Grid | MIT license, headless, 30KB |

### Performance Benchmarks (2026)

| Metric | Our Stack | Traditional Stack |
|--------|-----------|-------------------|
| Cold start | 50ms (Bun) | 150ms (Node) |
| Requests/sec | 62k (Hono) | 15k (Fastify) |
| Bundle size (editor) | 300KB (CM6) | 2.4MB (Monaco) |
| Build time | 14s (Turbopack) | 57s (Webpack) |
| CSS build | Microseconds (v4) | Milliseconds (v3) |

---

*Blueprint created: March 2026*
*Updated: March 2026 (Tech Stack v2.0)*
*Based on 5 parallel research agents analyzing market, architecture, security, UX, and tech stack*
