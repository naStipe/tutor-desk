# TutorDesk

TutorDesk is a dedicated business management SaaS built specifically for independent private tutors. It consolidates the operational aspects of running a solo tutoring practice—including student records, lesson scheduling, plain-text homework assignments, and invoice generation—into a single, unified workspace.

TutorDesk is **NOT** a marketplace, an institutional school management platform, or a video-conferencing tool.

---

## Architecture & Technology Stack

TutorDesk is architected as a **TypeScript Modular Monolith**:

* **Framework**: Next.js App Router (React 19)
* **Language**: TypeScript (strict mode)
* **Database**: PostgreSQL
* **ORM & Migrations**: Drizzle ORM (`drizzle-orm`, `drizzle-kit`)
* **Authentication**: Better Auth with PostgreSQL adapter
* **Validation**: Zod
* **Styling**: Tailwind CSS v4
* **Package Manager**: pnpm (Corepack enabled)
* **Testing**: Vitest (unit/integration), Playwright (E2E)
* **Continuous Integration**: GitHub Actions

---

## Development Prerequisites

* **Node.js**: v22+
* **Package Manager**: `pnpm` v10+ (enable via `corepack enable`)
* **Database**: PostgreSQL 15+ (local instance or cloud-hosted database)

---

## Setup Instructions

### 1. Clone & Install Dependencies

```bash
# Enable pnpm via Corepack if not already installed
corepack enable

# Install project dependencies
pnpm install
```

### 2. Environment Setup

Copy the example environment configuration:

```bash
cp .env.example .env.local
```

Configure your variables in `.env.local`:
* `DATABASE_URL`: Your PostgreSQL connection string.
* `BETTER_AUTH_SECRET`: A secure random secret (min. 32 characters).
* `NEXT_PUBLIC_APP_URL`: Base application URL (`http://localhost:3000` for local development).

### 3. Database Setup & Migrations

TutorDesk uses Drizzle Kit for schema management.

```bash
# Generate SQL migrations from TypeScript schema definitions
pnpm run db:generate

# Apply migrations to the database
pnpm run db:migrate

# (Optional) Open Drizzle Studio to inspect database records
pnpm run db:studio
```

---

## Available Commands

| Command | Description |
| :--- | :--- |
| `pnpm run dev` | Starts the Next.js development server on port 3000 |
| `pnpm run build` | Compiles the production build |
| `pnpm run start` | Runs the compiled production server |
| `pnpm run typecheck` | Validates TypeScript types across the project |
| `pnpm run lint` | Runs the project linter and typecheck |
| `pnpm run test` | Executes unit and integration test suites with Vitest |
| `pnpm run test:watch` | Runs Vitest in interactive watch mode |
| `pnpm run test:e2e` | Executes Playwright end-to-end browser tests |
| `pnpm run db:generate` | Generates new migration SQL files via Drizzle Kit |
| `pnpm run db:migrate` | Runs pending database migrations |
| `pnpm run db:push` | Pushes schema changes directly (dev prototyping) |
| `pnpm run db:studio` | Launches Drizzle Studio GUI for visual database management |

---

## Repository Structure

```
tutordesk/
├── src/
│   ├── app/                 # Next.js App Router routes, pages, and API handlers
│   │   ├── api/
│   │   │   ├── auth/        # Better Auth catch-all route handler
│   │   │   └── health/      # Application health check endpoint
│   │   ├── layout.tsx       # Root HTML shell and metadata
│   │   ├── page.tsx         # TutorDesk application landing/shell
│   │   └── globals.css      # Tailwind CSS entrypoint
│   ├── components/          # Reusable UI components
│   ├── features/            # Feature modules (auth, students, lessons, etc.)
│   ├── db/
│   │   ├── schema/          # Drizzle schema definitions (auth, etc.)
│   │   ├── migrations/      # Versioned migration SQL files
│   │   └── index.ts         # Connection pool and Drizzle DB client
│   ├── lib/
│   │   ├── env.ts           # Strict Zod environment variable validation
│   │   ├── auth.ts          # Server-side Better Auth initialization
│   │   └── auth-client.ts   # Client-side Better Auth React client
│   └── test/                # Unit and integration test suites (Vitest)
├── docs/
│   ├── PRODUCT.md           # Product positioning and problem statement
│   ├── MVP.md               # V1 release scope and non-goals
│   ├── ARCHITECTURE.md      # System architecture and design principles
│   ├── DOMAIN_MODEL.md      # Domain entity definitions and relationship rules
│   ├── SECURITY.md          # Security invariants and multi-tenant policies
│   ├── DECISIONS.md         # Architecture Decision Records (ADRs)
│   └── PROJECT_STATE.md     # Current milestone status and roadmap
├── .github/
│   └── workflows/
│       └── ci.yml           # GitHub Actions automated verification pipeline
├── AGENTS.md                # Operating guidelines for AI coding agents
├── README.md                # Project documentation and developer guide
├── .env.example             # Documented environment variable template
├── drizzle.config.ts        # Drizzle Kit migration configuration
├── next.config.ts           # Next.js framework configuration
├── package.json             # Scripts and dependencies
├── playwright.config.ts     # Playwright E2E configuration
├── pnpm-lock.yaml           # Locked dependency graph
├── tsconfig.json            # Strict TypeScript configuration
└── vitest.config.ts         # Vitest test runner configuration
```

---

## Current Status & Next Steps

* **Current Milestone**: `TD-000 — Bootstrap TutorDesk Project Foundation` (Complete)
* **Recommended Next Milestone**: `TD-001 — Authentication and Tutor Ownership Foundation`
