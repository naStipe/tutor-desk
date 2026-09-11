# Architecture Decision Records (ADRs)

This document records the foundational architectural decisions established for TutorDesk.

---

## ADR-001: Web-First Architecture

* **Decision**: Build TutorDesk exclusively as a responsive web application for initial launch. No native mobile applications (iOS/Android).
* **Reasoning**: Independent tutors conduct administrative work, scheduling, and billing predominantly on desktop and laptop browsers, with occasional mobile browser checks. A single responsive web application drastically reduces initial engineering surface area, eliminates app-store review delays, and allows rapid iteration.
* **Alternatives Considered**: React Native / Expo, Flutter. Rejected due to dual maintenance overhead for a small team.
* **Status**: Accepted.

---

## ADR-002: Modular Monolith Repository Structure

* **Decision**: Adopt a TypeScript modular monolith in a single repository.
* **Reasoning**: TutorDesk is operated by a small engineering team. Microservices or separated frontend/backend repositories introduce distributed failure modes, complex deployments, and redundant interface typing without benefits at this stage.
* **Alternatives Considered**: Microservices, decoupled Next.js frontend + standalone Express/Fastify API. Rejected for unnecessary overhead.
* **Status**: Accepted.

---

## ADR-003: Next.js App Router as Unified Full-Stack Framework

* **Decision**: Use Next.js with the App Router (React Server Components, Route Handlers, Server Actions).
* **Reasoning**: Provides seamless full-stack TypeScript integration, collocated server actions and API route handlers, strong static and dynamic rendering capabilities, and an active ecosystem.
* **Alternatives Considered**: Vite SPA + Express backend, Remix/React Router v7. Next.js App Router was chosen for first-class server-side rendering, API routing, and widespread developer familiarity.
* **Status**: Accepted.

---

## ADR-004: PostgreSQL as Relational Persistence Engine

* **Decision**: Use PostgreSQL as the primary database.
* **Reasoning**: Tutoring operations (students, schedules, lessons, invoices, line items) are intrinsically relational. ACID transactions are essential for billing, sequential invoice numbers, and schedule conflicts.
* **Alternatives Considered**: MongoDB/document stores, SQLite. Document databases lack strict relational guarantees; SQLite does not scale as seamlessly for multi-tenant SaaS.
* **Status**: Accepted.

---

## ADR-005: Drizzle ORM for Data Access and Migrations

* **Decision**: Use Drizzle ORM (`drizzle-orm` and `drizzle-kit`).
* **Reasoning**: Drizzle provides high-performance, type-safe SQL-like queries without heavyweight client instantiation or hidden runtime query engines. Schema declarations are written directly in TypeScript, and migrations are generated as clean, predictable SQL files.
* **Alternatives Considered**: Prisma, TypeORM, Kysely. Prisma has heavier runtime overhead and separate schema DSL; Drizzle is native TypeScript with zero runtime bloat.
* **Status**: Accepted.

---

## ADR-006: Better Auth for Authentication

* **Decision**: Use Better Auth for authentication infrastructure.
* **Reasoning**: Better Auth offers modern TypeScript support, native Drizzle adapter integration, secure session cookies, extensible plugin architecture, and eliminates external SaaS authentication lock-in (e.g. Auth0, Clerk).
* **Alternatives Considered**: NextAuth/Auth.js, Clerk, Supabase Auth. Better Auth provides clean TypeScript-first schema generation and full local database ownership.
* **Status**: Accepted.

---

## ADR-007: Strict Separation of Student and User Concepts

* **Decision**: Model `Student` independently from `User`. A student does not require a TutorDesk user account to exist in a tutor's records.
* **Reasoning**: Many tutoring students are minors whose parents handle communications, or students who prefer not to create yet another software account. Forcing user registration would create friction and block tutors from recording their students.
* **Alternatives Considered**: Modeling every student as a required `User` record. Rejected because it directly clashes with real-world tutor operations.
* **Status**: Accepted.

---

## ADR-008: Manual Payment Tracking Initially (No Card Processing Gateway in V1)

* **Decision**: In V1, invoices will display manual payment instructions (bank transfer details, PayPal/Venmo links) and tutors will manually mark invoices as paid.
* **Reasoning**: Independent tutors frequently receive direct bank transfers or cash. Integrating Stripe Connect or card merchant processing adds significant compliance, onboarding friction, and payout complexity that is unnecessary for initial beta testing.
* **Alternatives Considered**: Integrated Stripe Checkout from Day 1. Deferred to post-beta iterations.
* **Status**: Accepted.

---

## ADR-009: Internal Calendar First (No External Google/Outlook Calendar Sync in V1)

* **Decision**: Build an internal TutorDesk calendar for scheduling lessons without bidirectional Google/Outlook calendar synchronization in V1.
* **Reasoning**: Bidirectional calendar synchronization involves complex OAuth token management, webhook subscription renewal, time zone conversion nuances, and conflict resolution algorithms. Keeping the calendar internal keeps V1 delivery focused.
* **Alternatives Considered**: Google Calendar API integration. Deferred to a dedicated integration milestone.
* **Status**: Accepted.

---

## ADR-010: Text-Only Homework for V1

* **Decision**: Support plain-text homework descriptions, text student submissions, and text tutor feedback. No binary file/PDF uploads initially.
* **Reasoning**: Text assignments satisfy the vast majority of conceptual homework checks, essay prompts, and problem sets while avoiding cloud storage bucket configuration, upload virus scanning, and bandwidth costs.
* **Alternatives Considered**: S3/GCS presigned file uploads. Deferred to future feature milestone.
* **Status**: Accepted.

---

## ADR-011: Small Private Beta as First Release Target

* **Decision**: Target a small private beta with a handful of active independent tutors before broader public availability.
* **Reasoning**: Close direct feedback from real educators ensures we build the right workflows before scaling marketing or infrastructure.
* **Alternatives Considered**: Broad open self-serve public launch. Rejected to preserve high customer empathy and rapid feedback cycles.
* **Status**: Accepted.
