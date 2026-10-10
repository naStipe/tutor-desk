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
browser code. Apart from the TD-020 email paths (see "Email notifications and the service-role boundary"), there
is no service-role dependency, and there is no in-memory or alternate persistence fallback.

Database changes are committed as SQL migrations before being applied. Supabase MCP and CLI may
inspect hosted state, but MCP is not an undocumented schema mutation path. Remote databases must
never be reset or have unrelated data dropped without explicit authorization.

## Boundary and browser protections

External inputs are validated with Zod. React escaping remains the default; unsafe HTML injection
is prohibited. The Next.js configuration preserves anti-framing, content-type, referrer, permissions,
and Content Security Policy headers established in TD-000.

## Email notifications and the service-role boundary (TD-020)

**This is the first code path in the repo that bypasses RLS.** `src/lib/supabase/admin.ts` builds a
Supabase client with `SUPABASE_SERVICE_ROLE_KEY`. Reason: the lesson-reminder cron has no user
session and must read lessons across all tutors. Until TD-020 the earlier statement "no
service-role dependency" held; it no longer does once the feature is activated (the key is only
read when an email path runs, never at startup, and never when the master switch is off).

Safeguards:

- The admin client is imported only from `src/features/notifications/` and is never created in the
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
