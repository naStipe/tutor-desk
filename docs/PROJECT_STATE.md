# TutorDesk Project State

## Current Milestone

- Milestone: **TD-001S — Supabase Foundation Migration**
- Status: **Implemented; independent review required**
- Branch: `td-001s-supabase-migration`
- Base: `backup/td-000-baseline` at `a6deb5b`
- Last updated: 2026-09-13

## Current Reality

TutorDesk is a Next.js App Router modular monolith using hosted Supabase Auth and PostgreSQL.
Drizzle, Better Auth, the standalone PostgreSQL Compose service, and their migrations/wrappers have
been removed. There is no local Supabase or Docker development requirement.

The repository is linked to hosted project `cmlvtnjoynffrznyelym` (Supabase name: TutorHub). It was
healthy at inspection time but contained disposable public tables and a global Auth trigger from an
earlier test implementation. After the owner confirmed that state was irrelevant, TD-001S removed
it with a reviewed forward migration. Existing managed Auth identities were left intact. The hosted
public schema now contains only `tutor_profile` and has no custom `auth.users` trigger or public
function.

## Database and authorization

- Both TD-001S migrations are applied remotely and match hosted migration history. The first creates
  `tutor_profile`; the second removes the explicitly discarded test schema and its Auth trigger.
- `tutor_profile.user_id` is a UUID primary key referencing `auth.users(id) ON DELETE CASCADE`.
- `created_at` and `updated_at` are non-null `timestamptz` values with database defaults.
- RLS permits authenticated users to select, insert, and update only their own row. Anonymous and
  cross-user access are denied; no ordinary delete policy exists.
- Profile initialization is explicit and idempotent. There is no global Auth-user trigger.
- Generated hosted types are committed at `src/lib/supabase/database.types.ts`.

## Authentication

- Email/password signup supports immediate sessions and email-confirmation-required projects.
- Login, logout, cookie session restoration, confirmation callback, and `/dashboard` protection are
  implemented with `@supabase/ssr` and `@supabase/supabase-js`.
- Protected server behavior validates identity through `auth.getUser()` and performs profile access
  in that user's RLS context.
- The hosted project currently has email confirmations disabled and older Google/MFA/SMS settings.
  TD-001S did not remove or weaken those pre-existing settings; its UI exposes email/password only.

## Not Implemented

- Student authentication and all student, lesson, homework, invoice, calendar, and portal features.
- Password reset, account management, MFA UI, OAuth UI, organizations, invitations, or RBAC.
- Storage, email delivery, payments, monitoring, calendar integrations, queues, or separate services.

## Verification State

- Supabase MCP configuration is enabled with OAuth for the intended project-specific endpoint.
- Hosted project linkage/reachability and project ref: passed.
- Migration dry runs, forward applications, and local/remote migration-history match: passed.
- Final hosted inventory: only `public.tutor_profile`; no public functions or custom Auth-user
  triggers.
- Generated-type drift check against the hosted project: passed.
- Rollback-only hosted schema/RLS verification: passed.
- Disposable-user hosted signup, profile initialization, logout, login, validated identity, and
  cleanup: passed.
- `pnpm run format:check`, `lint`, `typecheck`, and unit tests: passed (3 files, 7 tests).
- `pnpm run build`: passed with all application routes compiled.
- Playwright E2E: passed using the installed Microsoft Edge channel (1 test).
- `pnpm audit` and `pnpm audit --prod`: passed with no known vulnerabilities.

## Known Issues

- Supabase's advisor reports that leaked-password protection is disabled for hosted Auth.
- Supabase MCP is configured and OAuth-enabled, but this already-running task cannot load newly added
  MCP tools until a new task/session starts; CLI access provided project and database verification.
- Ordinary CI intentionally has no hosted credentials, so remote schema/RLS and generated-type drift
  are release checks rather than pull-request checks.

## Next Recommended Task

**Independent review of TD-001S, focused on SSR cookie handling, explicit profile initialization,
the hosted cleanup migration, and RLS verification.**
