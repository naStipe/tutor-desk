# TutorDesk Security Policy & Invariants

## Identity and sessions

Supabase Auth owns passwords, identity, email verification, and session cookies. Server Components,
route handlers, and server actions validate the current identity with `auth.getUser()` before
protected work. Middleware refreshes cookie-based sessions. Browser-provided user IDs and editable
user metadata are never authorization evidence.

## Tutor ownership

Every tutor-owned row must be scoped to the validated tutor identity in server code. Row Level
Security is an independent database boundary, not a substitute for server authorization.
`public.tutor_profile` policies compare `(select auth.uid())` with `user_id` for select, insert, and
update. `public.student` policies compare `(select auth.uid())` with `tutor_id` for select, insert,
and update. `public.lesson` policies compare `(select auth.uid())` with `tutor_id` for select,
insert, and update, and the insert/update policies additionally require (via a correlated subquery)
that `student_id` reference a student owned by that same tutor — this prevents a tutor from linking a
lesson to another tutor's student even though the `tutor_id` check alone would otherwise pass.
`public.homework` follows the same pattern: `tutor_id` ownership plus a correlated-subquery
requirement that `student_id` (always) and `lesson_id` (when present) belong to that same tutor.
Anonymous access and ordinary deletes are denied on all four tables. Cross-tenant access must fail
closed.

Any route accepting a resource ID must verify ownership server-side and return 404 or 403 when
ownership does not match. IDOR analysis is required for every tutor-owned feature. The student,
lesson, and homework detail/edit pages rely on RLS to fail closed: an ID owned by another tutor
resolves to no row and the route renders a 404, never another tutor's data. Ownership (`tutor_id`) is
always derived from the authenticated session server-side and is never accepted from the browser —
including the calendar's `moveLessonAction`/`quickCreateLessonAction`, which are called directly from
client code (not through a `<form>`) but still re-derive `tutorId` from `auth.getUser()` and are still
independently enforced by RLS, exactly like the form-based actions.

## Credentials and data access

Only the Supabase URL and publishable key may appear in `NEXT_PUBLIC_*`. Service-role keys, secret
keys, access tokens, database passwords, and real `.env` files must never be committed or exposed to
browser code. Apart from the TD-020 email paths (see "Email notifications and the service-role boundary") and account
deletion (see "Account deletion"), there is no service-role dependency, and there is no in-memory or alternate persistence fallback.

Database changes are committed as SQL migrations before being applied. Supabase MCP and CLI may
inspect hosted state, but MCP is not an undocumented schema mutation path. Remote databases must
never be reset or have unrelated data dropped without explicit authorization.

## Boundary and browser protections

External inputs are validated with Zod. React escaping remains the default; unsafe HTML injection
is prohibited. `next.config.ts` sends `X-Frame-Options: DENY` (anti-framing; it had been dropped at some
point and was restored on 2026-10-15), `X-Content-Type-Options`, `Referrer-Policy` and
`Permissions-Policy` on every route. **No Content Security Policy header is set today**, although TD-000
intended one; adding it needs care (Next.js inline scripts, the JSON-LD block, Vercel Speed Insights).

## Email notifications and the service-role boundary (TD-020)

**This is the first code path in the repo that bypasses RLS.** `src/lib/supabase/admin.ts` builds a
Supabase client with `SUPABASE_SERVICE_ROLE_KEY`. Reason: the lesson-reminder cron has no user
session and must read lessons across all tutors. Until TD-020 the earlier statement "no
service-role dependency" held; it no longer does once the feature is activated (the key is only
read when an email path runs, never at startup, and never when the master switch is off).

Safeguards:

- The admin client is imported only from `src/features/notifications/` and `src/features/account/` and is never created in the
  browser (runtime guard). The key is a server-only env var, never `NEXT_PUBLIC_*`, never logged.
- Cross-tenant reads happen only through `due_lesson_reminders(...)`, a SQL function executable
  **only by `service_role`** (execute revoked from public, anon, authenticated). Its inputs are a
  server-computed time window and a capped limit; it joins student and tutor on `tutor_id` so a
  lesson is never paired with another tutor's student. There is no user input anywhere in the cron
  path.
- The cron route `GET /api/cron/lesson-reminders` requires `Authorization: Bearer ${CRON_SECRET}`,
  compared in constant time (SHA-256 digests with `timingSafeEqual`); an unset secret authorizes
  nothing. Authentication runs before the master-switch check; 401 reveals nothing else. With
  `EMAIL_NOTIFICATIONS_ENABLED` not exactly `true` the route returns `{"disabled":true}` and sends
  nothing.
- The manual balance reminder is a server action: `requireTutorId()` (session), Zod validation of
  the student id (uuid), the student is loaded through the tutor's own RLS-scoped client **and**
  `student.tutor_id === tutorId` is re-checked, the amount is read via `tutor_unpaid_summary`
  (itself scoped to `auth.uid()`), and the recipient comes from the database row, never from the
  request. The admin client is used only to write the log row, through
  `claim_balance_reminder(tutor, student, ...)`, which re-verifies ownership and enforces the
  one-per-hour limit under an advisory lock. IDOR: another tutor's student id yields a generic
  error and no email.
- `public.notification_log`: RLS enabled; tutors may `select` only rows with
  `tutor_id = auth.uid()`; no insert/update/delete policy or privilege for anon or authenticated.
  Rows hold a masked recipient (`s***@example.com`), kind, status, error code; never the address,
  subject or body. `(kind, lesson_id)` is unique, so a lesson is reminded at most once, even with
  overlapping runs.

Template and transport checklist:

- Every user-controlled value (student, tutor and subject names, payment instructions, contact
  email, meeting URL) is HTML-escaped; payment instructions render through escaped line breaks only.
  Meeting links render only when the scheme is `http` or `https`.
- Recipients are validated with Zod `email()` (rejects whitespace/control characters, so no header
  injection); subjects are collapsed to a single line; mail is sent as a JSON body to Resend's REST
  API, never by concatenating SMTP headers.
- Secrets (`RESEND_API_KEY`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`) live only in environment
  variables; `.env.example` has placeholders. Errors returned to the browser are generic; Resend
  failures are reduced to a short code (`http_422`, `network_error`) in the log.
- Auth emails (confirmation, recovery) are owned by Supabase Auth; the sender, SMTP credentials and
  redirect allow-list are configured in the Supabase dashboard (docs/EMAIL_SETUP.md). The recovery
  flow does not reveal whether an address is registered.


## Account deletion

`deleteAccountAction` (`src/features/account/actions.ts`) is the second code path that uses the
service-role client (`createAdminClient`). It deletes the signed-in tutor's own account only.

- **No client-provided id.** The only form field is the typed confirmation email. The target user id
  comes from `supabase.auth.getUser()` (asks the auth server, so a forged or stale cookie fails), and
  the typed email must equal that user's email (case-insensitive). Zod validates the field. A tutor
  cannot name another account, so there is no IDOR path; another tenant's data is reached only
  through the foreign keys of the session user's own rows.
- **What is deleted.** Every tutor-owned table references `tutor_profile(user_id)` with `on delete
  cascade`, and `tutor_profile` references `auth.users(id)` with `on delete cascade`. Deleting the
  auth user therefore removes students, lessons, lesson series, homework, comments and attachment
  rows, subjects, rates, lesson packages, package templates and notification logs, plus the portal
  memberships and invites of the tutor's students (cascade through `student`). Storage objects are
  not covered by foreign keys, so the action first removes the files listed in
  `homework_attachment` for that `tutor_id`, in chunks of 100. If that step fails nothing else is
  deleted and the tutor sees a generic error. No migration is needed.
- **Not deleted.** The auth accounts of parents or students who joined through the portal (they
  lose access to this tutor's student, nothing more). Storage files that no `homework_attachment`
  row points to (an orphan from a crash between upload and insert) would remain; none are expected.
  Supabase and Vercel backups and logs expire on the providers' schedules.
- **A user who is both a tutor and a portal member** loses both, because the auth user is removed.
- **After deletion** the session cookies are cleared (`signOut({ scope: "local" })`, errors
  ignored) and the tutor is redirected to `/?notice=account-deleted`. Errors never expose provider
  text.
- Tests: `src/test/account-deletion.test.ts` (schema, email match, deletion order and failure
  handling with a fake admin client). **Not tested:** the action end to end against Supabase.

## Lesson packages (TD-022)

`lesson_package` is tutor-owned with RLS (select/insert/delete own; insert requires the student to belong to the tutor). A
composite foreign key `lesson(package_id, student_id)` → `lesson_package(id, student_id)` makes the database reject a
lesson that points at a package of another student, so a forged `package_id` cannot consume another tutor's credits. The
SQL functions `sync_student_package_credits` and `complete_elapsed_lessons` run as the caller (security invoker, RLS
applies), are not executable by `anon`, and only touch rows with `tutor_id = auth.uid()`.
