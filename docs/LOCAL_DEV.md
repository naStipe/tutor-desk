# Local development against a local Supabase stack

Runs the whole app against a disposable local database, with seeded test tutors. Nothing touches the hosted project.

## One-time setup

1. Docker Desktop must be running.
2. `pnpm exec supabase start` (first run pulls images; later runs take seconds). It applies every file in
   `supabase/migrations/` and then `supabase/seed.sql`.
3. Create `.env.development.local` (gitignored; it overrides `.env.local` only in `next dev`):

   ```
   NEXT_PUBLIC_SITE_URL="http://localhost:3000"
   NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="<PUBLISHABLE_KEY from `pnpm exec supabase status -o env`>"
   ```

   The local keys are the public Supabase demo keys, not secrets. `src/lib/env.ts` accepts plain HTTP only for
   `localhost` / `127.0.0.1`.
4. `pnpm run dev`, then sign in at http://localhost:3000/sign-in.

## Test accounts (seed only, never create these on the hosted project)

| Email | Password | Data |
| --- | --- | --- |
| `tutor-a@tutordesk.test` | `TestPass123!` | 3 students (one with a payer), 8 lessons: elapsed, in progress, completed, future, cancelled |
| `tutor-b@tutordesk.test` | `TestPass123!` | 1 student, 1 lesson (second tenant, for cross-tenant checks) |

## Reset and stop

- `pnpm exec supabase db reset` rebuilds the database from migrations and the seed (lesson times are relative to `now()`).
- `pnpm exec supabase stop` stops the containers.
- Run SQL directly: `docker exec -i supabase_db_tutordesk psql -U postgres < file.sql`.

## Windows note

If Docker Desktop crashes at start with "sailor-ingest.sock ... The file cannot be accessed by the system", rename
`%LOCALAPPDATA%\Docker\run` to `run.stale-backup`, create an empty `run` folder and start Docker Desktop again.
