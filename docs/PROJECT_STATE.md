# TutorDesk Project State

## Current Milestone

**TD-000 — Project Foundation**

## Status

**READY FOR REVIEW**

## Current Architecture

TutorDesk is a Next.js App Router modular monolith using React, strict TypeScript, PostgreSQL,
Drizzle ORM, Better Auth, Zod, Tailwind CSS, Vitest, and Playwright. Feature code belongs under
`src/features/`; shared UI, database, and library concerns remain in their existing top-level
modules. The repository does not contain separate services, queues, or event buses.

## Implemented

- Next.js application shell, health route, production build, and baseline browser security headers.
- Docker Compose PostgreSQL 17 service with health checks, loopback-only port binding, and a named
  development volume.
- Drizzle PostgreSQL connection, committed migration history, and current Better Auth schema for
  `user`, `session`, `account`, and `verification`.
- Better Auth email/password server plumbing and catch-all API route; no product authentication UI.
- Strict Zod validation for required runtime environment variables with safe local examples.
- Biome formatting/linting, TypeScript checks, Vitest tests, Playwright E2E coverage, and CI database
  verification.
- Repository-local skills for ticket implementation, project-state maintenance, and independent
  review.
- Architecture, security, product, MVP, decision, and operating documentation.

## Not Implemented

- Sign-up, sign-in, sign-out, password-management, or account-management UI.
- Tutor profile creation, ownership assignment, authorization policies, or tenant-scoped queries.
- Student, lesson, homework, invoice, notification, calendar, or student-portal features.
- Payment processing, external calendar integrations, or email delivery.
- Separate services, background queues, event buses, or marketplace behavior.

## Current Database State

- Local verification used PostgreSQL 17.11 from `postgres:17-alpine`; the Compose service was healthy
  at the end of the review.
- Both committed migrations (`0000_amused_mother_askani` and `0001_open_whizzer`) were applied.
- A real Drizzle query confirmed database `tutordesk` and all four Better Auth tables.
- Required schema indexes were confirmed, and a fresh `pnpm run db:generate` found no schema drift.
- Development credentials live only in `.env.example`, `.env.local`, and Compose configuration;
  `.env.local` is ignored by Git.

## Auth / Authorization State

- Better Auth 1.7.4 is configured with the Drizzle PostgreSQL adapter and email/password capability.
- `/api/auth/[...all]` is wired through the supported Next.js handler and the unauthenticated
  `get-session` endpoint returns `200` with `null`.
- Tutor identity, tutor ownership, tenant authorization, IDOR protection, and student access are not
  implemented. Those are TD-001 responsibilities and must be enforced server-side before business
  entities are introduced.

## Verification State

Verified on 2026-09-12:

- `pnpm install --frozen-lockfile`: passed with the repository-pinned pnpm 12.3.4.
- `pnpm run format:check`: passed.
- `pnpm run lint`: passed.
- `pnpm run typecheck`: passed.
- `pnpm run test`: passed (3 files, 9 tests).
- `pnpm run build`: passed.
- `pnpm run db:migrate`: passed and was idempotent on a second run.
- `pnpm run db:check`: passed against PostgreSQL 17.11.
- Manual `/`, `/api/health`, and `/api/auth/get-session` runtime checks: passed.
- `pnpm run test:e2e`: passed headlessly with the installed Microsoft Edge Playwright channel.
- `pnpm audit` and `pnpm audit --prod`: passed with no known vulnerabilities.
- All three repository skills satisfy the Agent Skills frontmatter rules enforced by the bundled
  `quick_validate.py`. The script itself could not execute here because PyYAML is not installed; the
  same checks were applied through an equivalent parser.

## Known Issues / Technical Debt

- Playwright's managed Chromium headless-shell download timed out against each CDN endpoint in this
  environment. The suite itself passed using the supported installed Edge channel via
  `PLAYWRIGHT_CHANNEL=msedge`; retry `pnpm run test:e2e:install` when CDN access is available.
- Next.js 16, TypeScript 7, and Vitest 5 are available major upgrades. They were intentionally left
  for separately scoped compatibility work; all direct runtime and development dependencies used by
  TD-000 are supported and audit-clean.

## Active Decisions / Constraints

- PostgreSQL is the single application datastore; SQLite and in-memory substitutes are not allowed.
- Migrations are generated and committed, then applied with `db:migrate`; schema push is not part of
  the repository workflow.
- Multi-tenant isolation must be enforced in every server-side query and mutation once ownership is
  introduced.
- Biome is the repository formatter and linter; TypeScript remains the dedicated type checker.
- CI validates migrations and a real database query. E2E remains a local foundation check until a
  later ticket deliberately adds browser installation to CI.
- See `docs/DECISIONS.md` for the recorded architectural decisions.

## Next Recommended Task

**TD-001 — Authentication and Tutor Ownership Foundation**
