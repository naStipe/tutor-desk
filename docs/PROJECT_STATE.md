# TutorDesk Project State

## Current Milestone

**TD-000 — Project Foundation**

## Status

**Complete**

---

## Completed in TD-000

1. **Modular Monolith Repository Structure**: Established clean directory layout (`src/app/`, `src/components/`, `src/features/`, `src/db/`, `src/lib/`, `src/test/`, `docs/`).
2. **Framework & Runtime**: Next.js App Router configured with React 19, strict TypeScript, and Tailwind CSS.
3. **Database Configuration**: PostgreSQL and Drizzle ORM configured with connection pooling, migration directories, and Drizzle Kit tooling.
4. **Authentication Plumbing**: Better Auth foundation initialized with Drizzle adapter and PostgreSQL schema tables (`user`, `session`, `account`, `verification`).
5. **Environment Schema & Validation**: Zod-based runtime environment validation (`src/lib/env.ts`) ensuring all required variables are verified at startup.
6. **Environment Template**: Clean `.env.example` created with documented variables and safe placeholders.
7. **Test Suites**: Vitest configured for unit and integration testing; Playwright configured for end-to-end testing with initial foundation verification tests.
8. **CI Workflow**: GitHub Actions workflow (`.github/workflows/ci.yml`) defined for linting, typechecking, testing, and production building.
9. **Core Architecture Documentation**: Comprehensive product, MVP scope, architecture, domain model, security, and architectural decision records (ADRs) authored.

---

## Not Implemented (Intentional Scope Boundaries)

Per TD-000 specifications, no product features have been implemented:
* No student management or student profiles.
* No lesson scheduling, recurring lesson series, or calendar views.
* No homework creation, student text submissions, or grading feedback.
* No invoice generation, numbering, delivery, or reminder engines.
* No student portal views.
* No payment gateway integrations or online card processing.
* No external Google/Outlook Calendar integrations.
* No email delivery or automated notification queues.
* No business role or tutor authorization policies.

---

## Recommended Next Ticket

**TD-001 — Authentication and Tutor Ownership Foundation**

> **Notice**: Do NOT implement TD-001 in this task. Stop at TD-000.
