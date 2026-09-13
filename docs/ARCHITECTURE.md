# TutorDesk Architecture

TutorDesk is a TypeScript modular monolith deployed as one Next.js App Router application.

## Core stack

- Next.js App Router, React, strict TypeScript, and Node.js 22+
- Supabase Auth with email/password and cookie-based SSR via `@supabase/ssr`
- Hosted Supabase PostgreSQL queried directly with typed `supabase-js`
- SQL migrations in `supabase/migrations/` as the schema source of truth
- Types generated from the linked hosted project in `src/lib/supabase/database.types.ts`
- Zod boundary validation, Tailwind CSS, Biome, Vitest, and Playwright

Docker and local Supabase are not part of the current development architecture. The linked hosted
development project is `cmlvtnjoynffrznyelym`.

## Authentication and authorization

Supabase Auth owns identity in `auth.users`. TutorDesk application identity is represented by
`public.tutor_profile`, whose `user_id` is both its primary key and a cascade foreign key to
`auth.users(id)`.

Protected server behavior validates the current identity with Supabase Auth and derives ownership
from that identity. It never accepts a browser-supplied owner ID. RLS independently restricts each
tutor to their own profile. Authentication answers who the user is; server checks and RLS answer
which TutorDesk data they may access.

Profile initialization is explicit and idempotent during tutor signup confirmation, immediate
signup, login, and protected dashboard entry. There is no global `auth.users` trigger because future
student identities must not automatically become tutors.

`public.student` rows are owned by a tutor through `tutor_id`, a foreign key to
`public.tutor_profile(user_id)` (not `auth.users` directly). Ownership is always derived from the
authenticated session server-side; RLS independently restricts each tutor to their own students.
Archiving a student sets `archived_at` rather than deleting the row; there is no hard-delete path in
the application.

`public.lesson` rows are owned by a tutor through `tutor_id` and reference exactly one
`public.student(id)` through `student_id`. Both the insert and update RLS policies additionally
require that the referenced student's `tutor_id` match the lesson's `tutor_id` (a correlated
subquery), so a tutor cannot link a lesson to another tutor's student even though `tutor_id` alone
would pass ownership. There is no hard-delete path; `cancelled`/`no_show` status values serve the
lifecycle role that `archived_at` serves for students.

## Repository boundaries

- `src/app/`: routes, layouts, Server Components, and route handlers
- `src/features/`: authentication and domain behavior
- `src/lib/supabase/`: browser/server clients and generated database types
- `supabase/migrations/`: canonical forward schema history
- `supabase/tests/`: hosted, transaction-rollback database verification

The application has no ORM, generic repository layer, auth-provider abstraction, microservice,
queue, Redis dependency, or persistence fallback.
