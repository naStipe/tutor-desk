---
name: tutordesk-ticket-implementation
description: Implement an assigned TutorDesk TD-xxx engineering ticket from repository inspection through verification and project-state handoff. Use for implementation work, not read-only reviews.
---

# TutorDesk Ticket Implementation

Read and obey [`AGENTS.md`](../../../AGENTS.md) before acting. Repository instructions and the
user's assigned ticket define scope; never begin the next ticket automatically.

1. Read [`docs/PROJECT_STATE.md`](../../../docs/PROJECT_STATE.md), the assigned ticket, and relevant
   product, architecture, domain, security, and decision documents.
2. Inspect Git status, then inspect the relevant implementation, configuration, migrations,
   dependencies, and tests. Treat the repository as truth and independently verify prior claims.
3. State the ticket's goal, scope, non-goals, acceptance criteria, and material risks from the
   evidence you found.
4. Implement only the assigned ticket using the smallest correct change. Preserve the modular
   monolith and avoid unrelated refactors or speculative features.
5. Add or update meaningful tests. Perform manual verification where it materially improves
   confidence.
6. Run every relevant repository check. Do not claim an unexecuted or blocked check passed.
7. Inspect the complete diff, update affected documentation, then update `PROJECT_STATE.md` from the
   actual implementation and verification results.
8. Inspect the final Git status and diff. Report implemented changes, important files, decisions,
   verification, and unresolved issues. Recommend exactly one next task, then stop.
