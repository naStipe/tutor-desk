# TutorDesk Security Policy & Invariants

## Core Security Invariant: Strict Multi-Tenant Isolation

TutorDesk is a multi-tenant SaaS. **Every business resource belongs to an authenticated tutor.**

Under no circumstances should a tutor be able to read, update, delete, or discover another tutor's data:
* **Students**: Names, contact info, notes, and records.
* **Lessons**: Calendars, schedules, rates, and notes.
* **Homework**: Tasks, submissions, and feedback.
* **Invoices**: Financial amounts, billing details, and payment statuses.
* **Settings**: Profiles, rates, and notification preferences.

### Authorization Directives
1. **Server-Side Enforcement**: All authorization logic must execute on the server (Server Components, Route Handlers, Server Actions). Never rely on UI rendering states, hidden tabs, or client-side checks for access control.
2. **Mandatory Tenant Scoping (`tutorId`)**: Every database query touching tenant resources MUST include a filter matching the current authenticated user's ID (`eq(table.tutorId, session.user.id)`).
3. **IDOR Defense**: All routes taking entity IDs (e.g., `/api/students/[id]`, `/api/invoices/[id]`) must verify that the requested entity's `tutorId` matches the session. If it does not match, return a `404 Not Found` (to prevent resource existence enumeration) or `403 Forbidden`.

---

## Authentication & Session Security

1. **Secure Session Handling**: Sessions are managed via HttpOnly, Secure, SameSite cookies managed by Better Auth.
2. **Password Hashing**: Passwords must be hashed using state-of-the-art key derivation functions (e.g. Scrypt/Argon2) provided by Better Auth. Plaintext passwords never touch database persistence or logs.
3. **Session Revocation**: User logouts and password changes must immediately invalidate active sessions server-side.

---

## Input Validation & Boundary Defense

1. **Strict Zod Schemas**: Every piece of external input (JSON bodies, URL params, query strings, headers) must be validated using strict Zod schemas before processing.
2. **SQL Injection Defense**: All database queries must use Drizzle ORM's parameterized query builder. Raw SQL strings with interpolated user input are strictly forbidden.
3. **Cross-Site Scripting (XSS)**: Next.js and React automatically escape JSX rendering. Dangerously setting inner HTML is prohibited.

---

## Secret Management & Data Protection

1. **Zero Committed Secrets**: Secrets (`BETTER_AUTH_SECRET`, database passwords, API tokens) must strictly live in `.env` and environment variables. Never commit `.env` or secret keys to version control.
2. **Sensitive Data Logging Prohibited**: Loggers must never print user passwords, tokens, full credit card data, or PII.
3. **Secure Headers**: Security headers (`Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`) must be enforced on HTTP responses.

---

## Future Capabilities Security Guidance

* **Future File Uploads**: When document uploads are added in future iterations, they must strictly validate file MIME types, sanitize file names, store binaries outside the web root (e.g. private S3/GCS buckets with signed URLs), and enforce tenant-scoped authorization on every download link.
* **Future Payment Integrations**: When card processing is introduced, cardholder data must never touch TutorDesk application servers (utilizing Stripe Elements / hosted checkout). Webhook signatures must be strictly validated before updating invoice states.
