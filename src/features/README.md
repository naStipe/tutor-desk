# TutorDesk Feature Modules

This directory contains domain feature modules for TutorDesk.

Each feature directory encapsulates:
- Domain-specific Zod schemas and validation rules
- Server Actions and data access logic
- Feature-specific UI components
- Feature-specific types

## Planned Future Modules (TD-001+)
- `auth/`: Tutor authentication, signup, login, session guards
- `tutor-profile/`: Tutor business settings, rates, currency, payment instructions
- `students/`: Student directory, profiles, contact records, parent notes
- `lessons/`: Single lessons, recurring series, attendance, calendar views
- `homework/`: Text assignments, student submissions, tutor feedback
- `invoicing/`: Invoice generation, line items, reminder workflows, manual payment marking
- `student-portal/`: Student-facing view for schedules, homework, and billing
