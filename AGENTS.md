# TutorDesk Agent Operating Contract

These repository-wide rules apply to every human or coding agent working on TutorDesk. The
repository is the source of truth; independently verify important claims left by previous agents.

## Before Work

1. Read this file and `docs/PROJECT_STATE.md`.
2. Read the assigned ticket and relevant documentation.
3. Inspect `git status`, the relevant implementation, configuration, and tests.
4. For architecture-sensitive work, also read `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`,
   `docs/DOMAIN_MODEL.md`, and `docs/SECURITY.md`.
5. For product-scope work, also read `docs/PRODUCT.md` and `docs/MVP.md`.

## Scope and Architecture

- Implement only the assigned ticket. Preserve existing behavior unless the ticket changes it.
- Prefer the smallest correct, reviewable change. Avoid unrelated refactors and speculative
  features. Report unrelated issues unless they directly block the ticket.
- Do not automatically begin a later milestone. Stop after completing the assigned task.
- TutorDesk is a TypeScript modular monolith. Keep feature code in `src/features/` and shared
  infrastructure in `src/app/`, `src/components/`, `src/db/`, and `src/lib/`.
- Do not introduce microservices, separate API applications, Redis, distributed queues, event
  buses, Kubernetes, GraphQL, generic repository layers, dependency-injection frameworks, or
  premature provider abstractions without a concrete approved requirement.

## Security and Data

- Validate external inputs at server boundaries with Zod.
- TutorDesk is intended to be multi-tenant, but tenant ownership and authorization are not present
  until implemented by a later ticket. Every future tutor-owned resource must enforce ownership
  server-side. Never trust frontend filtering, hidden controls, or client-provided owner IDs.
- Explicitly assess IDOR and cross-tenant access for features that touch tutor-owned resources.
- Before a schema change, inspect schemas and migrations, understand current data assumptions, use
  a migration, consider backwards compatibility, and obtain approval for destructive changes.
- Never commit `.env` files, passwords, tokens, private keys, or credential-bearing production URLs.
  Keep `.env.example` safe and current, and never log secrets.

## Dependencies

Before adding a dependency, check whether existing code suffices, then assess maintenance,
compatibility, peer dependencies, duplication, and security advisories. Do not use force-install or
unsafe automatic audit fixes to silence conflicts.

## Verification and Git

- Never claim a change works by inspection alone. Run the relevant format, lint, typecheck, tests,
  E2E, build, migration, manual route/API, and dependency/security checks.
- If a check cannot run, report the command, reason, and what remains unverified.
- Before completion, inspect `git status`, `git diff`, and `git diff --cached` when anything is staged.
- Never commit, push, force-reset, rewrite history, or delete unrelated work unless explicitly asked.

## Documentation and Project State

- Documentation is part of implementation. Keep setup, dependencies, environment variables,
  architecture, product scope, domain behavior, and security assumptions consistent with code.
- `AGENTS.md` defines how contributors operate.
- `docs/PROJECT_STATE.md` records current repository reality.
- `docs/DECISIONS.md` preserves important decision history. When a decision changes, retain the old
  entry, mark it superseded where appropriate, and record its replacement and rationale.
- `docs/MVP.md` defines intended V1 scope; `docs/ARCHITECTURE.md` describes the current design;
  `docs/DOMAIN_MODEL.md` describes domain concepts; `docs/SECURITY.md` defines security invariants.
- After every material implementation task, re-read `docs/PROJECT_STATE.md`, compare it with the
  actual diff and verification, remove stale or unverified claims, update milestone/status,
  database/auth/verification state and real known issues, set exactly one next task, then inspect the
  documentation diff.
- Repository-local workflows live under `.agents/skills/`. Read and follow the relevant skill when
  a task matches its description; the root contract remains authoritative.

## Completion Report

End each implementation task with implemented changes, important files changed, design decisions,
verification actually performed, unresolved issues, and exactly one recommended next task. Then stop.
