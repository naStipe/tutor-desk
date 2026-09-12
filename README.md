# TutorDesk

TutorDesk is a responsive business-management SaaS for independent private tutors. It is a
TypeScript modular monolith built with Next.js App Router, React, PostgreSQL, Drizzle ORM, Better
Auth, Zod, Tailwind CSS, Vitest, and Playwright. It is not a tutor marketplace.

The repository currently contains project and authentication infrastructure only. See
`docs/PROJECT_STATE.md` for the verified implementation state and `docs/MVP.md` for intended V1
scope.

## Prerequisites

- Node.js 22 or newer
- Corepack (included with supported Node.js 22 installations)
- Docker Desktop with the Linux container engine running

## Clean-clone setup (PowerShell)

1. Enable the package manager declared in `package.json` and install dependencies:

   ```powershell
   corepack enable
   pnpm install --frozen-lockfile
   ```

2. Create a local environment file:

   ```powershell
   Copy-Item .env.example .env.local
   ```

   Replace `BETTER_AUTH_SECRET` with a high-entropy value of at least 32 characters. The example
   database credentials are development-only and match `compose.yaml`. Local environment files are
   ignored by Git.

3. Start PostgreSQL and wait for it to become healthy:

   ```powershell
   docker compose up -d
   docker compose ps
   ```

4. Apply the committed migrations and verify the connection and Better Auth tables:

   ```powershell
   pnpm run db:migrate
   pnpm run db:check
   ```

5. Start TutorDesk:

   ```powershell
   pnpm run dev
   ```

   Open `http://localhost:3000`. Stop PostgreSQL later with `docker compose down`; the named volume
   preserves local data.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm run dev` | Start the Next.js development server on port 3000 |
| `pnpm run build` | Create the production build |
| `pnpm run start` | Run the production build on port 3000 |
| `pnpm run format` | Format supported repository files with Biome |
| `pnpm run format:check` | Check formatting without modifying files |
| `pnpm run lint` | Run Biome static analysis |
| `pnpm run typecheck` | Run TypeScript type checking |
| `pnpm run test` | Run Vitest unit tests |
| `pnpm run test:watch` | Run Vitest in watch mode |
| `pnpm run test:e2e:install` | Install Playwright's Chromium headless shell |
| `pnpm run test:e2e` | Start the app as needed and run headless Chromium E2E tests |
| `pnpm run db:generate` | Generate a migration after an intentional schema change |
| `pnpm run db:migrate` | Apply committed Drizzle migrations |
| `pnpm run db:check` | Execute a real query and verify Better Auth tables |
| `pnpm run db:studio` | Open Drizzle Studio |
| `pnpm run verify` | Run format, lint, typecheck, unit tests, and build |

`pnpm run test:e2e`, `pnpm run db:migrate`, and `pnpm run db:check` require the local environment
file and healthy PostgreSQL service. E2E is intentionally not in CI during the foundation milestone;
CI does validate formatting, linting, types, unit tests, migrations, a real database query, and the
production build. If the managed Chromium download is unavailable and Microsoft Edge is installed,
set `$env:PLAYWRIGHT_CHANNEL = "msedge"` for that PowerShell session before running E2E.

## Repository layout

```text
src/app/             Next.js routes and layouts
src/components/      Shared UI components
src/features/        Feature-oriented modules (future tickets)
src/db/              Drizzle client, schemas, and migrations
src/lib/             Shared environment and authentication infrastructure
src/test/            Vitest tests
e2e/                 Playwright tests
docs/                Product, architecture, security, decisions, and project state
.agents/skills/      Repository-local Codex workflows
```

Read `AGENTS.md` before making changes.
