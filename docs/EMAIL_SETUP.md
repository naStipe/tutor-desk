# TutorDesk Email Setup (Resend)

TutorDesk sends two kinds of email, through the same provider (Resend, ADR-015):

1. **Auth emails** (registration confirmation, password recovery). Sent by **Supabase Auth**, not by
   app code. Resend is plugged in as Supabase's custom SMTP server. Steps 1-4 below.
2. **App emails** (lesson reminder to the student, unpaid-balance reminder). Sent by **app code**
   through Resend's REST API. Steps 5-8 below. **Shipped switched off**; nothing is sent until you
   complete the activation checklist at the end.

No secret belongs in this file or in git. Put real values only in the Supabase dashboard, the Vercel
project environment variables, and your local `.env.local`.

## What already exists in the app (verified in TD-020)

- Sign-up (`signUpAction`) calls `supabase.auth.signUp` with
  `emailRedirectTo = ${NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/dashboard`. When the project requires
  email confirmation, the user is told to check their email.
- `/forgot-password` (`RequestResetForm`) calls `supabase.auth.resetPasswordForEmail` with
  `redirectTo = ${NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/reset-password`. The message is the same
  whether or not the email exists.
- `/auth/confirm` (route handler) accepts either `token_hash` + `type` (verifyOtp) or `code`
  (PKCE exchange), only allows `next` of `/dashboard`, `/reset-password` or an invite-complete path,
  and sends recovery sessions to `/reset-password`.
- `/reset-password` requires a session (otherwise redirects to `/forgot-password`) and calls
  `supabase.auth.updateUser({ password })`.

## 1. Create the Resend account and verify the sending domain

1. Create an account at <https://resend.com>.
2. Domains -> Add Domain. Use a domain (or subdomain such as `mail.yourdomain.com`) you control.
3. Add the DNS records Resend shows at your DNS host: the **SPF** (TXT, plus the MX for the
   `send.` subdomain Resend uses) and **DKIM** (TXT `resend._domainkey`) records. Optionally add a
   DMARC TXT record (`_dmarc`, for example `v=DMARC1; p=none;`) and tighten it later.
4. Click Verify in Resend and wait until the domain shows **Verified**. Until then, mail only goes
   to your own address or fails.

## 2. Create an API key

Resend -> API Keys -> Create API Key. Permission **Sending access**, restricted to the verified
domain. Copy it once; it starts with `re_`. This one key serves both Supabase SMTP and the app.

## 3. Configure Supabase Auth custom SMTP (dashboard, done by you)

Supabase dashboard -> Project `cmlvtnjoynffrznyelym` -> Authentication -> Emails -> SMTP Settings
(path names may differ slightly between dashboard versions):

| Field        | Value                                                        |
| ------------ | ------------------------------------------------------------ |
| Enable custom SMTP | on                                                     |
| Sender email | an address on the verified domain, for example `no-reply@mail.yourdomain.com` |
| Sender name  | `TutorDesk`                                                  |
| Host         | `smtp.resend.com`                                            |
| Port         | `465`                                                        |
| Username     | `resend`                                                     |
| Password     | the Resend API key from step 2                               |

Save, then raise the email rate limit (Authentication -> Rate Limits) if you need more than the
low default after enabling custom SMTP.

## 4. Site URL and redirect allow-list (dashboard)

Authentication -> URL Configuration:

- **Site URL**: the production URL, for example `https://app.yourdomain.com`.
- **Redirect URLs** (allow-list), one per line:
  - `https://app.yourdomain.com/auth/confirm**`
  - `http://localhost:3000/auth/confirm**`
  - plus the URL of any Vercel preview you test on, for example `https://*-yourteam.vercel.app/auth/confirm**`

`NEXT_PUBLIC_SITE_URL` in the app must equal the origin you use (production value on Vercel,
`http://localhost:3000` locally); the app builds both redirect targets from it. If a URL is missing
from the allow-list, Supabase silently falls back to the Site URL and the recovery link will land on
the wrong page.

Optional: Authentication -> Emails -> Templates lets you restyle "Confirm signup" and "Reset
Password". Keep the `{{ .ConfirmationURL }}` variable; do not hand-build links.

Test: sign up with a real address and request a password reset; both emails should arrive from your
domain and the links should end on `/dashboard` and `/reset-password`.

## 5. Environment variables for app emails

Set in Vercel (Production, and Preview if wanted) and in `.env.local`:

| Variable | Purpose |
| --- | --- |
| `EMAIL_NOTIFICATIONS_ENABLED` | Master switch. Only the exact value `true` enables sending. Default off. |
| `RESEND_API_KEY` | Resend key from step 2 (server-only). |
| `EMAIL_FROM` | Verified sender, for example `TutorDesk <notifications@mail.yourdomain.com>`. |
| `CRON_SECRET` | Long random string (for example `openssl rand -hex 32`). Vercel Cron sends it as `Authorization: Bearer <value>` automatically. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard -> Project Settings -> API. Server-only, bypasses RLS. Never `NEXT_PUBLIC_`. |

## 6. Database migration (done)

`supabase/migrations/20261010000000_notification_log.sql` was applied to the hosted project on
2026-10-15 with owner approval (Supabase tool; recorded in the hosted migration history as version
`20261015013525`, name `notification_log`). Do not `supabase db push` it again. The generated types
match `src/lib/supabase/database.types.ts` for these objects (the `interval` argument is typed
`string`).

## 7. How the app emails behave

- **Lesson reminder (cron)**: for lessons with status `scheduled` whose start falls in the next 24
  hours, emails the student's own address, or the guardian address if the student has none. Content
  is formatted in the tutor's timezone and locale. A lesson is reminded **at most once** (sent-log
  unique per lesson); lessons with no address are logged as `skipped` (`no_email`) and not retried,
  so add the address before the reminder window opens. At most 40 emails per run; the rest wait for
  the next run. A Resend 429 stops the run and releases that lesson for the next run; any other
  Resend error marks only that lesson `failed` (not retried).
- **Balance reminder (button)**: on a student's billing page, "Email payment reminder" appears only
  when the switch and credentials are on, the student has an unpaid balance and a guardian or
  student email exists. One send per student per hour.
- **Schedule trade-off**: the window is 24 hours, so any schedule of once per day or more often is
  gap-free. Daily (Vercel Hobby allows at most one cron run per day, with timing only accurate to
  the hour) sends each reminder between 0 and 24 hours before the lesson. Hourly (Vercel Pro)
  sends it about 24 hours before. A schedule slower than daily would miss lessons.

## 8. Activating the lesson-reminder cron (not done in code)

`vercel.json` does not exist and TD-020 deliberately did not create it. To activate, after the
checklist below, create `vercel.json` in the repository root with:

```json
{
  "crons": [{ "path": "/api/cron/lesson-reminders", "schedule": "0 6 * * *" }]
}
```

`0 6 * * *` is daily at 06:00 UTC; on Pro you may use `0 * * * *` (hourly). Pick the hour so the
daily run precedes your tutors' mornings. Deploy; Vercel then calls the route with
`Authorization: Bearer $CRON_SECRET`.

Manual smoke test after deploy (replace the placeholders; never paste a real secret into chat or git):

```
curl -i -H "Authorization: Bearer $CRON_SECRET" https://app.yourdomain.com/api/cron/lesson-reminders
```

Without the header the route answers 401. With the header and the switch off it answers
`{"disabled":true}`.

## Activation checklist (in order)

1. Resend domain verified, API key created (steps 1-2).
2. Supabase custom SMTP, Site URL and redirect allow-list set; sign-up and reset emails tested (3-4).
3. Migration reviewed and applied; types regenerated (6).
4. Env vars set in Vercel, with `EMAIL_NOTIFICATIONS_ENABLED=false` first; redeploy.
5. Set `EMAIL_NOTIFICATIONS_ENABLED=true`; test the balance button against a student whose
   guardian email is your own address.
6. Add `vercel.json` (step 8) and deploy; watch the first run in Vercel logs and the
   `notification_log` table.

To switch everything off again: set `EMAIL_NOTIFICATIONS_ENABLED` to anything other than `true`
(the cron route then returns `{"disabled":true}` and the button disappears).
