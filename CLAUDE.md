# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VillageOS is a multi-tenant SaaS platform for village-level governance and administration. It digitizes operations for villages, panchayats, and NGOs — handling resident records, tax collection, expense tracking, and audit trails. Primary target is India (650,000+ villages), with bilingual Tamil/English support as a hard requirement.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express.js (primary), Spring Boot (secondary) |
| Frontend | React SPA, Tailwind CSS, i18next |
| Database | PostgreSQL (control DB + per-tenant DBs) |
| ORM | Sequelize |
| Auth | JWT (RFC 7519) — token contains `user_id`, `role_id`, `village_id` |
| Cache | Redis (permissions and config) |
| Encryption | AES-256 for credentials at rest, BCrypt/Argon2 for passwords |
| Logging | Winston (immutable audit logs) |
| Storage | S3-compatible object storage (tenant-isolated folders, signed URLs) |
| Infrastructure | Docker, Kubernetes, AWS/Azure |

## Architecture: Database-Per-Tenant (Silo Model)

Every village gets a **completely isolated PostgreSQL database**. This is non-negotiable — it's a government-grade security requirement, not a performance choice.

### Control Database (global, single instance)
Manages tenant discovery, routing, and subscription enforcement.

```
villages          — subdomain, encrypted db_connection_string, logo, theme_config, default_language
subscriptions     — village_id, plan_type (Free/Standard/Premium), expiry_date, is_active
global_permissions — module (TAX/FAMILY/EXPENSE), action (VIEW/CREATE/EDIT/DELETE), code (e.g. TAX_VIEW)
super_admins      — access_level, assigned_villages
audit_logs        — timestamp, action, user_id, village_id
```

### Tenant Database (per village)
```
roles             — role_name, is_custom, created_by
role_permissions  — role_id, permission_id
users             — role_id, email, password_hash, status
families          — house_no, street, ward
members           — family_id, name, age, relation (Head/Spouse/Child)
tax_ledger        — append-only; family_id, festival (Pongal/Deepavali), amount, collected_by
expenses          — category (Road/Temple/Water), amount, bill_url (S3), approved_by
tenant_audit_logs — action, user_id, entity_id, changes (JSON)
```

`tax_ledger` is append-only — never update or delete rows.

## Key Design Decisions

**Dynamic RBAC (not hard-coded roles):** Permissions are atomic codes (e.g., `FAMILY_DELETE`, `TAX_VIEW`) stored in the database. Roles are assigned permission sets at runtime. No code changes are required to create new roles or reassign permissions. A small hamlet may have 2 roles; a large panchayat may have 10+.

**White-label:** Logo, colors, fonts, domain, and default language are all data-driven via `villages.theme_config` and `villages.logo_url`. The same codebase serves government portals, NGOs, and private operators — never fork the codebase for a customer.

**Bilingual (Tamil/English):** i18next with JSON translation files. Language switching must work at runtime. Tamil support is non-negotiable; never design UI that degrades Tamil to a fallback.

**Audit trail immutability:** All financial and permission changes must be logged to `tenant_audit_logs` (and `audit_logs` in control DB for super-admin actions). Logs must never be modified or deleted.

## Middleware Pipeline (per request)

1. **Village Resolver** — identifies tenant from subdomain, loads DB connection string from control DB
2. **Auth Middleware** — validates JWT, extracts `user_id`, `role_id`, `village_id`
3. **Permission Middleware** — checks atomic permission codes against Redis cache (falls back to tenant DB)

## Modules

- **Family & Resident Management** — families, members, Unicode Tamil name support
- **Tax & Festival Collections** — Pongal, Deepavali; receipt generation, dues tracking
- **Expense Tracking** — bill uploads to S3, approval workflows, 5GB storage per Standard-tier village
- **Audit & Reporting** — financial statements, activity logs, exportable compliance reports

## Subscription Tiers

- **Free:** Basic records, single admin, read-only reports
- **Standard:** Full features (most common)
- **Premium:** Bulk/government, white-label, unlimited storage, advanced analytics

## Roadmap Context

- **Phase 1 (current):** Web platform (admin/staff portals), 50-village pilot
- **Phase 2:** Android/iOS mobile apps, UPI/payment gateway, SMS/WhatsApp receipts
- **Phase 3:** AI fraud detection, predictive analytics, government ERP integrations

Phase 2 must consider offline-first mobile — pilot villages have intermittent connectivity.

## Documentation Sources

Full product and technical specs are in `/Users/roycemelwina/Desktop/VillageAdministrationSaaS/`:
- `VillageAdministrationSaaS.docx` — product overview and business model
- `Technical Development Document.docx` — architecture, schema, security
- `VillageOS_InvestorPitchDeck.pdf` — pitch deck with market context
