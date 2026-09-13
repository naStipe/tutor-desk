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

## Repository boundaries

- `src/app/`: routes, layouts, Server Components, and route handlers
- `src/features/`: authentication and domain behavior
- `src/lib/supabase/`: browser/server clients and generated database types
- `supabase/migrations/`: canonical forward schema history
- `supabase/tests/`: hosted, transaction-rollback database verification

The application has no ORM, generic repository layer, auth-provider abstraction, microservice,
queue, Redis dependency, or persistence fallback.
