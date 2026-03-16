# Avanty Broker Portal — Development Tracker

## Project Overview
NEMT (Non-Emergency Medical Transportation) trip coordination platform.
Broker staff create/assign trips → Transportation providers accept/update status.

**Tech Stack:** Next.js 16 | React 19 | TypeScript | Tailwind CSS 4 | Prisma 7 | PostgreSQL (Supabase) | NextAuth v5

---

## Phase 1: Infrastructure Foundation
> **Status: COMPLETE**

- [x] Step 1.1 — Project tracking + dependencies
- [x] Step 1.2 — Database schema (Prisma) — 5 models, 3 enums
- [x] Step 1.3 — Seed script — 5 users, 3 providers, 6 trips
- [x] Step 1.4 — Authentication (NextAuth v5 + credentials + JWT)
- [x] Step 1.5 — Rewire auth context + middleware
- [x] Step 1.6 — API routes (8 endpoints: trips CRUD, status, assign, notes, providers, users)
- [x] Step 1.7 — Replace trip context with API calls + mock fallback

### External Dependencies
| Dependency | Status |
|---|---|
| Supabase DATABASE_URL | CONNECTED |
| NEXTAUTH_SECRET | CONFIGURED |
| NEXTAUTH_URL | CONFIGURED |

---

## Phase 2: Core Feature Completion
> **Status: IN PROGRESS**

- [x] Step 2.1 — Trip editing (edit page + Edit button on detail)
- [x] Step 2.2 — Trip reassignment after rejection (canAssign includes "rejected")
- [x] Step 2.3 — Provider CRUD (admin: create new, activate/deactivate)
- [ ] Step 2.4 — Provider-user mapping
- [x] Step 2.5 — Internal notes per trip (notes section on detail page)
- [x] Step 2.6 — Smart provider filtering (filters by mobility type match)
- [ ] Step 2.7 — Server-side pagination

---

## Phase 3: Operational Features
> **Status: NOT STARTED**

- [ ] Step 3.1 — Email notifications (need Resend API key)
- [ ] Step 3.2 — Assignment queue view
- [ ] Step 3.3 — Activity audit log
- [ ] Step 3.4 — Dashboard analytics
- [ ] Step 3.5 — Mobile responsive sidebar

---

## Phase 4: Production Readiness
> **Status: NOT STARTED**

- [ ] Step 4.1 — Input validation (Zod)
- [ ] Step 4.2 — Error handling
- [ ] Step 4.3 — Loading states
- [ ] Step 4.4 — Password reset flow
- [ ] Step 4.5 — Environment config

---

## Demo Accounts (Seeded)
| Email | Password | Role | Provider |
|---|---|---|---|
| maria@avantycare.com | broker123 | Broker | — |
| james@avantycare.com | broker123 | Broker | — |
| admin@avantycare.com | admin123 | Admin | — |
| dispatch@saferide.com | provider123 | Provider | SafeRide Transport |
| ops@carewheels.com | provider123 | Provider | CareWheels LLC |
