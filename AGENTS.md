# Agent Instructions for TutorDesk

This file provides instructions for AI coding agents working on the TutorDesk repository.

## Core Rules

1. **Inspect Before Modifying**: Always read and understand the existing code, types, and architecture before making any edits. Never guess file contents or APIs.
2. **Follow Existing Architecture**: Maintain the modular monolith pattern (`src/features/`, `src/db/`, `src/components/`, `src/lib/`). Do not introduce separate microservices, event buses, or unnecessary abstractions.
3. **Avoid Unrelated Refactors**: Keep your work strictly scoped to the assigned ticket. Do not rewrite existing working components, change library conventions, or format unrelated code.
4. **Keep Changes Small and Reviewable**: Implement changes incrementally. Focus on clean, readable TypeScript and modular components.
5. **Validate External Input**: Enforce strict boundary validation on all external inputs, HTTP request bodies, route parameters, and query parameters using Zod schemas.
6. **Preserve Multi-Tenant Isolation**: Every business entity (students, lessons, homework, invoices) belongs to a specific tutor. Enforce authorization server-side on every query and mutation. Never rely on client-side visibility for security.
7. **Never Commit Secrets**: Ensure all sensitive credentials, database keys, API secrets, and auth tokens remain in environment variables. Do not hardcode secrets or commit `.env` files.
8. **Run Relevant Checks**: After modifying code, run linting, typechecking, tests, and build verification before concluding. Never claim a check passed without executing it.
9. **Do Not Automatically Start the Next Task**: Complete only the single ticket requested. Summarize your changes and yield for review.
10. **Report Anything That Could Not Be Verified**: If any verification step or environment constraint prevents full execution, document it explicitly in the completion report.
