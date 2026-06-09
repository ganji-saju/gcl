# Global Patient Hub Product Design Pack

Last updated: 2026-06-09

This folder contains the v1 product and implementation design for a Korean international patient acquisition platform.

## Documents

| Order | File | Purpose |
|---:|---|---|
| 1 | `01-physical-erd.md` | PostgreSQL physical ERD summary and compliance-critical data rules |
| 2 | `../api/openapi.yaml` | OpenAPI 3.1 API contract for public, provider, admin, and partner APIs |
| 3 | `02-admin-provider-portal-screens.md` | Admin and Provider Portal screen definitions |
| 4 | `03-case-state-machine-rbac.md` | Case state machine, blocking rules, RBAC matrix, audit requirements |
| 5 | `04-mvp-backlog-sprint-1.md` | Jira/Linear-ready MVP backlog and Sprint 1 kickoff |
| 6 | `05-validation-roadmap-japan-taiwan-skin-wedge.md` | Pre-development validation roadmap for Japan/Taiwan skin package wedge |

## Executable Schema

The PostgreSQL DDL is here:

- `../../supabase/migrations/20260609_0001_core_marketplace_schema.sql`

## Implementation Order

Before full implementation, complete the seven-gate validation roadmap in
`05-validation-roadmap-japan-taiwan-skin-wedge.md`.

1. Apply schema migration in a clean development Supabase project.
2. Implement RBAC, audit logging, eligibility check, provider exposure guard, content approval guard, and commission cap validation.
3. Generate API server/client types from `docs/api/openapi.yaml`.
4. Build Admin Case Board and Case Detail.
5. Build Provider Compliance Documents and Quote Composer.
6. Implement matching engine and quote/booking/deposit workflows.

## Production Caution

This pack encodes product and technical guardrails, but it is not a legal opinion. Before launch, validate foreign-patient eligibility logic, provider-registration requirements, medical-advertising handling, and commission-cap handling with qualified Korean healthcare regulatory counsel.
