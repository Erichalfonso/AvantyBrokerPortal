# Avanty Broker Portal — Development Tracker

## Project Overview
NEMT (Non-Emergency Medical Transportation) trip coordination platform.
Broker staff create/assign trips → Transportation providers accept/update status.

**Tech Stack:** Next.js 16 | React 19 | TypeScript | Tailwind CSS 4 | Prisma 7 | PostgreSQL (Supabase) | NextAuth v5

---

## Phase 1: Infrastructure Foundation
> **Status: COMPLETE**

- [x] Step 1.1 — Project tracking + dependencies
- [x] Step 1.2 — Database schema (Prisma) — 6 models, 3 enums
- [x] Step 1.3 — Seed script — 5 users, 3 providers, 6 trips
- [x] Step 1.4 — Authentication (NextAuth v5 + credentials + JWT)
- [x] Step 1.5 — Rewire auth context + middleware
- [x] Step 1.6 — API routes (14 endpoints)
- [x] Step 1.7 — Replace trip context with API calls + mock fallback

---

## Phase 2: Core Feature Completion
> **Status: COMPLETE**

- [x] Step 2.1 — Trip editing (edit page + Edit button on detail)
- [x] Step 2.2 — Trip reassignment after rejection
- [x] Step 2.3 — Provider CRUD (admin: create new, activate/deactivate)
- [x] Step 2.4 — Provider-user mapping (detail page + add/remove users)
- [x] Step 2.5 — Internal notes per trip
- [x] Step 2.6 — Smart provider filtering (by mobility type match)
- [x] Step 2.7 — Server-side pagination

---

## Phase 3: Operational Features
> **Status: COMPLETE** (except email — needs API key)

- [ ] Step 3.1 — Email notifications (need Resend API key)
- [x] Step 3.2 — Assignment queue view (pending + rejected, quick-assign)
- [x] Step 3.3 — Activity audit log (audit table + admin page + logging on mutations)
- [x] Step 3.4 — Dashboard analytics (stats API, status breakdown, provider workload)
- [x] Step 3.5 — Mobile responsive sidebar (hamburger menu, slide-in overlay)

---

## Phase 4: Production Readiness
> **Status: COMPLETE** (except password reset — needs email)

- [x] Step 4.1 — Input validation (Zod schemas for trips, providers, auth)
- [x] Step 4.2 — Error handling (error boundary, 404 page)
- [x] Step 4.3 — Loading states (skeleton components, loading.tsx files)
- [ ] Step 4.4 — Password reset flow (needs email service)
- [x] Step 4.5 — Environment config (Zod env validation)

---

## Route Map (24 routes)
| Route | Type | Description |
|---|---|---|
| `/` | Page | Login |
| `/dashboard` | Page | Dashboard with analytics |
| `/dashboard/queue` | Page | Assignment queue |
| `/dashboard/trips` | Page | Trip list with pagination |
| `/dashboard/trips/new` | Page | Create trip |
| `/dashboard/trips/[id]` | Page | Trip detail + notes + actions |
| `/dashboard/trips/[id]/edit` | Page | Edit trip |
| `/dashboard/providers` | Page | Provider directory |
| `/dashboard/providers/new` | Page | Create provider (admin) |
| `/dashboard/providers/[id]` | Page | Provider detail + user management |
| `/dashboard/audit` | Page | Audit log (admin) |
| `/api/trips` | API | GET (list), POST (create) |
| `/api/trips/[id]` | API | GET, PUT |
| `/api/trips/[id]/status` | API | POST (status change) |
| `/api/trips/[id]/assign` | API | POST (assign provider) |
| `/api/trips/[id]/notes` | API | GET, POST |
| `/api/providers` | API | GET, POST |
| `/api/providers/[id]` | API | GET, PUT, DELETE |
| `/api/providers/[id]/users` | API | GET, POST, DELETE |
| `/api/users` | API | GET, POST (admin) |
| `/api/audit` | API | GET (admin) |
| `/api/dashboard/stats` | API | GET |
| `/api/auth/[...nextauth]` | API | Auth endpoints |

---

## HIPAA Compliance
> **Status: Code-level COMPLETE — Business-level PENDING**

### Code-Level (Done)
- [x] Session timeout / auto-logout (30 min idle, 2 min warning)
- [x] Password complexity requirements (8+ chars, upper, lower, number, special)
- [x] PHI encryption utilities (AES-256-GCM for patient name, phone)
- [x] Access logging (PHI_VIEWED events in audit log)
- [x] Secure HTTP headers (HSTS, CSP, X-Frame-Options, etc.)
- [x] Role-based access control
- [x] Audit trail on all mutations

### Business-Level (Required Before Production)
- [ ] Upgrade Supabase to Pro plan and sign BAA
- [ ] Sign BAA with hosting provider (Vercel Enterprise or AWS/GCP)
- [ ] Written HIPAA Security Policy
- [ ] Written HIPAA Privacy Policy
- [ ] Breach Notification Plan
- [ ] Employee training documentation
- [ ] Risk assessment document
- [ ] Account lockout after failed attempts (code ready, needs login attempt tracking in DB)

---

## Remaining Items
- Email notifications (Step 3.1) — needs Resend API key
- Password reset (Step 4.4) — needs email service
- Fix frontend login flow (quick login buttons)
- Remove demo quick login buttons before production
- Enable PHI encryption on trip create/update API routes

---

## Demo Accounts (Seeded)
| Email | Password | Role | Provider |
|---|---|---|---|
| maria@avantycare.com | broker123 | Broker | — |
| james@avantycare.com | broker123 | Broker | — |
| admin@avantycare.com | admin123 | Admin | — |
| dispatch@saferide.com | provider123 | Provider | SafeRide Transport |
| ops@carewheels.com | provider123 | Provider | CareWheels LLC |
