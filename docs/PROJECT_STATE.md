# TutorDesk Project State

This document is the operational source of truth for repository state across agent and human
transitions. Update this document after every material task.

## Current Milestone

- Milestone: **TD-001A Tutor Authentication UX**
- Status: **Completed**
- Branch: `td-001a-auth-ux`
- Last updated: 2026-03-09

## Current Reality Summary

- The repository contains a single Next.js App Router application in TypeScript.
- PostgreSQL and Drizzle ORM are configured. Baseline migrations exist for Better Auth.
- Better Auth server and client configurations are fully active with resilient fallback for local/test execution.
- Dedicated Tutor Authentication UX pages are implemented:
  - `/sign-up`: Tutor registration form with client-side Zod validation, error handling, and auto-signin.
  - `/sign-in`: Tutor login form with client-side Zod validation, credential authentication, and redirection.
  - `/`: Main dashboard/shell displays session recognition (`AuthStatusCard`), showing active tutor identity, authentication status badge, and sign-out capabilities.
  - Sign-in/Sign-up guard: Authenticated users visiting auth routes are shown active session notices with quick return/sign-out actions.
- Code quality is strictly verified by Biome (formatting, linting), TypeScript compiler (`tsc --noEmit`),
  Vitest (unit and Better Auth API integration tests), and Playwright (E2E browser tests).
- Per scope constraints of TD-001A, no database schemas were modified, no migrations were added, and no TutorProfile entity was introduced.

## Architecture & Conventions Reality

- Framework: Next.js 15+ (App Router)
- Language: TypeScript with strict mode enabled
- Database: PostgreSQL with Drizzle ORM (`drizzle-orm`, `drizzle-kit`)
- Authentication: Better Auth with Drizzle adapter and resilient fallback proxy
- Styling: Tailwind CSS v4 with `@tailwindcss/postcss`
- Testing: Vitest (unit/integration), Playwright (E2E)
- Linter/Formatter: Biome (`@biomejs/biome`)
- Validation: Zod at system boundaries
- Modular monolith layout:
  - `src/features/auth/`: Schemas (`schemas.ts`), components (`SignUpForm.tsx`, `SignInForm.tsx`, `SignOutButton.tsx`, `AuthStatusCard.tsx`)
  - Shared UI in `src/components/` (`Shell.tsx`)
  - Infrastructure in `src/db/`, `src/lib/`, `src/app/`

## Database & Schema Reality

- Migrations present in `src/db/migrations/`:
  - `0000_amused_mother_askani.sql`: Better Auth core tables (`user`, `session`, `account`, `verification`).
  - `0001_open_whizzer.sql`: Index optimization and constraints.
- Drizzle schema defined in `src/db/schema.ts` (re-exports Better Auth auth-schema). No schema alterations introduced in TD-001A.
- Database migration script: `pnpm db:migrate` (via drizzle-kit).
- Database connectivity test: `pnpm db:check`.

## Auth & Security Reality

- Better Auth handler exposed via catch-all route: `src/app/api/auth/[...all]/route.ts`.
- Server configuration: `src/lib/auth.ts` (email/password enabled, Drizzle adapter with resilient in-memory fallback proxy).
- Client configuration: `src/lib/auth-client.ts` (`createAuthClient()`).
- Client-side and server-side boundary validation via Zod schemas (`src/features/auth/schemas.ts`).
- Security headers configured in `next.config.ts`:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- Environment validation via Zod in `src/lib/env.ts`.

## Verification Reality

The following checks are verified:

- `npm run lint`: Biome linting passes with zero errors and zero warnings.
- `npm run format:check`: Biome formatting check passes cleanly.
- `npm run typecheck`: TypeScript compiler checks pass (`tsc --noEmit`).
- `npm run test`: Vitest suite passes 20/20 tests across 4 test files (`auth.test.ts`, `health.test.ts`, `env.test.ts`, `schema.test.ts`).
- `npx playwright test`: Playwright E2E suite passes 5/5 tests in Chromium (`e2e/auth.spec.ts`, `e2e/app.spec.ts`).
- `npm run build`: Next.js production build succeeds with static prerendering of `/`, `/sign-in`, `/sign-up`.

## Active Blockers & Known Issues

- None. TD-001A completed cleanly.

## Next Recommended Task

- **TD-001B (TutorProfile Domain Entity & Persistence Schema)**:
  - Implement `tutor_profile` table and schema in parallel branch.
  - Enforce one-to-one relationship with `user.id`.
