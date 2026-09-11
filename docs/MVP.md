# TutorDesk MVP (V1) Scope Specification

This document defines the functional boundaries for the TutorDesk Version 1 (V1) release. It establishes what is included in the private beta release and explicitly rules out out-of-scope capabilities to protect delivery speed and system maintainability.

---

## V1 Scope (In-Scope)

### 1. Authentication & Security
* Secure email/password authentication for tutors.
* Secure session management and credential protection.
* Strict tenant isolation enforcing that all tutor data belongs exclusively to that tutor.

### 2. Tutor Profile & Business Settings
* Tutor name, business/display name, timezone, and primary currency.
* Default hourly lesson pricing and payment instructions (e.g., bank transfer details).

### 3. Student Management
* Create, view, update, and archive student profiles.
* Store student contact details, default hourly rate, subject/level notes, and parent/guardian contact info.
* **Separation of Student and User**: Tutors can manage students who do not have an active TutorDesk account.
* Optional student invitations to access the student portal.

### 4. Tutor Dashboard
* High-level operational overview: upcoming lessons for the week, unbilled completed lessons, and outstanding invoices.

### 5. Scheduling & Lessons
* Schedule one-time lessons with start time, duration, subject, and student.
* Schedule recurring lesson series (e.g., weekly on Tuesdays at 16:00).
* Internal TutorDesk calendar view (day, week, and month).
* Mark lessons as completed, cancelled, or no-show.

### 6. Text Homework
* Assign text-based homework tasks tied to a student or completed lesson.
* Due date setting for assignments.
* Student text-based homework submission through the student portal.
* Tutor review, marking, and written feedback.

### 7. Invoicing & Billing
* Custom lesson pricing overrides per lesson or student.
* Invoice generation aggregating unbilled completed lessons or ad-hoc line items.
* Sequential invoice numbering (e.g., INV-0001).
* Invoice due dates and customizable terms.
* Invoice distribution via email notification.
* Automatic invoice reminders for upcoming and overdue invoices.
* Manual "Mark as Paid" action with payment date and method notes.

### 8. Student Portal
* Authenticated or secure magic-link student portal view.
* Read-only view of scheduled upcoming and past lessons.
* View assigned homework, submit text answers, and read tutor feedback.
* View issued invoices and payment instructions.

### 9. Notifications & Interface
* Basic transactional email notifications (lesson confirmation, homework assigned, invoice issued, invoice reminder).
* Fully responsive web application optimized for desktop, tablet, and mobile browsers.

---

## V1 Non-Goals (Strictly Out of Scope)

The following capabilities are deliberately excluded from V1:

* **Marketplace / Tutor Discovery**: No search directory, student matching, or public listings.
* **Built-in Video Calling**: No WebRTC, custom video rooms, or embedded call players; tutors supply standard meeting URLs.
* **Native Mobile Apps**: No iOS or Android native application codebases; responsive web only.
* **Online Card Payments**: No Stripe/PayPal automated card checkout or payment processing; V1 uses manual payment instructions and manual "mark as paid".
* **File Uploads / Cloud Storage**: No PDF, image, or document binary uploads for homework or notes; V1 homework is plain text only.
* **Google Calendar / Outlook Sync**: No two-way third-party calendar sync; V1 uses an internal calendar.
* **AI Functionality**: No AI lesson plan generation, AI homework grading, or automated text summarization.
* **Full Chat / Real-time Messaging System**: No real-time chat threads or WebSocket message streams; communications are structured via lessons, homework, and email.
* **Organizations / Multi-Tutor Workspaces**: No multi-teacher agencies, franchises, or shared tutor pools; 1 workspace = 1 tutor.
* **Advanced Financial Analytics**: No revenue forecasting, tax reporting, or P&L graphs.
* **Accounting Software Integrations**: No QuickBooks, Xero, or FreshBooks data syncing.
