# TutorDesk Project State

## Current Milestone

- Milestone: **TD-004 — Homework, interactive lesson calendar, and visual redesign**
- Status: **Implemented; independent review recommended**
- Branch: `main`
- Last updated: 2026-09-13

## Current Reality

TutorDesk is a Next.js App Router modular monolith using hosted Supabase Auth and PostgreSQL. Tutors
sign in, manage a student roster (TD-002), schedule lessons (TD-003), and now assign homework with a
submission/feedback lifecycle. `/dashboard/lessons` was rebuilt from a static agenda list into an
interactive day/week calendar: click an empty slot to schedule a lesson, drag an existing lesson to
reschedule it (day and/or time), click a lesson to open its full detail/edit page. The app received a
visual pass (icons, avatars, stat cards, consistent nav accents) on top of the existing calm/slate
Tailwind design language established in TD-002 — no new design system, no new dependencies.

The repository is linked to hosted project `cmlvtnjoynffrznyelym` (Supabase name: TutorHub).

## Database and authorization

- `public.tutor_profile` (TD-001S), `public.student` (TD-002), and `public.lesson` (TD-003) are
  unchanged.
- TD-004 adds `public.homework`: `id`, `tutor_id` (references `public.tutor_profile(user_id)`),
  `student_id` (references `public.student(id)`), `lesson_id` (optional, references
  `public.lesson(id)` `ON DELETE SET NULL`), `title`, `description`, `due_date`, `status` (text,
  check-constrained to `assigned`/`submitted`/`reviewed`, defaults to `assigned`),
  `submission_text`, `submitted_at`, `feedback_text`, `feedback_at`, `created_at`, `updated_at`.
  Migration: `supabase/migrations/20260913150814_create_homework.sql`, applied via `supabase db
  push`.
- RLS mirrors `lesson`'s pattern: select/insert/update scoped to `tutor_id = auth.uid()`, with
  insert/update additionally requiring (correlated subqueries) that `student_id` — and, when
  present, `lesson_id` — belong to that same tutor. No ordinary delete policy.
- `public.lesson` gained two data-access helpers used only by the calendar/homework UI —
  `updateLessonTime` (time-only update, for drag-to-reschedule) and `listLessonsForSelect` (for the
  homework form's "linked lesson" picker) — no schema change.
- Generated hosted types are committed at `src/lib/supabase/database.types.ts`; `db:types:check`
  passes.
- Hosted RLS/ownership behavior for `homework` (own-row create/submit, cross-tenant student-linking
  rejection, cross-tenant read/insert/update denial) is verified by
  `supabase/tests/homework_rls.sql`, run via `pnpm run db:test:hosted:homework`.

## Authentication

Unchanged from TD-001S/Google OAuth/TD-002/TD-003.

## UI

- Nav: "Homework" is now a real link (promoted from "coming later"); "Calendar" was removed from
  "coming later" since the interactive calendar *is* the Lessons page now. Only "Invoices" remains
  as a disabled placeholder.
- **Interactive calendar** (`/dashboard/lessons`, `LessonCalendar` client component): a day/week
  time-grid (7 AM–9 PM, 15-minute snap). Click an empty slot to open a quick-create popover
  (student + start/end time); click an existing lesson to open its detail page; drag a lesson
  (pointer-down, move, pointer-up) to reschedule it to a new day and/or time, with an optimistic
  local update reconciled by `router.refresh()` and reverted on server error. Built on native Pointer
  Events, not a drag-and-drop library — no new dependency. Today's column is highlighted with a live
  time indicator line.
- `/dashboard/homework`: flat list (avatar, title, due date, status badge) with an empty state;
  `/dashboard/homework/new`: create form (student, optional linked lesson, optional due date,
  optional description); `/dashboard/homework/[id]`: edit form plus a submission section and (once
  status is not `assigned`) a feedback section, each its own small form. Status moves
  assigned → submitted → reviewed as those forms are used.
- Dashboard: third stat card "Homework to review" (count of `status = 'submitted'`); quick actions
  gained "Assign homework".
- Visual redesign: new `Avatar` (deterministic color/initials), `Badge`/`StatCard` primitives, a hand
  rolled `icons.tsx` (no icon-library dependency) used in the sidebar nav (active-item left-border
  accent) and stat cards, and a `PageHeader` `avatar` slot used on student/lesson detail pages. Main
  content width widened slightly (`max-w-6xl`) to give the calendar room.
- Manual browser verification covered: create lesson via calendar click, drag a lesson to a new
  day/time (persisted and confirmed via direct DB read), full homework lifecycle
  (assign → submit → give feedback), dashboard counts updating correctly, and mobile viewport checks
  (day view is clean at 375px; week view is functional via horizontal scroll but visually tight — see
  Known Issues).

## Not Implemented

- Recurring lesson series, lesson pricing/subject fields, invoices, student portal, invitations,
  payments.
- A genuine student-authored homework submission (see `docs/DOMAIN_MODEL.md` — today the tutor
  records submission text on the student's behalf, since no student portal/identity exists yet).
- Student phone/parent contact fields, default rate, tags, billing info, custom fields.
- Archived-student management UI, search/pagination infrastructure, password reset, account
  settings, MFA UI, organizations, multiple tutors.
- A dedicated mobile-optimized week calendar layout (day view is the recommended mobile experience;
  week view works but is visually cramped below ~640px — see Known Issues).

## Verification State

- `pnpm run format:check`, `lint`, `typecheck`, `test`: passed (6 unit test files, 21 tests,
  including new `src/test/homework-schemas.test.ts`).
- `pnpm run build`: **passed**, with the dev server stopped — verified independently by both the
  owner and this session (both full runs printed the complete route manifest, 16/16 routes, no
  errors). Two earlier attempts in this exchange failed for reasons unrelated to the application
  code: (1) `output: "standalone"` in `next.config.ts` tried to symlink `node_modules` into
  `.next/standalone`, which requires a Windows permission not granted by default (`EPERM`) — fixed by
  removing `output: "standalone"` (it was undocumented scaffolding from TD-000, not a recorded
  decision, and only matters for self-hosting the standalone server output; unnecessary if deploying
  to a platform with its own build pipeline); (2) two `pnpm run build` invocations racing on the same
  `.next` directory at the same time produced a transient `ENOENT` on `pages-manifest.json` —
  resolved by not running builds concurrently, not a code fix.
- Hosted migration: dry-run reviewed, then applied with `supabase db push --linked`; `list_tables`
  confirms `public.homework` with RLS enabled and the expected FK/check constraints.
- Hosted RLS/ownership SQL test (`supabase/tests/homework_rls.sql`, transaction-rolled-back): passed
  — own-tutor create/submit succeeded; a homework row referencing another tutor's student was
  rejected by the insert policy even with a matching `tutor_id`; cross-tenant read/insert/update were
  denied.
- Generated-type drift check (`pnpm run db:types:check`): passed.
- Manual browser walkthrough against the hosted dev project (real signed-in account): scheduled a
  lesson by clicking an empty calendar slot; dragged that lesson to a different day/time (persistence
  confirmed via a direct read of `public.lesson`, not just the optimistic UI); assigned homework,
  recorded a submission, left feedback, watched status move assigned → submitted → reviewed and the
  dashboard's "Homework to review" count update accordingly; checked the calendar and dashboard on a
  375px mobile viewport.
- Two genuine bugs were found and fixed during this walkthrough:
  1. **Drag-to-reschedule not registering with the browser-automation tool's synthetic drag.**
     Root-caused by dispatching real `PointerEvent`s at the DOM level, which worked correctly and
     persisted to the database — confirming the app's drag logic is correct and the earlier failure
     was a limitation of the automation tool's simulated mouse drag, not an app bug.
  2. **A `<select>` whose current option is `disabled` is excluded from form submission entirely**
     (a standard, easy-to-miss HTML behavior), so `FormData.get(...)` returned `null` there instead
     of `""`, bypassing the Zod schema's custom "Choose a student" message and surfacing a raw
     "Invalid input: expected string, received null" error when a tutor submitted the lesson/homework
     "new" form without touching the student dropdown (only ever exercised in earlier testing because
     a student was always explicitly selected first). Fixed in
     `src/features/lessons/components/LessonForm.tsx` and
     `src/features/homework/components/HomeworkForm.tsx` by defaulting the select to the first real
     student instead of a disabled placeholder, and defensively in both `actions.ts` `fields()`
     helpers by coalescing `formData.get("studentId") ?? ""` so any future recurrence still surfaces
     the friendly validation message.
- Playwright E2E: not run (same pre-existing gap noted in TD-002/TD-003 — no Chromium binary
  installed; `e2e/auth.spec.ts` remains stale and unrelated to this task).
- `pnpm audit`: not re-run; no new dependencies were added in this task.

## Known Issues

- Supabase's advisor still reports leaked-password protection disabled for hosted Auth
  (pre-existing, unrelated to TD-004).
- `e2e/auth.spec.ts` is stale relative to the current `AuthForm` component (pre-existing).
- The week calendar view is visually cramped on narrow (≤375px) mobile viewports — day/time labels
  truncate. It remains functional (horizontal scroll, drag/click still work), and day view is clean
  at that width; a dedicated mobile week layout is future work.
- Homework's `submission_text`/`feedback_text` are both tutor-authored (see Not Implemented); this is
  correct for the current no-portal state but should be revisited when a student identity exists.
- The dashboard's time-based greeting and the lesson calendar's "now" indicator both evaluate in the
  server/browser's own time zone rather than an explicit tutor timezone setting (pre-existing,
  documented simplification from TD-002/TD-003, not a regression here).

## Next Recommended Task

**Recurring lesson series (`LessonSeries`): a rule (e.g. "every Tuesday at 17:00 for 60 minutes")
that generates concrete `lesson` rows, with the ability to edit or cancel a single occurrence versus
the whole series, reusing the calendar UI and ownership/RLS patterns established in TD-003/TD-004.**
