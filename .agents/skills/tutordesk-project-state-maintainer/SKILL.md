---
name: tutordesk-project-state-maintainer
description: Reconcile TutorDesk documentation and PROJECT_STATE.md with the repository's actual implementation and verification after a material change.
---

# TutorDesk Project State Maintainer

Read and obey [`AGENTS.md`](../../../AGENTS.md). Retrieve all mutable state from the repository; do
not hard-code current tickets, features, versions, migrations, bugs, or next tasks in this skill.

Maintain these boundaries:

- `AGENTS.md`: operating rules.
- `docs/PROJECT_STATE.md`: current verified reality.
- `docs/DECISIONS.md`: architectural and product decision history.
- `docs/MVP.md`: intended V1 scope.
- `docs/ARCHITECTURE.md`: current system design.
- `docs/DOMAIN_MODEL.md`: domain concepts.
- `docs/SECURITY.md`: security design and invariants.

Workflow:

1. Inspect actual repository changes, Git status, and verification evidence.
2. Read the existing `PROJECT_STATE.md` and remove stale, planned-as-implemented, or unverified
   claims.
3. Update milestone/status, implemented and not-implemented boundaries, database and authentication
   state, verification state, and real known issues when affected.
4. Set exactly one next task based on the governing ticket or user direction.
5. Update `DECISIONS.md` only when a decision changed. Preserve old entries and mark superseded
   history rather than erasing it. Update other documents only where the implementation made them
   inaccurate.
6. Inspect the documentation diff against the code and verification results before reporting.
