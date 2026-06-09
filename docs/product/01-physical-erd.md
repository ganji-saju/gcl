# Physical ERD - v1 Core Marketplace

Last updated: 2026-06-09

This ERD translates the PRD into PostgreSQL-level design. The executable DDL is in:

- `supabase/migrations/20260609_0001_core_marketplace_schema.sql`

The existing `public.inquiries` table remains as the current public lead-capture POC. The v1 production schema starts with `leads`, `patients`, and `cases`.

## Core Entity Groups

| Group | Tables | Purpose |
|---|---|---|
| Identity | `users`, `patients`, `provider_users` | Role-based accounts for patients, providers, coordinators, admins, partners |
| Demand | `leads`, `attribution_events`, `procedure_views`, `referral_links`, `partners` | Lead capture, source tracking, referral attribution |
| Procedure Catalog | `procedure_categories`, `procedures`, `procedure_content_pages` | Multilingual, compliance-reviewed procedure content |
| Provider Supply | `providers`, `provider_registrations`, `provider_departments`, `doctors`, `provider_procedures`, `treatment_packages`, `availability_slots` | Verified Korean medical providers, doctors, packages, availability |
| Case CRM | `cases`, `medical_intakes`, `patient_documents`, `messages`, `aftercare_tasks` | Coordinator workflow, medical intake, private documents, communication |
| Matching | `case_matches` | Score-based provider recommendation and exclusion reasons |
| Transaction | `quote_requests`, `quotes`, `bookings`, `payments`, `treatment_visits` | Quote, deposit, booking, visit result |
| Compliance | `content_reviews`, `commission_checks`, `audit_logs`, `annual_performance_reports` | Ad/content review, commission guardrails, auditability, statutory reporting data |
| Revenue | `commission_contracts`, `partner_commissions`, `settlements` | Provider contracts, partner payout, provider settlement |

## Relationship Summary

```text
users
  ├─ patients
  │   ├─ patient_eligibility_checks
  │   ├─ leads
  │   ├─ cases
  │   │   ├─ medical_intakes
  │   │   ├─ patient_documents
  │   │   ├─ messages
  │   │   ├─ case_matches
  │   │   ├─ quote_requests
  │   │   ├─ quotes
  │   │   ├─ bookings
  │   │   ├─ payments
  │   │   ├─ treatment_visits
  │   │   └─ aftercare_tasks
  │   └─ reviews
  │
  ├─ provider_users
  └─ audit_logs

providers
  ├─ provider_registrations
  ├─ provider_departments
  ├─ provider_users
  ├─ doctors
  ├─ provider_procedures
  ├─ treatment_packages
  ├─ availability_slots
  ├─ commission_contracts
  ├─ quote_requests
  ├─ quotes
  ├─ bookings
  ├─ treatment_visits
  ├─ settlements
  └─ annual_performance_reports

procedure_categories
  └─ procedures
      ├─ procedure_content_pages
      ├─ provider_procedures
      ├─ treatment_packages
      ├─ leads
      ├─ cases
      └─ medical_intakes

partners
  ├─ referral_links
  └─ partner_commissions
```

## Compliance-Critical Constraints

| Requirement | DB Enforcement |
|---|---|
| Provider commission cap by facility type | `facility_commission_cap(facility_type)` function and `providers.default_commission_cap_rate` check |
| Quote commission cap | `quotes` check: `commission_rate <= commission_cap_rate` |
| Commission audit trail | `commission_checks` records requested rate, cap rate, pass/fail, violation code |
| Provider registration verification | `provider_registrations.verified_status`, `expires_at`, `document_url` |
| Content cannot be treated as approved by default | `content_review_status` defaults to `draft` or `pending` |
| Medical and non-medical fees must be separated | `quotes.medical_fee`, `quotes.nonmedical_fee`, package fee split |
| Idempotent booking/payment operations | unique nullable `idempotency_key` on `bookings` and `payments` |
| Case and medical data changes auditability | `audit_logs` with actor, entity, before/after snapshots |
| Annual statutory performance extraction | `annual_performance_reports`, `treatment_visits`, `quotes`, `payments`, `settlements` |

## Public Exposure Rules

Public provider and package APIs must apply all of these guards:

| Entity | Required Conditions |
|---|---|
| Provider | `providers.active = true`, `medical_korea_registered = true`, at least one non-expired `provider_registrations.verified_status = 'verified'` |
| Doctor profile | `doctors.profile_status = 'approved'` |
| Procedure page | `procedure_content_pages.content_review_status = 'approved'`, `published_at is not null` |
| Treatment package | `treatment_packages.active = true`, `content_review_status = 'approved'` |
| Review | `reviews.consent_to_publish = true`, `content_review_status = 'approved'` |
| Sponsored placement | `case_matches.is_promoted = true` or equivalent public listing flag must be displayed |

## Matching Inputs

`case_matches.score_breakdown` stores a JSON object with these keys:

```json
{
  "clinical_fit": 92,
  "availability": 80,
  "language": 95,
  "price_fit": 82,
  "quality": 88,
  "response_sla": 76,
  "compliance_penalty": 0,
  "over_commission_penalty": 0
}
```

The API should exclude providers with registration expiry, missing content approval, or over-cap commission before ranking. Exclusions should still be persisted in `case_matches.excluded_reason` when useful for coordinator review.

## Notes For Implementation

- Store sensitive files in a private object-storage bucket; `patient_documents.file_url` should be an internal storage key or signed URL reference, not a permanent public URL.
- Use application-level authorization in addition to database RLS. Provider users should only access cases assigned to their provider.
- Add row-level security policies when Supabase Auth roles are finalized. This migration defines the relational core first.
- The current React app may continue writing to `public.inquiries`; a later migration can map accepted inquiries into `leads` and `cases`.
