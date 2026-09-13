# Handoff: TutorDesk — "Today" Dashboard (dark + light)

## Overview
The post-login home screen for TutorDesk, the business-management app for independent
private tutors (`naStipe/tutor-desk`, branch `main`). It answers one question in a glance:
*what do I do in the next hour?* — next lesson with a one-click join, today's schedule,
homework waiting on review, unbilled money, and the week's load.

Two complete theme variants are included in one file, side by side on a pan/zoom canvas:
- **1a — Dark** (the default/primary theme)
- **1b — Light** (same system, same layout, light surfaces)

Scope note, per `docs/PRODUCT.md` / `docs/MVP.md`: TutorDesk does **not** host video.
The "Join Google Meet" action opens the tutor-supplied meeting URL. Invoices are shown
in the nav as `SOON` because billing is post-V1-dashboard work.

## About the Design Files
`TutorDesk Today.dc.html` in this bundle is a **design reference written in HTML** — a
prototype that shows intended look, hierarchy and interaction states. It is **not**
production code to copy.

The task is to **recreate this design inside the existing tutor-desk codebase**: Next.js
App Router + React + Tailwind CSS v4, with the existing primitives in `src/components/`
(`AppShell`, `StatCard`, `Badge`, `Button`, `PageHeader`, `Avatar`, `icons.tsx`). The design
replaces the current blue/slate Tailwind default look — expect to update
`src/app/globals.css` theme variables and the tone maps in `Badge.tsx` / `StatCard.tsx` /
`Button.tsx` rather than to add a parallel styling system.

Two structural notes for the port:
1. The HTML file renders both themes side by side purely for review. In the app this is
   **one screen with a theme**, driven by `class="dark"` on `<html>` (or Tailwind v4
   `@custom-variant dark`), not two components.
2. Hover/active styling in the HTML uses inline `style-hover` attributes. In the app use
   normal Tailwind `hover:` / `dark:` utilities.

## Fidelity
**High-fidelity.** Colors, type sizes, weights, letter-spacing, radii, paddings and gaps
below are final and exact. Recreate pixel-accurately using Tailwind utilities, with the
token table under *Design Tokens* mapped into the Tailwind theme.

The reference is laid out at a fixed 1380px content width. The real screen must be
**responsive** — see *Responsive behavior*.

---

## Screens / Views

### Screen: Today (route `/dashboard`)

**Purpose:** the tutor's operational home. Decide and act within ~5 seconds: join the next
lesson, review a submission, write a missing lesson plan, see what's unbilled.

**Layout — page frame**
- Two-column shell: `grid-template-columns: 232px 1fr`.
- Left column = the persistent app rail (`AppShell` sidebar; today 256px/`w-64` — narrow it to 232px).
- Right column = main content, padding `30px 34px 36px`, `display:flex; flex-direction:column; gap:26px`.
- Page background: dark `#0A0B0B` / light `#F2F3F0`. Rail background: dark `#0C0E0D` / light `#FFFFFF`.
- Rail right border: dark `1px solid #1E2220` / light `1px solid #E2E4DF`.
- In the reference the whole app is rounded `20px` and drop-shadowed; that is presentation
  framing only — **do not** round the real app shell.

**Main content stack, top to bottom**
1. Greeting header row
2. Hero row — `grid-template-columns: 1.75fr 1fr`, `gap:18px`
3. Lower row — `grid-template-columns: 1.6fr 1fr`, `gap:18px`, `align-items:start`

---

#### 1. Sidebar rail (`AppShell`)
- Padding `26px 18px`; `display:flex; flex-direction:column; gap:34px`.
- **Brand lockup** (padding `0 6px`, `gap:10px`): 28×28 square, `border-radius:9px`, letter
  "T" 15px/700 — dark: `#4CF0B3` bg with `#05100C` letter; light: `#0B0D0C` bg with
  `#4CF0B3` letter. Wordmark "tutordesk" 17px/700, `letter-spacing:-.02em`; the "desk"
  half is muted (dark `#7A8280`, light `#8C938F`). Replaces the current
  `blue-600 T + "TutorDesk"` brand.
- **Nav items** (`gap:4px` between): each `padding:10px 12px`, `border-radius:11px`, 14px text.
  - Active (`Today`): dark `bg #161A18`, `border 1px solid #26302C`, weight 500, plus a
    6px accent dot (`#4CF0B3`) right-aligned. Light: `bg #F0F2EF`, `border 1px solid #DCE5E0`,
    dot `#00A87A`. **Note:** the current `AppShell` marks active state with a
    `border-l-2 border-blue-600 bg-blue-50` — drop the left border; the new system uses a
    filled pill plus the dot.
  - Idle: dark text `#8A918E` on transparent, hover `bg #131615` + text `#F1F3F1`.
    Light: text `#6B7270`, hover `bg #F3F4F1` + text `#0B0D0C`.
  - Order: Today (active), Students, Lessons, Homework. Homework carries a count pill —
    mono 11px/500, `border-radius:20px`, `padding:1px 7px`; dark `bg #B08CFF`/text `#140A2B`,
    light `bg #5B2EE0`/text `#FFFFFF`.
- **"Coming later" group**: mono 10px uppercase label, `letter-spacing:.12em`, dark `#4A514E`
  / light `#A2A8A5`, `padding:0 12px 6px`. One disabled row "Invoices" (dark text `#454B49`,
  light `#A2A8A5`) with a `SOON` pill — mono 10px, `border-radius:20px`, `padding:2px 7px`,
  dark `bg #161918` + `border 1px solid #232725`, light `bg #F7F8F6` + `border 1px solid #E2E4DF`.
- **Footer** (pushed down with `margin-top:auto`): `border-top` (dark `#1E2220` / light
  `#E2E4DF`), `padding-top:16px`, `gap:10px`. 30px circular avatar with initials (12px/500;
  dark `bg #1F2523`, `border 1px solid #2C3330`, text `#C9D0CD`; light `bg #F0F2EF`,
  `border 1px solid #E2E4DF`, text `#4A514E`), then name 13px/500 and email in mono 10px
  (dark `#5F6664` / light `#8C938F`, truncated with ellipsis). Keep the existing
  `signOutAction` sign-out control; style it as an idle nav row.

#### 2. Greeting header
- Row: `display:flex; align-items:flex-end; justify-content:space-between; gap:24px`.
- Eyebrow: mono 11px uppercase, `letter-spacing:.14em`, dark `#6C7471` / light `#6B7270` —
  content `"Sunday · 13 September"` (format: weekday · D Month, tutor's timezone).
- Headline: 40px/700, `letter-spacing:-.035em`, `line-height:1`, `margin-top:8px` —
  `"Good afternoon, Maya."` (time-of-day greeting + tutor first name + period).
- Right cluster (`gap:10px`):
  - Search pill: width 190px, `padding:10px 14px`, `border-radius:11px`, 13px text; a mono
    `/` hint glyph then "Search students". Dark: `bg #101312`, `border 1px solid #232725`,
    text `#5F6664`. Light: `bg #FFFFFF`, `border 1px solid #E2E4DF`, text `#8C938F`.
  - Primary button "+ New lesson": `padding:11px 18px`, `border-radius:11px`, 14px/500.
    Dark: `bg #4CF0B3`, text `#05100C`; hover `translateY(-2px)` + `brightness(1.08)`,
    `transition: transform .15s ease, filter .15s ease`.
    Light: `bg #0B0D0C`, text `#4CF0B3`; hover `translateY(-2px)`.
    → this is the new `Button` `primary` variant; retire `bg-blue-600`.

#### 3. Hero — "Next lesson" card (left, 1.75fr)
- Surface: dark `bg #121514`, `border 1px solid #1F2422`; light `bg #FFFFFF`,
  `border 1px solid #E2E4DF`. `border-radius:18px`, `padding:26px 28px`,
  `display:flex; flex-direction:column; gap:22px`, `position:relative; overflow:hidden`.
  Hover: border → dark `#2F3A36` / light `#BFD9CE` (`transition: border-color .2s ease`).
- Decorative accent bleed: absolutely positioned 220×220 circle, `right:-70px; top:-70px`,
  `background #4CF0B3`, opacity `.07` dark / `.18` light. All content above it sits on
  `position:relative`.
- Eyebrow row (`gap:12px`): "NEXT LESSON" mono 11px uppercase `letter-spacing:.14em`
  (dark `#4CF0B3` / light `#00875F`), then the countdown "in 42 min" in mono 11px
  (dark `#8A918E` / light `#6B7270`) preceded by a 7px pulsing dot
  (dark `#4CF0B3` / light `#00A87A`).
- Identity block (`display:flex; align-items:flex-end; gap:20px`):
  - 62×62 avatar, `border-radius:16px`, initials 20px/500. Dark `bg #1C2120`,
    `border 1px solid #2A302E`, text `#DDE3E0`; light `bg #F0F2EF`,
    `border 1px solid #E2E4DF`, text `#3A403D`.
  - Student name **44px/700**, `letter-spacing:-.04em`, `line-height:1` — "Sofia Ramos".
    This is the single biggest element on the page; the hierarchy depends on it.
  - Meta chips row, `margin-top:12px`, `gap:8px`, `flex-wrap:wrap`. Each: mono 11px,
    `border-radius:7px`, `padding:4px 9px`; dark `bg #191D1C`, `border 1px solid #262B29`,
    text `#B9C0BD`; light `bg #F5F6F3`, `border 1px solid #E2E4DF`, text `#3A403D`.
    Content: `17:00 — 18:00` · `Maths · A-level` · `£45 / hr`.
- Action row (`gap:10px`), all `border-radius:11px`, 14px:
  - "Join Google Meet" — primary fill (same colors as "+ New lesson"), `padding:12px 20px`,
    weight 500, and the `tdRing` attention pulse (see *Interactions*). Opens `lesson.meetingUrl`
    in a new tab; render disabled with tooltip "No meeting link on this lesson" when absent.
  - "Open lesson plan" — secondary: `padding:12px 18px`, dark `border 1px solid #2B312F`,
    text `#E4E9E7`, hover `bg #181C1B`; light `border 1px solid #D8DBD6`, text `#0B0D0C`,
    hover `bg #F3F4F1`. `transition: background .15s ease`.
  - "Reschedule" — same as secondary but `padding:12px 14px` and muted text
    (dark `#8A918E` / light `#6B7270`), hover brings it to full ink.
- Continuity footer: `border-top` (dark `#1E2220` / light `#ECEEEA`), `padding-top:16px`,
  13px, muted; one emphasized clause in near-full ink (dark `#D6DCD9` / light `#0B0D0C`).
  Content pattern: last lesson topic — the student's flagged difficulty — homework status.

#### 4. Hero — stat stack (right, 1fr)
Two equal cards, `display:flex; flex-direction:column; gap:18px`, each `flex:1`,
`border-radius:18px`, `padding:22px 24px`, `justify-content:space-between`, same surface
and border as the hero card. Hover: `translateY(-3px)`, `transition: transform .2s ease`.
These replace `StatCard`'s icon-tile layout (no icons — the number is the graphic).
- **UNBILLED** — mono 11px uppercase label `letter-spacing:.12em` (dark `#6C7471` /
  light `#6B7270`); value `£420` at 38px/700 `letter-spacing:-.03em`; sub-line 13px muted,
  `margin-top:6px`: "6 completed lessons · oldest 11 days". Click → invoice draft (or the
  unbilled-lessons list until billing ships).
- **THIS WEEK** — value `12` 38px/700 with baseline-aligned "lessons · 14h" at 14px muted
  (`gap:8px`); below it a 7-bar sparkline: `display:flex; gap:4px; height:30px;
  align-items:flex-end`, each bar `flex:1`, `border-radius:3px`, heights
  40/65/50/85/70/100/30 %. Inactive bars dark `#232826` / light `#E4E6E2`; **today's bar**
  (the 100% one) dark `#4CF0B3` / light `#0B0D0C`.

#### 5. "Today's schedule" (lower left, 1.6fr)
- Card: same surface/border, `border-radius:18px`, `padding:22px 24px`.
- Header row: title 18px/700 `letter-spacing:-.02em`; right meta mono 11px muted
  ("5 lessons · 4h 45m"). `margin-bottom:18px`.
- Rows: `display:grid; grid-template-columns:64px 1fr auto; gap:16px; align-items:center;
  padding:13px 0`, separated by `border-top` (dark `#1B1F1E` / light `#ECEEEA`).
  - Time cell: mono 13px. Past `#5F6664`/`#A2A8A5`; upcoming `#B9C0BD`/`#3A403D`.
  - Student cell: 28px `border-radius:9px` initials tile (11px text) + name 14px with the
    subject appended in a dimmer inline span. Completed rows are dimmed wholesale
    (dark `#7B827F` / light `#8C938F`).
  - Status pill, right: mono 10px, `letter-spacing:.08em`, `border-radius:20px`, `padding:3px 9px`.
    - `DONE` — outlined, muted (dark `border #262B29` text `#6C7471`; light `border #E2E4DF` text `#8C938F`)
    - `UP NEXT` — filled: dark `bg #4CF0B3` text `#05100C`; light `bg #0B0D0C` text `#F2F3F0`; weight 500
    - `NO PLAN` — purple outline: dark `border #362C53` text `#B08CFF`; light `border #D6C9FA` text `#5B2EE0`
    - `CANCELLED` — muted outline; the time and name also get `text-decoration:line-through`
      (dark time `#4A514E`, name `#5F6664`; light time `#B6BCB9`, name `#A2A8A5`)
  → extend `Badge`'s tone map with these four lesson-status tones and retire the blue tone.
- **The "up next" row is promoted**, not just badged: `padding:15px 14px`, `margin:6px -14px`
  (bleeds past the card padding), `border-radius:12px`, no top border, dark
  `bg #161C1A` + `border 1px solid #2C3A35` / light `bg #EAFBF4` + `border 1px solid #B8E8D6`.
  Its time is accent-colored (dark `#4CF0B3` / light `#00734F`), its avatar tile is an
  accent fill (dark `bg #4CF0B3` text `#05100C`; light `bg #0B0D0C` text `#4CF0B3`), and the
  name is 15px/500.
- Reference content: 09:00 Daniel Okafor · Physics GCSE (DONE) / 11:30 Priya Shah ·
  Maths GCSE (DONE) / 17:00 Sofia Ramos · Maths A-level (UP NEXT) / 18:30 Tom Bennett ·
  Chemistry A-level (NO PLAN) / 20:00 Lena Fischer · German (CANCELLED).
- Empty state: reuse `EmptyState` — "No lessons today." + "Schedule a lesson" primary action.

#### 6. "Needs review" (lower right, top)
- Card: same surface/border, `padding:22px 24px`. Header: title 18px/700 + count pill
  (same styling as the nav Homework pill), `margin-bottom:16px`.
- Rows: `padding:12px 0`, `border-top` hairline, `display:flex; justify-content:space-between;
  align-items:center; gap:12px`, `cursor:pointer`, hover `bg #151918` (dark) /
  `bg #F7F8F6` (light).
  - Left: assignment title 14px/500, then mono 11px meta `margin-top:4px` —
    "student · relative time" (muted; **purple** when overdue: dark `#B08CFF` / light `#5B2EE0`).
  - Right: text action 13px in accent with a faint underline border
    (dark `#4CF0B3` on `border-bottom 1px solid #1E3A31`; light `#00734F` on `#B8E8D6`).
    "Review" for submitted work; "Nudge" for overdue-unsubmitted.
- Reference content: Integration by parts, Q1–8 · Sofia Ramos · 2h ago (Review) /
  Circular motion set · Daniel Okafor · yesterday (Review) / Titration write-up ·
  Tom Bennett · 1 day overdue (Nudge).

#### 7. "Prep queue" (lower right, bottom) — inverted card
The one deliberately loud block, and the page's only full accent surface.
- Dark theme: `bg #4CF0B3`, text `#05100C`. Light theme: `bg #0B0D0C`, text `#F2F3F0`.
  `border-radius:18px`, `padding:22px 24px`, no border.
- Label "PREP QUEUE": mono 11px uppercase `letter-spacing:.12em`; dark `opacity:.65` on the
  dark ink, light `#4CF0B3`.
- Message 17px/500, `line-height:1.35`, `margin-top:10px` — "Tom's 18:30 chemistry lesson
  has no plan yet." (single highest-value nudge; pick the earliest upcoming lesson with no plan).
- Button, `margin-top:16px`, `display:inline-flex`, 13px, `border-radius:9px`,
  `padding:9px 14px` — dark `bg #05100C` text `#4CF0B3` (hover `brightness(1.4)`);
  light `bg #4CF0B3` text `#05100C` (hover `brightness(1.08)`). Copy: "Write plan · 8 min"
  (the estimate is the hook — keep it).
- When nothing needs prep, swap to a quiet confirmation ("Every upcoming lesson has a plan.")
  or omit the card; never show it empty.

---

## Interactions & Behavior

**Navigation / click targets**
| Element | Action |
| --- | --- |
| "+ New lesson" | Open new-lesson form (modal or `/dashboard/lessons/new`), prefilled with the next free slot |
| "Join Google Meet" | `window.open(lesson.meetingUrl, "_blank")`; disabled when no URL |
| "Open lesson plan" | `/dashboard/lessons/[id]` (plan/notes tab) |
| "Reschedule" | Reschedule dialog for that lesson |
| Schedule row | `/dashboard/lessons/[id]` |
| Needs-review row / "Review" | `/dashboard/homework/[id]` (feedback view) |
| "Nudge" | Send the overdue-homework reminder email; optimistic toast, row meta → "nudged just now" |
| "Write plan · 8 min" | `/dashboard/lessons/[id]` plan editor, focus in the plan field |
| Unbilled card | Unbilled-lessons list (invoice draft once billing ships) |
| Search pill / `/` key | Focus student search (command-palette style) |

**Animations & transitions** — all short, all functional:
- `tdPulse` — the countdown dot: `1.8s ease-in-out infinite`; 0%/100% `opacity:1 scale(1)`,
  50% `opacity:.35 scale(.72)`.
- `tdRing` — attention ring on "Join Google Meet": `2.6s ease-out infinite`;
  `0% box-shadow:0 0 0 0 rgba(76,240,179,.55)` → `70% 0 0 0 12px rgba(76,240,179,0)` →
  `100% 0 0 0 0 rgba(76,240,179,0)`. **Only** while the next lesson is within ~15 minutes;
  drop it otherwise so it stays meaningful.
- Card hover lift: `translateY(-3px)`, `transform .2s ease` (stat cards).
- Button hover: `translateY(-2px)` + `brightness(1.08)`, `.15s ease`.
- Hero border brighten: `border-color .2s ease`.
- Row hover tint: instant background swap.
- Respect `prefers-reduced-motion: reduce` — disable `tdPulse`, `tdRing` and the lifts,
  keep color-only feedback.

**Live behavior**
- The countdown ("in 42 min") ticks client-side every 30s. At T-0 it becomes "starting now";
  while in progress, "ends in 24 min" and the schedule pill reads `IN PROGRESS`.
- The greeting switches morning/afternoon/evening on the tutor's timezone, not the server's.
- After a lesson's end time the hero rolls to the next lesson; when the day is done show
  "Nothing left today" with tomorrow's first lesson as the secondary line.

**Loading** — skeleton the hero name (44px bar), the two stat values, and 5 schedule rows
at the real row heights; keep the rail and greeting static (both render from session data).

**Errors** — per-card inline retry ("Couldn't load today's lessons · Retry") rather than a
whole-page error; the page is a dashboard of independent queries.

**Responsive behavior** (the reference is desktop-only at 1380px)
- ≥1280px: as specified.
- 1024–1279px: keep both grids but drop hero to `1.4fr 1fr`; shrink the student name to 36px.
- <1024px: rail collapses to the existing `AppShell` mobile header + drawer; both grids
  become one column in this order — hero, prep queue, schedule, needs review, stats row
  (stats side by side). Headline → 30px, student name → 32px, card padding → `20px`.
- Buttons in the hero action row wrap; keep "Join Google Meet" full-width first on mobile.

## State Management
Server-fetched (Supabase, tutor-scoped by RLS), one query per card:
- `tutorProfile` — display name, timezone, currency
- `todaysLessons[]` — id, start, end, durationMin, student{id,name,initials}, subject, level,
  status(`scheduled|completed|cancelled|no_show`), meetingUrl, hasPlan, rate
- `nextLesson` — derived client-side from `todaysLessons` (first `scheduled` with `end > now`)
- `homeworkNeedingReview[]` — id, title, student, submittedAt, dueAt, status(`submitted|overdue`)
- `unbilled` — amount, currency, lessonCount, oldestLessonDate
- `weekLoad` — lessonCount, totalMinutes, perDayMinutes[7]

Client state: `now` (30s interval, drives countdown + status pills), `mobileNavOpen`
(already in `AppShell`), `searchOpen`, and optimistic flags for nudge-sent / plan-saved.
All money formats through the tutor's currency; all times through their timezone.

## Design Tokens

**Dark theme**
| Token | Value |
| --- | --- |
| bg/page | `#0A0B0B` |
| bg/rail | `#0C0E0D` |
| bg/card | `#121514` |
| bg/inset (chips, tiles) | `#191D1C`, `#171A19`, `#1C2120` |
| bg/field | `#101312` |
| bg/row-hover | `#151918` |
| border/strong | `#2B312F` |
| border/card | `#1F2422` |
| border/hairline | `#1B1F1E` |
| border/rail | `#1E2220` |
| border/chip | `#262B29`, `#232725` |
| text/primary | `#F1F3F1` |
| text/secondary | `#B9C0BD` |
| text/muted | `#8A918E` |
| text/faint | `#6C7471`, `#5F6664` |
| text/disabled | `#4A514E`, `#454B49` |
| accent | `#4CF0B3` |
| accent/on-accent ink | `#05100C` |
| accent/surface | `#161C1A` |
| accent/surface-border | `#2C3A35` |
| accent/underline | `#1E3A31` |
| attention (purple) | `#B08CFF` |
| attention/ink | `#140A2B` |
| attention/border | `#362C53` |
| bar/inactive | `#232826` |

**Light theme**
| Token | Value |
| --- | --- |
| bg/page | `#F2F3F0` |
| bg/rail, bg/card | `#FFFFFF` |
| bg/inset | `#F5F6F3`, `#F0F2EF`, `#F3F4F1`, `#F7F8F6` |
| bg/row-hover | `#F7F8F6` |
| border/strong | `#D8DBD6` |
| border/card, border/rail | `#E2E4DF` |
| border/hairline | `#ECEEEA` |
| text/primary | `#0B0D0C` |
| text/secondary | `#3A403D`, `#4A514E` |
| text/muted | `#6B7270` |
| text/faint | `#8C938F` |
| text/disabled | `#A2A8A5`, `#B6BCB9` |
| accent (fills) | `#4CF0B3` on `#05100C` ink |
| accent (text on white) | `#00734F`, `#00875F` |
| accent/dot | `#00A87A` |
| accent/surface | `#EAFBF4` |
| accent/surface-border | `#B8E8D6` |
| ink fill (primary buttons) | `#0B0D0C` with `#4CF0B3` label |
| attention (purple) | `#5B2EE0` |
| attention/border | `#D6C9FA` |
| bar/inactive | `#E4E6E2` |

Accent rule: **green = go / now / money**; **purple = needs attention, exactly one meaning**
(overdue homework, missing plan). Never use purple decoratively. Contrast: on white,
always use the darkened greens `#00734F`/`#00875F` for text — `#4CF0B3` is a **fill** color
only, and always paired with `#05100C` ink.

**Typography** — `Space Grotesk` (400/500/700) for everything structural,
`JetBrains Mono` (400/500) for every piece of metadata: times, dates, counts, statuses,
labels, email. The mono/sans split is the design's signature — keep it strict.
| Role | Spec |
| --- | --- |
| Hero student name | 44px / 700 / `-.04em` / `line-height:1` |
| Page headline | 40px / 700 / `-.035em` / `line-height:1` |
| Stat value | 38px / 700 / `-.03em` |
| Card title | 18px / 700 / `-.02em` |
| Prep message | 17px / 500 / `line-height:1.35` |
| Emphasis row (up next) | 15px / 500 |
| Body / nav / rows | 14px / 400–500 |
| Small body, actions | 13px |
| Mono meta | 11–13px / 400–500 |
| Mono label (uppercase) | 11px / `.12em`–`.14em` |
| Mono pill | 10px / `.08em` |

**Spacing** — 4px base. Used: 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 34, 36.
Card padding `22px 24px` (hero `26px 28px`); grid gaps 18px; section gap 26px.

**Radius** — pills `20px`; cards `18px`; promoted row `12px`; buttons/fields/nav `11px`;
inner buttons `9px`; small tiles `9px`; chips `7px`; avatar `16px` (hero) / `50%` (rail).

**Shadows** — none inside the UI. The design deliberately uses borders and surface steps
instead of elevation; the only shadow in the reference frames the mockup itself. Drop the
existing `shadow-xs`/`hover:shadow-sm` on cards.

## Assets
No images, photos, or icon files. Avatars are **text initials** on colored tiles. The
sparkline is 7 plain `<span>` bars — not a chart library. Existing `src/components/icons.tsx`
glyphs are **not** used in this design (the rail is text-only, stat cards have no icon);
keep the file for other screens.
Fonts load from Google Fonts: `Space Grotesk` 400/500/700 and `JetBrains Mono` 400/500 —
in Next.js use `next/font/google` in `src/app/layout.tsx` rather than a `<link>`.

## Files
| File | What it is |
| --- | --- |
| `TutorDesk Today.dc.html` | The design reference. Open in any browser. Contains **1a** (dark, primary) and **1b** (light) side by side; scroll/zoom the canvas. |

Repo files the design was built against — read these before porting:
`docs/PRODUCT.md`, `docs/MVP.md`, `src/components/AppShell.tsx`,
`src/components/StatCard.tsx`, `src/components/Badge.tsx`, `src/components/Button.tsx`,
`src/app/globals.css`, `src/app/layout.tsx`.
