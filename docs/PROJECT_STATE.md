# TutorDesk Project State

## Current Milestone

- Milestone: **TD-002 — Student Management + TutorDesk App UI**
- Status: **Implemented; independent review recommended**
- Branch: `main`
- Last updated: 2026-09-13

## Current Reality

TutorDesk is a Next.js App Router modular monolith using hosted Supabase Auth and PostgreSQL.
Tutors can sign in with email/password or Google, land in a real application shell with sidebar/mobile
navigation, and manage a student roster: add, list, view, edit, and archive students. The application
no longer looks like isolated demo pages; `/dashboard` and `/dashboard/students/**` share a protected
layout with consistent navigation, typography, and form styling.

The repository is linked to hosted project `cmlvtnjoynffrznyelym` (Supabase name: TutorHub).

## Database and authorization

- `public.tutor_profile` (from TD-001S) is unchanged.
- TD-002 adds `public.student`: `id` (uuid, default `gen_random_uuid()`), `tutor_id` (uuid, references
  `public.tutor_profile(user_id)` `ON DELETE CASCADE`), `name`, `email` (nullable), `notes` (nullable),
  `archived_at` (nullable timestamptz), `created_at`, `updated_at`. Migration:
  `supabase/migrations/20260913150812_create_student.sql`, applied remotely via `supabase db push`.
- RLS is enabled on `student`. Policies compare `(select auth.uid())` to `tutor_id` for select, insert,
  and update. `anon` has no grants. There is no ordinary delete policy; archiving sets `archived_at`.
- Generated hosted types are committed at `src/lib/supabase/database.types.ts` and verified in sync
  with `pnpm run db:types:check`.
- Hosted RLS/ownership behavior (own-row create/update/archive, cross-tenant read/insert/update denial)
  is verified by `supabase/tests/student_rls.sql`, run via `pnpm run db:test:hosted:students`.

## Authentication

Unchanged from TD-001S/Google OAuth work: email/password and Google sign-in, cookie session
restoration, confirmation callback, and `/dashboard` protection via `@supabase/ssr`. The protected
segment now lives under a single `src/app/dashboard/layout.tsx` that validates the session, initializes
the tutor profile, and renders the shared `AppShell` around every dashboard route.

## UI

- `src/components/AppShell.tsx`: client component providing the sidebar (desktop) / hamburger menu
  (mobile) navigation, account email, and sign-out control. Nav shows Dashboard and Students as real
  links; Lessons/Calendar/Homework/Invoices render as disabled "Coming later" entries — no fake pages.
- `src/components/{PageHeader,EmptyState,Field,Button}.tsx`: small shared primitives used by the
  dashboard and student pages to keep headers, empty states, form fields, and buttons consistent.
- `/dashboard`: redesigned home with a time-based greeting, a real "Active students" count card, a
  placeholder card indicating lessons/homework/invoices are not yet available, and a getting-started
  empty state (or quick action) depending on whether the tutor has any students.
- `/dashboard/students`: active student list with name/email, an "Add student" action, and a clean
  empty state when there are no students.
- `/dashboard/students/new`: create form (name required, optional email/notes) using
  `createStudentAction`.
- `/dashboard/students/[id]`: detail page with an inline edit form (`updateStudentAction`) and an
  Archive action (`archiveStudentAction`). An invalid or non-owned ID renders `notFound()` (RLS returns
  no row for a non-owned student, so cross-tenant access fails closed as a 404).
- Verified responsive behavior manually: sidebar on desktop, hamburger-toggled nav on a 375px mobile
  viewport.

## Not Implemented

- Lessons, calendar, homework, invoices, student portal, invitations, payments.
- Student phone/parent contact fields, default rate, tags, avatar, billing info, custom fields.
- Archived-student management UI beyond the default active-only list (not required by TD-002).
- Password reset, account settings, MFA UI, organizations, multiple tutors, search/pagination
  infrastructure.

## Verification State

- `pnpm run format:check`, `lint`, `typecheck`, `test`: passed (4 unit test files, 11 tests, including
  new `src/test/student-schemas.test.ts`).
- `pnpm run build`: Next.js compiled successfully, type-checked, and generated all static/dynamic
  routes (8/8). The `output: "standalone"` file-tracing step then failed with `EPERM` while creating
  symlinks under `.next/standalone/node_modules` — a pre-existing Windows-local-filesystem permission
  limitation unrelated to this change (not reproducible on Linux/CI). Application code and routing are
  otherwise verified as compiling and type-safe.
- Hosted migration: dry-run reviewed, then applied with `supabase db push --linked`; `list_tables`
  confirms `public.student` with RLS enabled and the expected FK/columns.
- Hosted RLS/ownership SQL test (`supabase/tests/student_rls.sql`, transaction-rolled-back): passed —
  own-tutor create/update/archive succeeded; cross-tenant read, insert, and update were denied.
- Generated-type drift check (`pnpm run db:types:check`): passed.
- Manual browser walkthrough against the hosted dev project (real signed-in account): sign in → dashboard
  → add student → student appears in list and detail → edit student → archive student → student
  disappears from active list and empty state renders → mobile hamburger nav opens/closes. All passed.
  One student record created during this walkthrough was archived (not hard-deleted) and remains in the
  hosted dev database in an archived state.
- Playwright E2E: not run. `e2e/app.spec.ts` requires a Chromium binary that is not installed in this
  environment (`npx playwright install` was not run to avoid an unrequested environment change);
  `e2e/auth.spec.ts` predates the current `AuthForm` markup (it references `#signup-name` and other
  selectors that no longer exist) and was already stale before this task — not modified, as it is
  unrelated to the assigned ticket.
- `pnpm audit`: not re-run; no new dependencies were added in this task.

## Known Issues

- Supabase's advisor still reports leaked-password protection disabled for hosted Auth (pre-existing,
  unrelated to TD-002).
- `e2e/auth.spec.ts` is stale relative to the current `AuthForm` component and will fail if run;
  fixing it is outside TD-002's scope.
- `pnpm run build`'s standalone output step cannot complete on this Windows machine due to symlink
  permissions; verify on Linux/CI or with Windows Developer Mode enabled before relying on the
  standalone build output locally.

## Next Recommended Task

**Lessons: a minimal `lesson` domain (single lessons tied to a student, an internal day/week calendar
view, and marking lessons completed/cancelled/no-show) so the dashboard's "Coming later" placeholder
can become real, following the same ownership/RLS and app-shell patterns established in TD-002.**
