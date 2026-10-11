# UI and data audit, 2026-10-11

Scope: desktop and mobile (375x812) pass over the running app (dev server) plus a code read of the data paths.

## Limits of this audit

- Only public pages were browsed: `/`, `/sign-in`, `/sign-up`, `/forgot-password`, the 404 page. Everything under
  `/dashboard` and `/portal` redirects to sign-in, and entering a password is not something the audit may do.
  Dashboard findings below come from reading code, **not from looking at the screen**. They are marked `[code]`.
- Nothing was run against the hosted database. The TD-022 migration is not applied, so packages and auto-complete are
  untested end to end.

## Verified in the browser

| # | Area | Finding | Mobile | Desktop | Severity |
|---|------|---------|--------|---------|----------|
| 1 | All pages | Every page has the same `<title>` "TutorDesk" (only the root layout exports `metadata`). Tabs, history and screen-reader page announcements cannot tell pages apart. | yes | yes | medium |
| 2 | 404 | Default Next.js 404 (white-label "404: This page could not be found."), not branded, no link back. No `not-found.tsx` exists. | yes | yes | low |
| 3 | Sign-in / sign-up | Primary buttons are 36px high and "Continue with Google" 38px, below the 44px target the other forms use. Theme toggle 40x40. | yes | no | medium |
| 4 | Sign-in / sign-up | Text links "Forgot password?" (105x16), "Create one" (63x16), "Sign in" (39x16) and the home "Create a free account" link (166x20) have tap areas far under 44px. | yes | no | medium |
| 5 | Home | One `<img>` without `alt` text (logo area). | yes | yes | low |
| 6 | Sign-up | Password field uses `autocomplete="new-password"` correctly; no horizontal overflow at 375px on any public page. | ok | ok | none |

## Code-read findings `[code]`

### Data

| # | Finding | Where | Severity |
|---|---------|-------|----------|
| D1 | **Weekly recurring lessons drift by an hour across daylight-saving changes.** The series stores `dayOfWeek` and `startMinutes` from the *server's* local clock (`start.getDay()`, `start.getHours()`) and regenerates with `new Date(y, m, d, h, min)` in server time (UTC on Vercel). A lesson created at 18:00 Berlin time in summer stays at the same UTC instant all year, so in a DST timezone it shows 17:00 or 19:00 after the clock change. Fix: store the tutor timezone on the series and generate in that zone. | `lessons/actions.ts:141`, `lessons/recurrence.ts` | high |
| D2 | `updateLesson` never sets `paid_at` when the edit form flips payment to paid (create does). Lessons paid through the edit form have `payment_status = paid` and `paid_at = null`. | `lessons/data.ts` `updateLesson` | medium |
| D3 | Raw database text is returned to the UI from several actions: `createLessonAction`, `updateLessonAction`, all homework actions, auth actions, invite actions, student create/update (`error.message`). Can expose constraint names and column details. TD-015 fixed only the move action. | `*/actions.ts` | medium |
| D4 | Lesson calendar assigns lessons to day columns with the **browser** time zone (`isSameDay`) while the agenda and "now" use the **tutor** time zone. A tutor travelling, or a browser in another zone, sees a lesson in a different column than the agenda. Also noted in TD-016. | `LessonCalendar.tsx` | medium |
| D5 | Dashboard, `TimeSlotGrid`, `NextLessonCard`, `LessonForm` min dates and the schedule defaults still read the browser clock for "today". | several | low |
| D6 | The week/month fetch ranges on the server schedule pages use Monday weeks while `MonthCalendar` can start on Sunday, so leading days of a month can show no lesson count. (TD-016 known issue.) | `schedule/page.tsx`, `dashboard/data.ts` | low |
| D7 | Only `RUB` and `EUR` are allowed as currencies (DB check constraint and `CURRENCIES`). A tutor charging in USD, GBP, UAH, etc. cannot record a price. | `rates/schemas.ts`, migrations | medium |
| D8 | Lessons list has `pageSize` in the data layer but no control; with more than 50 lessons the tutor can only page. | `LessonsListView.tsx` | low |
| D9 | **TD-022 follow-ups.** (a) A package bought *after* lessons were completed does not pay them. (b) A student's portal view shows the stored lesson status, which only catches up when the tutor opens the dashboard. (c) No-shows consume a credit. (d) Packages never expire. (e) Credits are only synced on app actions, so a lesson written outside the app is not covered until the next sync. | `packages/`, SQL | info |
| D10 | `.env`-dependent features (email, cron) default off, but `db:types:check` will fail until both pending migrations are applied and `pnpm run db:types` is rerun. | repo | info |

### UI

| # | Finding | Mobile | Desktop | Severity |
|---|---------|--------|---------|----------|
| U1 | `ConfirmDeleteForm` (delete student) still uses `window.confirm`, unlike every other destructive action (`ConfirmModal`). Native dialogs break the bottom-sheet pattern and cannot be styled or tested. | yes | yes | medium |
| U2 | `ConfirmModal` always styles the confirm button as `danger` (red), including the non-destructive "Email payment reminder". | yes | yes | low |
| U3 | Form field and card borders are 1.17-1.40:1 against the surface, below the 3:1 non-text contrast guideline in both themes. Known and deferred in TD-018, needs a design decision. | yes | yes | medium |
| U5 | The payer checkbox and the native checkbox hit area: the row is 44px tall, but the input itself is 16px. Tapping the label works, tapping next to it does not. | yes | no | low |
| U6 | The lesson calendar blocks are drag targets only for mouse; on touch the only reschedule path is the Edit form's date field. Works, but needs more taps than a drag. | yes | no | low |
| U7 | `e2e/app.spec.ts` is stale (expects heading "Tutor sign in"), and `e2e/auth.spec.ts` has never been executed because Playwright's browser download failed. No end-to-end check protects sign-in. | n/a | n/a | medium |

## Suggested order

1. Apply both pending migrations to a staging copy, run the app, and walk the package flow (D9) and auto-complete.
2. Fix D1 (DST drift) and D2 (`paid_at`); both silently corrupt data.
3. Replace raw error text (D3) and `window.confirm` (U1).
4. Add per-page `metadata` titles and a branded `not-found.tsx` (findings 1, 2).
5. Raise the small tap targets on the auth pages (findings 3, 4).
6. Decide on more currencies (D7) and the border contrast (U3).
7. Re-run this audit **with a signed-in test tutor** on a staging project so the dashboard, lessons, billing and portal pages are actually looked at on both viewports.
