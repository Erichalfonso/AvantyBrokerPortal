# Avanty Care Project Status — April 13, 2026

## Overview
Two separate codebases:
- **Broker Portal** (Next.js) — `portal.avantycare.com` — repo: `github.com/Erichalfonso/AvantyBrokerPortal`
- **Main Site** (Laravel 10) — `avantycare.com` — repo: `github.com/AvantyCare-Project/AvantyCare-Web`, cloned at `C:\Users\erich\AvantyCare-Web`

---

## What Was Built Today

### 1. Reimbursement Forms — Broker Portal (DEPLOYED via Amplify)
Three fillable forms (Medicaid Trip, Provider Invoice, CMS-1500) with:
- **Dashboard pages** (behind login): `/dashboard/reimbursements/*`
- **Public pages** (no login): `/forms/*` — these exist but may be removed since forms are moving to the main site
- **API endpoints**: `/api/reimbursements/*` and `/api/public/reimbursements/*`
- **Database**: `ReimbursementForm`, `CMS1500ServiceLine`, `ProviderInvoiceLine` models (Prisma/PostgreSQL)
- **Status workflow**: Draft → Submitted → Under Review → Approved/Denied → Paid
- **Dashboard integration**: Quick-access cards on main dashboard, sidebar nav link
- **Commit**: `be6eef1` + `d6a61d2` on `main`, deployed via AWS Amplify

### 2. Reimbursement Forms — Main Site (COMMITTED, NOT DEPLOYED)
Same three forms rebuilt natively in Laravel, matching the existing site design:
- **Portal landing page**: `avantycare.com/portal` with 3 form cards
- **Form pages**: `/portal/medicaid-trip`, `/portal/provider-invoice`, `/portal/cms-1500`
- **"Portal" dropdown** added to header nav (desktop + mobile) with submenu links
- **"Reimbursement Forms" button** in homepage hero section, links to `/portal`
- **Controller**: `app/Http/Controllers/frontend/PortalController.php`
- **Migration**: `2026_04_13_170000_create_reimbursement_forms_table.php` (3 tables)
- **Models**: `ReimbursementForm`, `ReimbursementInvoiceLine`, `ReimbursementServiceLine`
- **Views**: `resources/views/frontend/portal/` (4 Blade templates)
- **Routes**: `routes/web.php` — `/portal/*` prefix group
- **Commit**: `13812ef` on `dev` branch — **NOT pushed yet** because deploy is broken

---

## Blocking Issue: Main Site CI/CD Deploy Failure

**Problem**: GitHub Actions workflow (`deploy.yml`) SSHes into EC2 (`ubuntu@52.90.163.106`) and runs `deploy.sh`, which does `git fetch origin`. This fails with "Repository not found" — the EC2 server's SSH/git credentials have lost access to the GitHub repo.

**Last successful dev deploy**: June 30, 2025 (10+ months ago)

**To fix**:
1. SSH into EC2 at `52.90.163.106` (need the `avatycare_Keypair` .pem file — not on this machine)
2. Check `cd ~/AvantyCare-Web && git remote -v` to see the remote URL
3. Either:
   - Add a new deploy key to the GitHub repo (`Settings > Deploy Keys`) using the EC2's SSH public key
   - Or update the remote URL to use a personal access token: `git remote set-url origin https://<TOKEN>@github.com/AvantyCare-Project/AvantyCare-Web.git`
4. Test by running `git fetch origin` on the EC2
5. Once fixed, push `dev` branch and CI/CD will auto-deploy

**Alternative**: Connect to EC2 via AWS Console (Session Manager or EC2 Instance Connect) if the .pem key is unavailable.

---

## What's Left To Do

### Immediate
- [ ] Fix EC2 deploy key / SSH access for main site
- [ ] Push `dev` branch of AvantyCare-Web to trigger deploy
- [ ] Verify forms work on avantycare.com/portal after deploy
- [ ] Run `php artisan migrate` on EC2 (deploy.sh does this automatically)

### Cleanup (Later)
- [ ] Decide whether to remove public forms from broker portal (`/forms/*`) since they now live on main site
- [ ] Decide whether to keep the "Reimbursement Forms" cards on broker portal dashboard

### MVP Gaps Still Remaining (from audit)
- [ ] Provider availability status (on-duty/off-duty)
- [ ] Trip file attachments / document uploads
- [ ] Self-service "forgot password" flow
- [ ] MFA / 2FA
- [ ] Pagination on providers, users, audit logs
- [ ] Service area enforcement in trip assignment API
- [ ] Credential expiry scheduled alerts
- [ ] SMS notifications

---

## CI/CD Setup

| Project | Hosting | CI/CD | Trigger |
|---------|---------|-------|---------|
| Broker Portal | AWS Amplify | Amplify auto-build | Push to `main` on `Erichalfonso/AvantyBrokerPortal` |
| Main Site (dev) | EC2 (`52.90.163.106`) | GitHub Actions → SSH → `deploy.sh` | Push to `dev` on `AvantyCare-Project/AvantyCare-Web` |
| Main Site (prod) | EC2 | GitHub Actions → `deploy_prod.yml` | Push to `main` on `AvantyCare-Project/AvantyCare-Web` |

---

## Key Files Reference

### Broker Portal (Next.js)
- `prisma/schema.prisma` — all database models
- `src/app/api/reimbursements/` — authenticated form API
- `src/app/api/public/reimbursements/` — public form API
- `src/app/dashboard/reimbursements/` — dashboard form pages
- `src/app/forms/` — public form pages (may remove)
- `src/app/dashboard/page.tsx` — main dashboard with quick-access cards
- `src/components/sidebar.tsx` — sidebar navigation
- `amplify.yml` — Amplify build config

### Main Site (Laravel)
- `routes/web.php` — all routes including `/portal/*`
- `app/Http/Controllers/frontend/PortalController.php` — form controller
- `app/Models/ReimbursementForm.php` — main form model
- `resources/views/frontend/portal/` — Blade templates for forms
- `resources/views/frontend/include/header.blade.php` — nav with Portal dropdown
- `resources/views/frontend/home.blade.php` — homepage with hero button
- `database/migrations/2026_04_13_170000_create_reimbursement_forms_table.php`
- `.github/workflows/deploy.yml` — CI/CD for dev
- `deploy.sh` — server-side deploy script
