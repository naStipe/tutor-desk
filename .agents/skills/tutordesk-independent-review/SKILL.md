---
name: tutordesk-independent-review
description: Perform a read-only independent review of another agent's TutorDesk ticket changes and produce prioritized findings plus a commit or merge verdict.
---

# TutorDesk Independent Review

Initial review mode is read-only. Do not modify files unless the user explicitly requests fixes in a
subsequent task. Read and obey [`AGENTS.md`](../../../AGENTS.md), then:

1. Read [`docs/PROJECT_STATE.md`](../../../docs/PROJECT_STATE.md), the assigned ticket and acceptance
   criteria, and all relevant documentation.
2. Inspect Git status, the full relevant diff (including staged changes), implementation,
   configuration, migrations, dependencies, and tests.
3. Independently reproduce important claims and run relevant checks where possible.
4. Review correctness, security, multi-tenant isolation and IDOR risk, architecture,
   maintainability, error handling, type safety, database behavior, dependencies, tests, build
   behavior, documentation accuracy, and Git hygiene.
5. Report only evidence-backed findings, ranked `CRITICAL`, `HIGH`, `MEDIUM`, or `LOW`. Each finding
   must include its location, problem, impact, and recommended fix. Do not invent findings to fill
   severity categories.
6. End with exactly one concrete verdict: `READY TO COMMIT`, `CHANGES REQUIRED`, `READY TO MERGE`, or
   `NOT READY TO MERGE`. Do not implement the next ticket.
