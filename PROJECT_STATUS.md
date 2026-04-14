# Avanty Care Project Status — April 14, 2026

## Overview
Two separate codebases:
- **Broker Portal** (Next.js) — `portal.avantycare.com` — repo: `github.com/Erichalfonso/AvantyBrokerPortal`
- **Main Site** (Laravel 10) — `avantycare.com` — repo: `github.com/AvantyCare-Project/AvantyCare-Web`, cloned at `C:\Users\erich\AvantyCare-Web`

Both auto-deploy on push (Amplify for broker portal, GitHub Actions → EC2 for main site).

---

## What's Live

### Main Site — `avantycare.com/portal` (Deployed ✅)
Public-facing online services hub organized by user type:

**For Members & Patients**
- Request a Trip (existing modal)
- Check Ride Prices (existing form)
- Mileage Reimbursement *(Coming Soon placeholder)*
- File a Complaint *(Coming Soon placeholder)*

**For Transportation Providers**
- Become a Partner (existing modal)
- Submit Invoice (`/portal/provider-invoice`)
- Medicaid Trip Reimbursement (`/portal/medicaid-trip`)
- CMS-1500 Claim Form (`/portal/cms-1500`)

**Account Access**
- Broker Portal Login → `portal.avantycare.com`

**Nav**: "Portal" dropdown in desktop + mobile nav with links to all services.

### Broker Portal — `portal.avantycare.com` (Deployed ✅)
Internal dashboard for managing reimbursement form submissions + existing features:
- `/dashboard/reimbursements/*` — manage forms with status workflow (Draft → Submitted → Under Review → Approved/Denied → Paid)
- Dashboard quick-access cards for each form type
- Sidebar nav "Reimbursements" link
- API endpoints at `/api/reimbursements/*` (authenticated)
- Public forms at `/forms/*` were **removed** — forms now live on main site

---

## CI/CD — Fully Working

Fixed on 2026-04-14: EC2 server's git credentials were updated to use a Personal Access Token. Both deploy directories (`~/AvantyCare-Web` for dev, `~/AvantyCare-Prod` for prod) now authenticate successfully.

| Project | Hosting | Trigger |
|---------|---------|---------|
| Broker Portal | AWS Amplify | Push to `main` on `Erichalfonso/AvantyBrokerPortal` |
| Main Site (dev env) | EC2 `~/AvantyCare-Web` | Push to `dev` on `AvantyCare-Project/AvantyCare-Web` |
| Main Site (prod) | EC2 `~/AvantyCare-Prod` | Push to `main` on `AvantyCare-Project/AvantyCare-Web` |

**⚠️ Security TODO**: The GitHub PAT used to fix the EC2 git credentials was exposed in chat. It should be revoked at https://github.com/settings/tokens and replaced. The new token needs to be set on both `~/AvantyCare-Web` and `~/AvantyCare-Prod` on the EC2 server.

---

## What's Left (from COMPLIANCE_AND_FEATURES.md)

### Immediate placeholders to fill in
- **Mileage Reimbursement** (Phase 2.3) — member self-drive reimbursement form
- **File a Complaint** — public complaint submission

### MVP Gaps
- Provider availability status (on-duty/off-duty)
- Trip file attachments / document uploads
- Self-service "forgot password" flow
- MFA / 2FA
- Pagination on providers, users, audit logs
- Service area enforcement in trip assignment API
- Credential expiry scheduled alerts
- SMS notifications

### Competitive features
- GPS tracking on trips
- Electronic trip verification (geo-tagged member e-signatures)
- Trip log PDF export
- Member self-service portal (mobile app)
- Claims/billing automation
- API integrations (TripMaster, RoutingBox)

See `COMPLIANCE_AND_FEATURES.md` for full roadmap and legal compliance details.

---

## Architecture Decision

**Public-facing forms live on the main site (Laravel), NOT the broker portal.**
Reasoning: Competitors like Alivi and Motive Care serve forms from their main website. Having forms on a separate subdomain feels disjointed and untrustworthy to providers. The broker portal is for internal dashboard/admin use only.

Portal is organized by user type (Members / Providers / Account Access) rather than by form type — this makes it scalable as we add more services (mileage reimbursement, complaints, member self-service, etc.).

---

## Key Files Reference

### Broker Portal (Next.js)
- `prisma/schema.prisma` — database models
- `src/app/api/reimbursements/` — authenticated reimbursement form API
- `src/app/dashboard/reimbursements/` — dashboard form management pages
- `src/app/dashboard/page.tsx` — main dashboard
- `src/components/sidebar.tsx` — sidebar navigation
- `amplify.yml` — Amplify build config

### Main Site (Laravel)
- `routes/web.php` — all routes including `/portal/*`
- `app/Http/Controllers/frontend/PortalController.php` — form controller with validation
- `app/Models/ReimbursementForm.php` + InvoiceLine/ServiceLine models
- `resources/views/frontend/portal/` — Blade templates (index, medicaid-trip, provider-invoice, cms-1500)
- `resources/views/frontend/include/header.blade.php` — nav with Portal dropdown
- `resources/views/frontend/home.blade.php` — homepage with "Reimbursement Forms" hero button
- `database/migrations/2026_04_13_170000_create_reimbursement_forms_table.php`
- `.github/workflows/deploy.yml` + `deploy_prod.yml` — CI/CD
- `deploy.sh` + `deploy_prod.sh` — server-side deploy scripts
