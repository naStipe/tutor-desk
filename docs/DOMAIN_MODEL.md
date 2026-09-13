# TutorDesk Domain Model (Preliminary)

> **Notice**: This document outlines anticipated high-level domain concepts. Full database tables and schemas will be designed and established incrementally ticket-by-ticket as features are built. Do NOT prematurely implement these tables in TD-000.

---

## Anticipated High-Level Domains

### 1. User
* Identity entity managed by Supabase Auth in `auth.users`.
* Represents an authenticated human interacting with the system (primarily tutors; secondarily students when invited).
* Authentication attributes remain owned by Supabase Auth and are not duplicated in application tables.

### 2. TutorProfile
* Application profile associated 1-to-1 with a tutor identity through `user_id uuid`.
* TD-001S stores only `user_id`, `created_at`, and `updated_at`; business settings remain future scope.

### 3. Student (CRITICAL DOMAIN RULE)
* Represents a tutoring client managed by a tutor.
* **Important domain rule**: **`Student` and `User` are distinct concepts.**
  * A tutor must be able to create, schedule lessons with, and invoice a student who does *not* have a TutorDesk login account. Many students are young children, or prefer communicating solely via parental email or in-person interactions.
  * A `Student` may optionally be linked to a `User` when an invitation is accepted for the student portal, but the existence of a `Student` entity is never blocked on user registration.
* TD-002 implements a minimal `public.student` table: `id`, `tutor_id` (references `public.tutor_profile(user_id)`, not `auth.users` directly), `name`, `email`, `notes`, `archived_at`, `created_at`, `updated_at`. Archiving sets `archived_at` rather than deleting the row; there is no hard-delete path in the application UI.
* Remaining anticipated attributes (phone, parentName, parentEmail, defaultRate, portal linkage) are deliberately deferred to later tickets and are not yet part of the schema.

### 4. Lesson
* Represents an individual scheduled tutoring session.
* Belongs to a tutor and is associated with one student.
* TD-003 implements a minimal `public.lesson` table: `id`, `tutor_id` (references
  `public.tutor_profile(user_id)`), `student_id` (references `public.student(id)`), `start_time`,
  `end_time` (`end_time > start_time` enforced by a check constraint), `status` (`scheduled`,
  `completed`, `cancelled`, `no_show`; check-constrained, defaults to `scheduled`), `notes`,
  `created_at`, `updated_at`. There is no hard-delete path; `cancelled`/`no_show` are the lifecycle's
  equivalent of archiving.
* Remaining anticipated attributes (seriesId, durationMinutes, subject, hourlyRate) are deliberately
  deferred — TD-003 is single lessons only, no recurrence or pricing.

### 5. LessonSeries
* Represents a recurring schedule rule (e.g., "Every Thursday at 17:00 for 60 minutes").
* Generates concrete `Lesson` instances.
* Belongs to a tutor and student.

### 6. Homework
* A text-based homework task assigned by a tutor to a student.
* Optionally tied to a `Lesson`.
* TD-004 implements a single minimal `public.homework` table (not split into a separate
  `HomeworkSubmission` entity, since V1 has no student-authenticated portal to author its own row —
  see below): `id`, `tutor_id` (references `public.tutor_profile(user_id)`), `student_id`
  (references `public.student(id)`), `lesson_id` (optional, references `public.lesson(id)`
  `ON DELETE SET NULL`), `title`, `description`, `due_date`, `status` (`assigned`, `submitted`,
  `reviewed`; check-constrained, defaults to `assigned`), `submission_text`, `submitted_at`,
  `feedback_text`, `feedback_at`, `created_at`, `updated_at`.
* Because there is no student portal yet, the tutor is the only actor who can write
  `submission_text` (e.g. recording a submission made in person or by email) and `feedback_text`.
  When a student portal is built, submission authorship should move to the student's own identity
  rather than staying tutor-authored — revisit this table's ownership model at that point.

### 7. HomeworkSubmission
* Superseded for V1 by TD-004's single-table `Homework` design above (see rationale there). Kept as
  a domain note: once a student portal exists, submissions may warrant a separate table so a student
  can author their own row under RLS distinct from the tutor's `Homework` row.

### 8. Invoice
* Represents a commercial billing document issued by a tutor to a student/parent.
* Aggregates completed lessons and/or custom line items.
* Attributes (anticipated): id, tutorId, studentId, invoiceNumber (sequential, e.g. INV-0001), issueDate, dueDate, totalAmount, currency, status (draft, sent, paid, overdue, void), notes, paidAt.

### 9. InvoiceLine
* Individual item within an `Invoice`.
* Can reference a completed `Lesson` or represent custom charges (e.g., textbook cost, cancellation fee).
* Attributes (anticipated): id, invoiceId, description, quantity, unitPrice, amount.

### 10. StudentInvite
* Represents an invitation issued by a tutor to a student/parent to create a portal account or access their portal link.
* Attributes (anticipated): id, tutorId, studentId, token, expiresAt, status (pending, accepted, expired).

### 11. InvoiceReminder
* Log and schedule of automated payment reminders for an unpaid `Invoice`.
* Attributes (anticipated): id, invoiceId, reminderType (upcoming, due_date, overdue), scheduledFor, sentAt, status.

---

## Evolution Principle

This domain model is preliminary. Each domain entity and its relational integrity rules will be defined, typed, validated, and migrated through individual feature tickets (starting from TD-001 onwards).
