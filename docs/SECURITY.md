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
and update. Anonymous access and ordinary deletes are denied on both tables. Cross-tenant access
must fail closed.

Any route accepting a resource ID must verify ownership server-side and return 404 or 403 when
ownership does not match. IDOR analysis is required for every tutor-owned feature. The student
detail/edit page relies on RLS to fail closed: a student ID owned by another tutor resolves to no
row and the route renders a 404, never another tutor's data. Student ownership (`tutor_id`) is
always derived from the authenticated session server-side and is never accepted from the browser.

## Credentials and data access

Only the Supabase URL and publishable key may appear in `NEXT_PUBLIC_*`. Service-role keys, secret
keys, access tokens, database passwords, and real `.env` files must never be committed or exposed to
browser code. TD-001S has no service-role dependency and no in-memory or alternate persistence
fallback.

Database changes are committed as SQL migrations before being applied. Supabase MCP and CLI may
inspect hosted state, but MCP is not an undocumented schema mutation path. Remote databases must
never be reset or have unrelated data dropped without explicit authorization.

## Boundary and browser protections

External inputs are validated with Zod. React escaping remains the default; unsafe HTML injection
is prohibited. The Next.js configuration preserves anti-framing, content-type, referrer, permissions,
and Content Security Policy headers established in TD-000.
