# TutorDesk

TutorDesk is a responsive business-management SaaS for independent private tutors. It is a
TypeScript modular monolith built with Next.js App Router, Supabase Auth, hosted Supabase
PostgreSQL, Zod, Tailwind CSS, Vitest, and Playwright.

## Prerequisites

- Node.js 22 or newer
- Corepack
- Access to the hosted TutorDesk Supabase development project

Docker and a local Supabase stack are not part of the current workflow.

## Setup

```powershell
corepack enable
pnpm install --frozen-lockfile
Copy-Item .env.example .env.local
pnpm exec supabase login
pnpm exec supabase link --project-ref cmlvtnjoynffrznyelym
pnpm run dev
```

Set the hosted project's public URL and publishable key in `.env.local`. Never use a Supabase
secret or service-role key in a `NEXT_PUBLIC_*` variable. Add local and deployed
`/auth/confirm` URLs to the hosted Auth redirect allow list when configuring a new environment.

## Database workflow

`supabase/migrations/` is the schema source of truth. Review and dry-run each migration before
applying it to the hosted development project:

```powershell
pnpm run db:migrations
pnpm run db:push:dry
pnpm run db:push
pnpm run db:test:hosted
pnpm run db:types | Set-Content src/lib/supabase/database.types.ts
```

The hosted RLS check uses two existing Auth identities inside a transaction and always rolls back.
It must only be run against the linked TutorDesk development project. Generated types reflect the
linked hosted schema and are committed. Ordinary CI uses no hosted credentials; hosted schema and
type-drift checks are deliberate developer/release checks.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm run dev` | Start Next.js on port 3000 |
| `pnpm run verify` | Run format, lint, typecheck, unit tests, and build |
| `pnpm run test:e2e` | Run Playwright browser tests |
| `pnpm run db:migrations` | Compare local and hosted migration history |
| `pnpm run db:push:dry` | Preview hosted pending migrations |
| `pnpm run db:push` | Apply reviewed migrations to the linked hosted project |
| `pnpm run db:test:hosted` | Run rollback-only hosted schema/RLS verification |
| `pnpm run db:types` | Print types generated from project `cmlvtnjoynffrznyelym` |
| `pnpm run db:types:check` | Compare committed types with the hosted schema |
| `pnpm run test:auth:hosted` | Exercise hosted signup/login/profile flow with cleanup |

Read `AGENTS.md` and `docs/PROJECT_STATE.md` before contributing.
