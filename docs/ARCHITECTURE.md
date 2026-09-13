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

`public.homework` rows are owned by a tutor through `tutor_id`, reference exactly one
`public.student(id)`, and optionally one `public.lesson(id)` (`ON DELETE SET NULL`, so deleting a
lesson never deletes its homework). Its insert/update RLS policies use the same correlated-subquery
pattern as `lesson` to require the referenced student — and, when present, the referenced lesson —
belong to that same tutor. There is no student portal yet, so submission and feedback text are both
recorded by the tutor; see `docs/DOMAIN_MODEL.md` for the ownership caveat this implies.

## Interactive calendar

`/dashboard/lessons` renders `LessonCalendar` (`src/features/lessons/components/LessonCalendar.tsx`),
a client component implementing a day/week time-grid with click-to-create and drag-to-reschedule,
built on native Pointer Events rather than a drag-and-drop library or HTML5 Drag and Drop (kept the
dependency surface unchanged per the no-new-dependency default). Two server actions support it
without a full page navigation: `moveLessonAction` (reschedule; called directly from client code via
`useTransition`, not bound to a `<form>`) and `quickCreateLessonAction` (create from a calendar
click). Both re-derive `tutorId` from the session and re-validate through the same Zod schema and RLS
policies as the form-based `createLessonAction`/`updateLessonAction` — the calendar is a second entry
point into the same validated, ownership-checked data layer, not a parallel path around it. The
calendar optimistically updates its local state on drag/create and reconciles with `router.refresh()`
once the server call resolves, reverting on error.

## Repository boundaries

- `src/app/`: routes, layouts, Server Components, and route handlers
- `src/features/`: authentication and domain behavior
- `src/lib/supabase/`: browser/server clients and generated database types
- `supabase/migrations/`: canonical forward schema history
- `supabase/tests/`: hosted, transaction-rollback database verification

The application has no ORM, generic repository layer, auth-provider abstraction, microservice,
queue, Redis dependency, or persistence fallback.
