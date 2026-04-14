# Avanty Broker Portal — Compliance & Feature Status

> **Last updated:** 2026-04-14
> **Purpose:** Living document tracking what's built, what's legally required, and what's needed for MVP.
> **Production URLs:**
> - Broker Portal: https://portal.avantycare.com (internal dashboard)
> - Main Site / Public Portal: https://avantycare.com/portal (public forms)

---

## Table of Contents

1. [Changelog](#changelog)
2. [Current Build Status](#current-build-status)
3. [Legal & Regulatory Requirements](#legal--regulatory-requirements)
4. [Competitor Feature Comparison](#competitor-feature-comparison)
5. [MVP Roadmap](#mvp-roadmap)
6. [Detailed Feature Inventory](#detailed-feature-inventory)

---

## Changelog

### 2026-04-14
- **Public Services Portal** launched on avantycare.com/portal (Laravel, native on main site)
- Hub page organized by user type: Members & Patients / Transportation Providers / Account Access
- "Portal" dropdown in main site nav (desktop + mobile) — links to all services
- Broker Portal Login link added for existing account holders
- CI/CD fully restored — EC2 git credentials updated, both dev and prod auto-deploy on push
- Architectural decision: public-facing forms live on the main Laravel site, not the subdomain

### 2026-04-13
- **Reimbursement Forms** added to broker portal dashboard
- Three form types: Medicaid Trip Reimbursement, Provider Invoice, CMS-1500 / HCFA Claim
- Full status workflow (Draft → Submitted → Under Review → Approved/Denied → Paid)
- Auto-populate from existing completed trips
- Dashboard quick-access cards, sidebar nav link, role-based access
- PHI encryption on patient fields, audit logging on all actions

### 2026-04-08
- Provider Credentialing Module (13 credential types, status tracking)
- Trip Documentation fields (Medicaid ID, driver/vehicle ID, actual times, mileage, signatures)
- Complaint Tracking (8 categories, full workflow)
- Standing Orders (recurring trip templates with day-of-week scheduling)
- Email Notifications (trip assignment, status change)
- Reporting Dashboard (provider performance, trip log export, complaint summary)

---

## Current Build Status

### Architecture
Two separate codebases with distinct purposes:

**Broker Portal** (internal dashboard, behind login)
- **Frontend:** Next.js 16 / React 19 / TypeScript / Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL (AWS RDS)
- **ORM:** Prisma 7
- **Auth:** NextAuth v5 (JWT, credentials provider)
- **Hosting:** AWS Amplify (auto-deploy on push to main)
- **PHI Encryption:** AES-256-GCM (via `src/lib/encryption.ts`)
- **Repo:** github.com/Erichalfonso/AvantyBrokerPortal

**Main Site / Public Portal** (marketing site + public forms)
- **Framework:** Laravel 10 / PHP 8.1
- **Database:** MySQL/PostgreSQL on EC2
- **Hosting:** AWS EC2 (auto-deploy via GitHub Actions + SSH → deploy.sh)
- **CI/CD:** `dev` branch → `~/AvantyCare-Web`, `main` branch → `~/AvantyCare-Prod`
- **Repo:** github.com/AvantyCare-Project/AvantyCare-Web

### What's Built and Working

| Category | Feature | Status |
|----------|---------|--------|
| **Auth & Security** | Credentials login (email/password) | Done |
| | Role-based access control (admin/broker/provider) | Done |
| | JWT session management | Done |
| | PHI encryption at rest (patientName, patientPhone) | Done |
| | PHI access logging | Done |
| | Account lockout (5 attempts / 15-min lockout) | Done |
| | Rate limiting on login (10/min per email) | Done |
| | Session timeout (30-min idle / 8-hr max) | Done |
| | Password policy (8+ chars, upper/lower/number/special) | Done |
| | HSTS + security headers | Done |
| | Content Security Policy | Done |
| | BAA signed with AWS | Done |
| **Trip Management** | Create trips (manual) | Done |
| | Edit trips | Done |
| | View trip list (paginated, searchable) | Done |
| | View trip detail | Done |
| | Bulk import from Excel/CSV | Done |
| | Trip status workflow (9 statuses) | Done |
| | Assign trip to provider | Done |
| | Provider accept/reject trips | Done |
| | Trip notes (internal comments) | Done |
| | Status history audit trail | Done |
| | Mobility type (ambulatory/wheelchair/stretcher) | Done |
| **Provider Mgmt** | CRUD providers | Done |
| | Provider codes (PRV-001 format) | Done |
| | Activate/deactivate providers | Done |
| | Service areas + vehicle types | Done |
| | Assign users to providers | Done |
| | Provider workload stats | Done |
| **User Mgmt** | Create users (admin only) | Done |
| | List users | Done |
| | Password reset (admin generates temp password) | Done |
| | Role assignment | Done |
| **Dashboard** | Summary stats (total/pending/active/completed) | Done |
| | Today's trips | Done |
| | Status breakdown | Done |
| | Provider workload chart | Done |
| | Recent trips | Done |
| | Role-specific views | Done |
| **Audit** | Audit log (all mutations tracked) | Done |
| | Audit log viewer (admin, filterable) | Done |
| | PHI access logging (every trip view logged) | Done |
| **Queue** | Assignment queue (pending + rejected trips) | Done |
| | Quick-assign with mobility matching | Done |
| **Provider Credentialing** | Credential tracking (13 types: license, COI, background, drug, OIG, SAM, etc.) | Done |
| | Credential status management (valid/expiring/expired/pending/rejected) | Done |
| | Add/verify/remove credentials (admin) | Done |
| | Credential display on provider detail page | Done |
| **Trip Documentation** | Medicaid ID field | Done |
| | Authorization number field | Done |
| | Driver name/ID fields | Done |
| | Vehicle ID field | Done |
| | Actual pickup/dropoff timestamps | Done |
| | Actual mileage | Done |
| | Member signature URL field | Done |
| | Providers can update trip doc fields | Done |
| **Complaint Tracking** | Create complaints (categorized: late pickup, driver behavior, safety, etc.) | Done |
| | Complaint status workflow (open/investigating/resolved/closed) | Done |
| | Link complaints to providers and trips | Done |
| | Resolution tracking with resolver + timestamp | Done |
| | Filterable complaint list | Done |
| **Standing Orders** | Create recurring trip templates | Done |
| | Day-of-week scheduling (any combination) | Done |
| | Start/end date range | Done |
| | Generate trips from template for date range | Done |
| | Activate/deactivate orders | Done |
| | Auto-assign to preferred provider | Done |
| **Notifications** | Email on trip assignment (to provider) | Done |
| | Email on status change (to broker) | Done |
| | Credential expiration email template | Done |
| | SMTP/AWS SES configurable via env vars | Done |
| **Reporting** | Provider performance report (completion %, on-time %) | Done |
| | Trip log export (full documentation, JSON) | Done |
| | Complaint summary report (by category, provider, resolution time) | Done |
| | Date range filtering on all reports | Done |
| | Reports dashboard page | Done |
| **Reimbursement Forms (Broker Portal)** | Medicaid Trip Reimbursement form | Done |
| | Provider Invoice form with line items | Done |
| | CMS-1500 / HCFA Claim form (all Box 1-33 fields) | Done |
| | Form status workflow (Draft → Submitted → Under Review → Approved/Denied → Paid) | Done |
| | Auto-populate from completed trips | Done |
| | Dashboard quick-access cards and list page | Done |
| | Role-based access (brokers/admins for Medicaid+CMS, providers for invoices) | Done |
| **Public Portal (Main Site)** | `/portal` hub page organized by user type | Done |
| | For Members section: Request Trip, Check Prices, Mileage Reimbursement (placeholder), File Complaint (placeholder) | Partial |
| | For Providers section: Become Partner, Submit Invoice, Medicaid Trip, CMS-1500 | Done |
| | Broker Portal Login link | Done |
| | "Portal" dropdown in main nav (desktop + mobile) | Done |
| | Public reimbursement submissions save to Laravel DB | Done |

---

## Legal & Regulatory Requirements

### Tier 1: Federally Required (Cannot Operate Without)

| Requirement | Legal Basis | Status | Notes |
|-------------|-------------|--------|-------|
| **BAA with cloud provider** | HIPAA | Done | Signed with AWS |
| **BAA with each health plan client** | HIPAA | Not started | Must sign before handling their members' PHI |
| **PHI encryption at rest** | HIPAA Security Rule | Done | AES-256-GCM on patientName, patientPhone |
| **PHI encryption in transit** | HIPAA Security Rule | Done | TLS via AWS Amplify + HSTS headers |
| **Unique user IDs** | HIPAA Security Rule | Done | Each user has unique ID |
| **Role-based access control** | HIPAA Security Rule | Done | 3 roles with route-level enforcement |
| **Audit trail of PHI access** | HIPAA Security Rule | Done | PHI_VIEWED logged per access |
| **Session timeout** | HIPAA Security Rule | Done | 30-min idle, 8-hr absolute |
| **Breach notification plan** | HIPAA Breach Notification Rule | Not done | Written plan required (60-day notification window) |
| **Risk assessment** | HIPAA Security Rule | Not done | Documented security risk analysis required |
| **HIPAA Security Policy** | HIPAA Admin Safeguards | Not done | Written policy document |
| **HIPAA Privacy Policy** | HIPAA Privacy Rule | Not done | Written policy document |
| **Employee HIPAA training** | HIPAA Admin Safeguards | Not done | Training records must be maintained |
| **Designated Security Officer** | HIPAA Admin Safeguards | Not done | Named individual responsible for security |
| **Provider credentialing** | 42 CFR 455 (Medicaid) | Done | Credential tracking module with 13 types, status management, verification workflow |
| **Monthly OIG/LEIE + SAM.gov screening** | 42 CFR 455 | Partial | OIG/SAM credential types trackable; automated API screening not yet integrated |
| **FWA program** | 42 CFR 438.608 | Not done | Written policies, compliance officer, training, reporting |
| **Data retention (6-10 years)** | HIPAA + Medicaid | Not configured | No retention/archival policy in place |
| **Trip documentation** | 42 CFR 431.53 / State reqs | Done | All fields added: Medicaid ID, authorization #, driver/vehicle ID, actual pickup/dropoff timestamps, mileage, member signature URL |

### Tier 2: Contractually Required by Health Plans

Health plans will not contract with you without these:

| Requirement | Status | Notes |
|-------------|--------|-------|
| **GPS tracking on trips** | Not done | All competitors have this; health plans require it for trip verification |
| **Electronic trip verification** | Not done | GPS-stamped pickup/dropoff with member signature proves trip occurred |
| **Trip logs (complete records)** | Partial | All data fields present; PDF export not yet built |
| **Mileage reimbursement program** | Not done | Member self-drive reimbursement workflow — much cheaper than dispatching provider |
| **Reporting to health plans** | Done | Performance reports (on-time %, completion %), trip logs, complaint reports with date filtering |
| **Provider network adequacy tracking** | Not done | Must demonstrate sufficient coverage by area and vehicle type |
| **Complaint tracking system** | Done | Full workflow: create, categorize, investigate, resolve, close. Linked to providers and trips |
| **Email/SMS notifications** | Partial | Email notifications on assign + status change. SMS not yet integrated |

### Tier 3: Competitive Necessity (Not Legally Mandated)

| Feature | Competitors | Priority |
|---------|-------------|----------|
| Member self-service portal/app | All 3 have it | High |
| Claims/billing automation | All 3 have it | High |
| API integrations (TripMaster, RoutingBox) | MTM + Alivi | Medium |
| Call center integration | All 3 have it | Medium |
| Multi-channel booking (IVR, phone, fax) | ModivCare + MTM | Medium |
| HITRUST certification | ModivCare + MTM | Low (aspirational) |
| SOC 2 Type II | ModivCare | Low (aspirational) |
| AI-powered FWA detection | MTM | Low |
| URAC accreditation | MTM | Low |

---

## Competitor Feature Comparison

| Feature | ModivCare | MTM | Alivi | Avanty |
|---------|-----------|-----|-------|--------|
| **Scale** | 35M trips/yr | 35M trips/yr | 13+ states | Startup |
| **Years in NEMT** | 35 | 30 | ~10 | New |
| Trip CRUD + workflow | Yes | Yes | Yes | **Yes** |
| Provider management | Yes | Yes | Yes | **Yes** |
| RBAC | Yes | Yes | Yes | **Yes** |
| Audit logging | Yes | Yes | Yes | **Yes** |
| PHI encryption | Yes | Yes | Yes | **Yes** |
| GPS tracking | Yes | Yes | Yes | No |
| E-trip verification | Yes | Yes | Yes | No |
| Provider credentialing | Yes | Yes | CAQH-based | **Yes** |
| Member portal/app | Yes (MyModivcare) | Yes (MTM Link) | Yes (AliviRide) | Partial (public portal, no app) |
| Reporting dashboards | Advanced | Advanced | Yes | Basic |
| Claims/billing | Yes | Yes | Yes | **Partial** (reimbursement forms + invoicing) |
| Notifications | Yes | Yes | Yes | No |
| FWA monitoring | Yes | AI-powered | Yes | No |
| Mileage reimbursement | Yes | Yes (digital GMR) | Yes | No |
| E-signatures | Yes | Yes | Yes | No |
| API integrations | Extensive | Extensive | TripMaster/RoutingBox | No |
| Call center | Yes | Yes (600+ agents) | Yes (24/7) | No |
| Standing orders | Yes | Yes | Yes | **Yes** |
| Multi-modal transport | Yes | Yes | Yes | Partial (3 types) |
| **Certifications** | HITRUST, SOC2, ISO 27001 | HITRUST, URAC | BAA-based | HIPAA (in progress) |

---

## MVP Roadmap

### Phase 1: Legal Compliance (Must Complete Before Handling Real PHI)

> These items are non-negotiable. Without them, you cannot legally operate as a Medicaid NEMT broker.

- [x] **1.1 Provider Credentialing Module** (completed 2026-04-08)
  - 13 credential types: business license, insurance COI, vehicle inspection, background check, drug test, CPR, HIPAA/FWA/ADA training, driver's license, OIG screening, SAM screening
  - Status tracking: valid/expiring/expired/pending/rejected
  - Admin can add, verify, and remove credentials from provider detail page
  - Credential expiration dates tracked

- [x] **1.2 OIG/SAM Exclusion Screening** (partial — 2026-04-08)
  - OIG and SAM screening credential types added for manual date tracking
  - TODO: Automated API integration with OIG LEIE and SAM.gov for monthly bulk screening

- [x] **1.3 Trip Documentation Fields** (completed 2026-04-08)
  - Added: medicaidId, authorizationNumber, driverName, driverId, vehicleId, actualPickupTime, actualDropoffTime, actualMileage, memberSignatureUrl
  - Providers can update documentation fields on their assigned trips
  - Fields displayed on trip detail page
  - New trip form includes Medicaid ID and authorization number

- [ ] **1.4 Written Policies (Documents, Not Code)**
  - HIPAA Security Policy
  - HIPAA Privacy Policy
  - Breach Notification Plan (60-day response procedure)
  - FWA Program (policies, compliance officer, reporting mechanism)
  - Risk Assessment document
  - Employee Training records template

- [ ] **1.5 Data Retention Policy**
  - Configure minimum 6-year retention for audit logs
  - Configure minimum 7-year retention for trip records
  - Document retention schedule

### Phase 2: Health Plan Readiness (Must Have to Win Contracts)

> Health plans expect these features. You won't get contracts without them.

- [ ] **2.1 GPS Trip Tracking**
  - Provider-reported GPS coordinates at pickup and dropoff
  - Timestamp capture (actual vs. scheduled)
  - GPS breadcrumb trail (stretch goal)
  - Real-time trip status map view

- [ ] **2.2 Electronic Trip Verification**
  - GPS-stamped pickup/dropoff confirmation
  - Member e-signature capture (geo-tagged, timestamped)
  - Trip verification report generation

- [ ] **2.3 Mileage Reimbursement Program**
  - New trip type: `MILEAGE_REIMBURSEMENT`
  - Member submits: origin, destination, date, mileage, appointment verification
  - Broker reviews and approves/denies
  - Reimbursement calculated at IRS medical mileage rate

- [ ] **2.4 Trip Logs / Exportable Reports**
  - Complete trip log export (PDF per trip)
  - Batch reporting: on-time %, missed trips, complaints, costs
  - Monthly/quarterly report generation for health plans
  - Provider performance reports
  - Network adequacy reports

- [ ] **2.5 Notifications (Email/SMS)**
  - Trip assignment notifications to providers
  - Status change notifications to brokers
  - Appointment reminders to members
  - Credential expiration alerts to providers
  - Integrate email service (Resend, SendGrid, or AWS SES)

- [x] **2.6 Complaint Tracking** (completed 2026-04-08)
  - 8 complaint categories: late pickup, driver no-show, vehicle condition, driver behavior, billing, accessibility, safety, other
  - Status workflow: open > investigating > resolved > closed
  - Link to provider and trip
  - Resolution tracking with resolver ID and timestamp
  - Filterable by status and category

### Phase 3: Competitive Features (Scale & Differentiate)

> These put you on par with established competitors.

- [ ] **3.1 Member Self-Service Portal**
  - Member login/registration
  - Book trips (24-hr advance)
  - View upcoming and past trips
  - Cancel trips
  - Rate completed trips

- [ ] **3.2 Claims & Billing**
  - Trip-to-claim conversion
  - Rate schedules by provider/service type
  - Invoice generation
  - Payment tracking
  - Billing export for health plans

- [ ] **3.3 API Integrations**
  - Provider dispatch software (TripMaster, RoutingBox)
  - Health plan eligibility verification
  - EHR/healthcare facility integration

- [x] **3.4 Standing Orders (Recurring Trips)** (completed 2026-04-08)
  - Recurring trip templates with day-of-week scheduling
  - Start/end date range with optional end date
  - Generate trips for any date range from template
  - Auto-assign to preferred provider
  - Activate/deactivate orders
  - PHI encrypted on standing order creation

- [x] **3.7 Reimbursement Forms — Broker Portal** (completed 2026-04-13)
  - Medicaid Trip Reimbursement, Provider Invoice, CMS-1500 / HCFA Claim
  - Full status workflow (Draft → Submitted → Under Review → Approved/Denied → Paid)
  - Auto-calculated totals, line-item support (invoice + CMS service lines)
  - Auto-populate from existing completed trips
  - Role-based access and PHI encryption on patient fields

- [x] **3.8 Public Services Portal — Main Site** (completed 2026-04-14)
  - `/portal` hub page on avantycare.com organized by user type
  - Members section (Request Trip, Check Prices, Mileage/Complaint placeholders)
  - Providers section (Become Partner, Submit Invoice, Medicaid Trip, CMS-1500)
  - Broker Portal Login link for existing users
  - Laravel-native forms with validation and DB storage
  - "Portal" dropdown in main site navigation
  - CI/CD fully operational (GitHub Actions → EC2 auto-deploy)

- [ ] **3.5 Advanced Analytics**
  - Cost per trip analysis
  - Provider performance scoring
  - Demand forecasting
  - Utilization trending
  - SDOH impact tracking

- [ ] **3.6 Mobile App**
  - Provider driver app (GPS, navigation, trip verification)
  - Member booking app

---

## Detailed Feature Inventory

### Database Models

```
User
  - id, name, email, passwordHash, role, providerId
  - failedLoginAttempts, lockedUntil (account lockout)
  - Relations: createdTrips, statusChanges, notes

Provider
  - id, code, name, contactName, phone, email
  - serviceAreas[], vehicleTypes[]
  - active
  - Relations: users, trips, credentials, complaints

Trip
  - id, tripNumber, patientName (encrypted), patientPhone (encrypted)
  - pickupAddress, destinationAddress
  - appointmentDate, appointmentTime
  - mobilityType, specialInstructions
  - status, providerId, createdById
  - medicaidId, authorizationNumber (compliance)
  - driverName, driverId, vehicleId (trip documentation)
  - actualPickupTime, actualDropoffTime, actualMileage (verification)
  - memberSignatureUrl (e-signature)
  - standingOrderId (recurring trip reference)
  - Relations: provider, createdBy, statusHistory, notes, complaints, standingOrder

TripStatusHistory
  - id, tripId, status, note, changedById
  - Relations: trip, changedBy

Note
  - id, tripId, content, authorId
  - Relations: trip, author

AuditLog
  - id, action, entityType, entityId, userId, details

ProviderCredential
  - id, providerId, type (13 types), status (valid/expiring/expired/pending/rejected)
  - documentNumber, issuedDate, expirationDate
  - verifiedById, verifiedAt, notes
  - Relations: provider

Complaint
  - id, complaintNumber, category (8 types), status (open/investigating/resolved/closed)
  - description, resolution, providerId, tripId
  - reportedBy, resolvedById, resolvedAt
  - Relations: provider, trip

StandingOrder
  - id, patientName (encrypted), patientPhone (encrypted), medicaidId
  - pickupAddress, destinationAddress, appointmentTime
  - mobilityType, specialInstructions, providerId
  - daysOfWeek[], startDate, endDate, active, createdById
  - Relations: trips
```

### Trip Status Workflow

```
pending ──> assigned ──> accepted ──> driver_en_route ──> passenger_picked_up ──> completed
  │            │            │              │                     │
  └─cancelled  ├─rejected   └─cancelled    ├─cancelled           └─cancelled
               └─cancelled                 └─no_show
```

### API Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | /api/auth/[...nextauth] | Public | All | Login/logout |
| GET | /api/trips | Auth | All | List trips (provider-filtered) |
| POST | /api/trips | Auth | Broker/Admin | Create trip |
| GET | /api/trips/[id] | Auth | All | Get trip (PHI access logged) |
| PUT | /api/trips/[id] | Auth | Broker/Admin | Update trip |
| POST | /api/trips/[id]/status | Auth | All | Change status (validated transitions) |
| POST | /api/trips/[id]/assign | Auth | Broker/Admin | Assign to provider |
| GET | /api/trips/[id]/notes | Auth | All | Get trip notes |
| POST | /api/trips/[id]/notes | Auth | All | Add trip note |
| POST | /api/trips/import | Auth | Broker/Admin | Bulk import from Excel |
| GET | /api/providers | Auth | All | List providers |
| POST | /api/providers | Auth | Admin | Create provider |
| GET | /api/providers/[id] | Auth | All | Get provider detail |
| PUT | /api/providers/[id] | Auth | Admin | Update provider |
| DELETE | /api/providers/[id] | Auth | Admin | Deactivate provider |
| GET | /api/providers/[id]/users | Auth | Admin | List provider users |
| POST | /api/providers/[id]/users | Auth | Admin | Assign user to provider |
| DELETE | /api/providers/[id]/users | Auth | Admin | Remove user from provider |
| GET | /api/users | Auth | Admin | List users |
| POST | /api/users | Auth | Admin | Create user |
| POST | /api/users/[id]/reset-password | Auth | Admin | Reset user password |
| GET | /api/dashboard/stats | Auth | All | Dashboard statistics |
| GET | /api/audit | Auth | Admin | View audit logs |
| GET | /api/health | Public | All | Health check |
| GET | /api/providers/[id]/credentials | Auth | All | List provider credentials |
| POST | /api/providers/[id]/credentials | Auth | Admin | Add credential |
| PUT | /api/providers/[id]/credentials/[credentialId] | Auth | Admin | Update credential |
| DELETE | /api/providers/[id]/credentials/[credentialId] | Auth | Admin | Delete credential |
| GET | /api/complaints | Auth | All | List complaints (provider-filtered) |
| POST | /api/complaints | Auth | Broker/Admin | Create complaint |
| GET | /api/complaints/[id] | Auth | All | Get complaint detail |
| PUT | /api/complaints/[id] | Auth | Broker/Admin | Update complaint status/resolution |
| GET | /api/standing-orders | Auth | Broker/Admin | List standing orders |
| POST | /api/standing-orders | Auth | Broker/Admin | Create standing order |
| GET | /api/standing-orders/[id] | Auth | All | Get standing order detail |
| PUT | /api/standing-orders/[id] | Auth | Broker/Admin | Update standing order |
| POST | /api/standing-orders/[id]/generate | Auth | Broker/Admin | Generate trips from standing order |

### Dashboard Pages

| Path | Role | Description |
|------|------|-------------|
| /dashboard | All | Main dashboard with stats |
| /dashboard/trips | All | Trip list view |
| /dashboard/trips/new | Broker/Admin | Create trip form |
| /dashboard/trips/import | Broker/Admin | Bulk import |
| /dashboard/trips/[id] | All | Trip detail |
| /dashboard/trips/[id]/edit | Broker/Admin | Edit trip |
| /dashboard/providers | All | Provider list |
| /dashboard/providers/new | Admin | Create provider |
| /dashboard/providers/[id] | All | Provider detail |
| /dashboard/queue | Broker | Assignment queue |
| /dashboard/complaints | Broker/Admin | Complaint tracking |
| /dashboard/standing-orders | Broker/Admin | Recurring trip templates |
| /dashboard/users | Admin | User management |
| /dashboard/audit | Admin | Audit log viewer |

### Security Features

| Feature | Implementation | File |
|---------|---------------|------|
| Password hashing | bcryptjs (10 rounds) | src/lib/auth.ts |
| PHI encryption | AES-256-GCM | src/lib/encryption.ts |
| PHI access logging | Per-trip access log | src/lib/access-log.ts |
| Mutation audit trail | All CRUD actions logged | src/lib/audit.ts |
| Account lockout | 5 attempts / 15-min lock | src/lib/auth.ts |
| Rate limiting | 10 login attempts/min/email | src/lib/rate-limit.ts |
| Session config | 30-min idle / 8-hr max | src/lib/session-config.ts |
| Password policy | 8+ chars, complexity rules | src/lib/session-config.ts |
| Security headers | HSTS, CSP, X-Frame, etc. | next.config.ts |
| Route protection | JWT middleware on /dashboard | src/middleware.ts |

---

## References

- **HIPAA Security Rule**: 45 CFR 164.312
- **HIPAA Breach Notification**: 45 CFR 164.400-414
- **Medicaid Transportation**: 42 CFR 431.53
- **Provider Screening**: 42 CFR 455
- **FWA Requirements**: 42 CFR 438.608
- **False Claims Act**: 31 USC 3729-3733 (penalties: $14,308-$28,619 per false claim)
- **ADA Requirements**: 49 CFR Part 38

### Competitor References
- ModivCare: modivcare.com (35M trips/yr, HITRUST + SOC2 + ISO 27001)
- MTM: mtm-inc.net (35M trips/yr, HITRUST + URAC)
- Alivi: alivi.com (13+ states, 90% digitization rate)
