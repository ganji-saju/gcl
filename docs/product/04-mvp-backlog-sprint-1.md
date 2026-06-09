# MVP Backlog and Sprint 1 Kickoff

Last updated: 2026-06-09

Ticket format is Jira/Linear-ready:

- ID: `GPH-{number}`
- Type: Epic, Story, Task, Spike
- Priority: P0, P1, P2
- Estimate: story points
- Owner: BE, FE, Product, Design, Compliance, Data

## Development Gate

Do not start the full Sprint 1 build until the validation roadmap in
`05-validation-roadmap-japan-taiwan-skin-wedge.md` reaches Gate 7:

- Legal operating structure is confirmed.
- Japan/Taiwan skin-package wedge is selected.
- 10 registered Gangnam providers are secured.
- EN/JP landing pages have produced measurable leads.
- 100 leads have been manually matched.
- Quote-to-deposit conversion is high enough to justify product buildout.

The tickets below remain the implementation backlog once those validation gates pass.

## MVP Epics

| ID | Type | Priority | Epic | Outcome |
|---|---|---:|---|---|
| GPH-001 | Epic | P0 | Regulatory Foundation | Eligibility, provider verification, content review, commission cap, auditability are enforceable |
| GPH-002 | Epic | P0 | Patient Lead and Intake | International patient can submit lead, pass eligibility, complete intake |
| GPH-003 | Epic | P0 | Provider Supply | Verified providers, doctors, packages, slots, and compliance docs are managed |
| GPH-004 | Epic | P0 | Case CRM | Coordinators can qualify, assign, message, and progress cases |
| GPH-005 | Epic | P0 | Matching Engine | Coordinator can run score-based matching and request quotes |
| GPH-006 | Epic | P0 | Quote and Booking | Provider can quote; patient can accept; booking/deposit can be tracked |
| GPH-007 | Epic | P1 | Settlement and Reporting | Provider/partner settlement and annual performance report can be exported |
| GPH-008 | Epic | P1 | Partner Referral | Partners can create links and track attributed leads/commissions |
| GPH-009 | Epic | P1 | Analytics and Attribution | Marketing funnel and source performance are measurable |
| GPH-010 | Epic | P1 | Portal UX | Admin/Provider portal screens support MVP workflows |

## P0 Stories

| ID | Epic | Type | Priority | Owner | Estimate | Title |
|---|---|---|---:|---|---:|---|
| GPH-011 | GPH-001 | Story | P0 | BE | 5 | Apply v1 PostgreSQL core schema migration |
| GPH-012 | GPH-001 | Story | P0 | BE | 5 | Implement RBAC middleware for patient/provider/coordinator/admin/partner |
| GPH-013 | GPH-001 | Story | P0 | BE | 3 | Implement audit log writer for sensitive actions |
| GPH-014 | GPH-001 | Story | P0 | BE | 3 | Implement commission cap validation service |
| GPH-015 | GPH-001 | Story | P0 | BE | 3 | Implement provider public-exposure guard |
| GPH-016 | GPH-001 | Story | P0 | BE | 3 | Implement content approval guard |
| GPH-017 | GPH-002 | Story | P0 | FE/BE | 5 | Create lead capture API and connect existing consultation form |
| GPH-018 | GPH-002 | Story | P0 | BE | 5 | Implement patient eligibility-check endpoint |
| GPH-019 | GPH-002 | Story | P0 | FE/BE | 5 | Build medical intake submission flow |
| GPH-020 | GPH-004 | Story | P0 | BE | 5 | Implement case state machine service |
| GPH-021 | GPH-004 | Story | P0 | FE | 8 | Build Admin Case Board MVP |
| GPH-022 | GPH-004 | Story | P0 | FE | 8 | Build Admin Case Detail MVP |
| GPH-023 | GPH-003 | Story | P0 | BE | 5 | Implement provider, doctor, and package CRUD APIs |
| GPH-024 | GPH-003 | Story | P0 | FE | 8 | Build Provider Compliance Documents screen |
| GPH-025 | GPH-005 | Story | P0 | BE | 8 | Implement matching engine v1 scoring |
| GPH-026 | GPH-005 | Story | P0 | FE | 5 | Build Matching Workbench MVP |
| GPH-027 | GPH-006 | Story | P0 | BE | 8 | Implement quote request and quote creation APIs |
| GPH-028 | GPH-006 | Story | P0 | FE | 5 | Build Provider Quote Composer MVP |
| GPH-029 | GPH-006 | Story | P0 | BE | 5 | Implement booking API with idempotency |
| GPH-030 | GPH-006 | Story | P0 | BE | 5 | Implement deposit payment log API with idempotency |
| GPH-031 | GPH-001 | Story | P0 | FE | 5 | Build Content Review Queue MVP |
| GPH-032 | GPH-007 | Story | P0 | BE | 3 | Build annual performance report export query |

## P1 Stories

| ID | Epic | Type | Priority | Owner | Estimate | Title |
|---|---|---|---:|---|---:|---|
| GPH-033 | GPH-006 | Story | P1 | FE | 5 | Build Booking and Payment Monitor |
| GPH-034 | GPH-007 | Story | P1 | BE | 5 | Implement settlement draft generation |
| GPH-035 | GPH-007 | Story | P1 | FE | 5 | Build Settlement screen |
| GPH-036 | GPH-008 | Story | P1 | BE | 5 | Implement partner referral link APIs |
| GPH-037 | GPH-008 | Story | P1 | FE | 5 | Build Partner Dashboard MVP |
| GPH-038 | GPH-009 | Story | P1 | BE/Data | 5 | Implement attribution event ingestion |
| GPH-039 | GPH-009 | Story | P1 | FE | 5 | Build Attribution report screen |
| GPH-040 | GPH-003 | Story | P1 | FE | 5 | Build Provider Package Management screen |
| GPH-041 | GPH-003 | Story | P1 | FE | 5 | Build Provider Availability screen |
| GPH-042 | GPH-004 | Story | P1 | BE | 5 | Implement external message adapter abstraction |

## Story Details

### GPH-011 - Apply v1 PostgreSQL core schema migration

Owner: BE  
Estimate: 5  
Dependencies: none

Acceptance criteria:

- Migration creates all enum types, core tables, indexes, and triggers from `20260609_0001_core_marketplace_schema.sql`.
- Existing `public.inquiries` table remains usable.
- `quotes` rejects rows where `commission_rate > commission_cap_rate`.
- `bookings.idempotency_key` and `payments.idempotency_key` are unique.
- Migration can be run on a clean Supabase Postgres project.

### GPH-012 - Implement RBAC middleware

Owner: BE  
Estimate: 5  
Dependencies: GPH-011

Acceptance criteria:

- JWT claims map to `user_role`.
- Provider users are scoped to their provider IDs.
- Patient users can only read their own cases and quotes.
- Coordinator access is case-assignment scoped unless admin override is present.
- Forbidden actions return `ERR_FORBIDDEN`.

### GPH-013 - Implement audit log writer

Owner: BE  
Estimate: 3  
Dependencies: GPH-011, GPH-012

Acceptance criteria:

- Shared audit function writes actor, role, entity, action, before/after JSON, IP, user agent.
- Case status change, quote creation/update, commission check, booking change, content approval, and provider verification use the writer.
- Audit log records are append-only in API behavior.

### GPH-014 - Implement commission cap validation service

Owner: BE  
Estimate: 3  
Dependencies: GPH-011

Acceptance criteria:

- Service derives cap from active commission contract or provider facility type.
- Quote creation fails with `ERR_COMMISSION_CAP_EXCEEDED` when requested rate exceeds cap.
- Every pass/fail writes `commission_checks`.
- Tests cover clinic 30%, hospital/general 20%, tertiary 15%.

### GPH-015 - Implement provider public-exposure guard

Owner: BE  
Estimate: 3  
Dependencies: GPH-011

Acceptance criteria:

- Public provider list/detail only returns `active` providers with verified non-expired registration.
- Doctor profile requires approved profile status.
- Package requires approved content status and active flag.
- Blocked results are not silently mixed with public results.

### GPH-016 - Implement content approval guard

Owner: BE  
Estimate: 3  
Dependencies: GPH-011

Acceptance criteria:

- Procedure content, package, doctor profile, review, and ad content are hidden until approved.
- Rejected and revision-required content cannot be published.
- Admin approval/rejection writes audit logs.

### GPH-017 - Create lead capture API and connect existing consultation form

Owner: FE/BE  
Estimate: 5  
Dependencies: GPH-011, GPH-012

Acceptance criteria:

- `POST /v1/leads` creates `leads` and optional `patients`.
- Existing consultation form can submit to the new API.
- UTM, referral code, source path, and locale are captured.
- Missing consent returns `ERR_BAD_REQUEST`.

### GPH-018 - Implement patient eligibility-check endpoint

Owner: BE  
Estimate: 5  
Dependencies: GPH-011

Acceptance criteria:

- `POST /v1/patients/eligibility-check` matches OpenAPI schema.
- Korean health insurance holder, alien registration holder, and overseas Korean residence report holder return ineligible reasons.
- Eligible result updates patient eligibility when patient ID is provided.
- All checks write `patient_eligibility_checks`.

### GPH-019 - Build medical intake submission flow

Owner: FE/BE  
Estimate: 5  
Dependencies: GPH-018

Acceptance criteria:

- Intake captures desired procedure, request, history, medications, allergies, budget, currency, travel dates.
- Intake cannot be submitted without medical-info consent.
- Submitted intake moves case to `intake_completed` if allowed by state machine.
- Risk flags are stored as JSON.

### GPH-020 - Implement case state machine service

Owner: BE  
Estimate: 5  
Dependencies: GPH-011, GPH-013

Acceptance criteria:

- All transitions in `03-case-state-machine-rbac.md` are enforced.
- Invalid transitions return `ERR_STATE_CONFLICT`.
- Terminal case reopen requires admin override with reason.
- Every transition writes audit log.

### GPH-021 - Build Admin Case Board MVP

Owner: FE  
Estimate: 8  
Dependencies: GPH-020

Acceptance criteria:

- Board supports status, owner, source, language, country, procedure, priority filters.
- Cards show SLA timer, case ID, country, language, procedure, owner, priority.
- Assign owner and priority update actions are available based on RBAC.
- Invalid transition buttons are disabled.

### GPH-022 - Build Admin Case Detail MVP

Owner: FE  
Estimate: 8  
Dependencies: GPH-020

Acceptance criteria:

- Detail view shows patient summary, intake, messages, matches, quotes, bookings, payments, audit side panel.
- Sensitive medical fields are collapsed by default.
- Coordinator can run match and request quote when state allows it.
- Compliance blockers are visible.

### GPH-023 - Implement provider, doctor, and package CRUD APIs

Owner: BE  
Estimate: 5  
Dependencies: GPH-011, GPH-012

Acceptance criteria:

- Provider CRUD is admin-only.
- Provider users can create/update own draft doctor profiles and packages.
- Public exposure guards are not bypassed by CRUD status.
- Package edits create or update content review state.

### GPH-024 - Build Provider Compliance Documents screen

Owner: FE  
Estimate: 8  
Dependencies: GPH-023

Acceptance criteria:

- Provider can upload registration, insurance, specialist, and business registration document metadata.
- Expiry alerts show 60/30/7 day warnings.
- Rejected document shows reason and resubmit action.
- Public exposure disabled state is visible to provider.

### GPH-025 - Implement matching engine v1 scoring

Owner: BE  
Estimate: 8  
Dependencies: GPH-014, GPH-015

Acceptance criteria:

- Score formula uses clinical fit, availability, language, price fit, provider quality, response SLA.
- Compliance and over-commission blockers exclude provider or apply explicit penalty.
- Score breakdown is persisted in `case_matches`.
- API matches `POST /v1/admin/cases/{id}/match`.

### GPH-026 - Build Matching Workbench MVP

Owner: FE  
Estimate: 5  
Dependencies: GPH-025

Acceptance criteria:

- Coordinator can enter or confirm procedure, budget, language, travel dates.
- Results display rank and score breakdown.
- Excluded providers show reason.
- Coordinator can request quote from selected providers.

### GPH-027 - Implement quote request and quote creation APIs

Owner: BE  
Estimate: 8  
Dependencies: GPH-014, GPH-020

Acceptance criteria:

- Coordinator can create quote requests for verified providers.
- Provider can create quote from quote request.
- Quote creation runs commission cap validation.
- Quote response matches OpenAPI `QuoteCreateResponse`.
- Successful sent quote can move case to `quote_sent`.

### GPH-028 - Build Provider Quote Composer MVP

Owner: FE  
Estimate: 5  
Dependencies: GPH-027

Acceptance criteria:

- Provider can enter medical fee, non-medical fee, currency, commission rate, deposit, validity, notes.
- Cap rate is shown before submission.
- Required price-change disclaimer is present.
- Over-cap submission is blocked client-side and still validated server-side.

### GPH-029 - Implement booking API with idempotency

Owner: BE  
Estimate: 5  
Dependencies: GPH-020, GPH-027

Acceptance criteria:

- `POST /v1/bookings` requires `Idempotency-Key`.
- Same key and same payload returns same booking result.
- Same key and different payload returns `ERR_IDEMPOTENCY_CONFLICT`.
- Provider confirmation can move case to `booking_confirmed`.

### GPH-030 - Implement deposit payment log API with idempotency

Owner: BE  
Estimate: 5  
Dependencies: GPH-029

Acceptance criteria:

- `POST /v1/payments/deposit` requires `Idempotency-Key`.
- Paid or authorized deposit moves case to `deposit_paid`.
- Failed payment leaves case in `deposit_pending`.
- Payment status changes write audit logs.

### GPH-031 - Build Content Review Queue MVP

Owner: FE  
Estimate: 5  
Dependencies: GPH-016

Acceptance criteria:

- Admin can filter by content type, status, provider, risk flag.
- Admin can approve, reject, or request revision.
- Reject requires reason.
- Approved content becomes eligible for public exposure.

### GPH-032 - Build annual performance report export query

Owner: BE  
Estimate: 3  
Dependencies: GPH-011

Acceptance criteria:

- Query aggregates patient count, gross medical revenue, commission paid by provider and year.
- API supports JSON and CSV.
- Export snapshot can be stored in `annual_performance_reports.export_snapshot`.

## Sprint 1 Kickoff

Duration: 2 weeks  
Sprint goal: establish the production-grade backend contract and compliance gates needed before full portal development.

### Sprint 1 Scope

| Ticket | Owner | Estimate | Reason |
|---|---|---:|---|
| GPH-011 | BE | 5 | Core schema foundation |
| GPH-012 | BE | 5 | Role and scope enforcement |
| GPH-013 | BE | 3 | Auditability from the start |
| GPH-014 | BE | 3 | Commission cap is a hard legal/business guard |
| GPH-015 | BE | 3 | Verified-provider exposure gate |
| GPH-016 | BE | 3 | Content approval gate |
| GPH-018 | BE | 5 | Eligibility is the first patient compliance gate |
| GPH-020 | BE | 5 | Case workflow must be deterministic |
| GPH-017 | FE/BE | 5 | Connect existing lead form to new model if capacity allows |

Total: 37 points

### Sprint 1 Definition of Done

- Migration can be applied to a clean Supabase Postgres project.
- OpenAPI paths for Sprint 1 endpoints are implemented or stubbed with contract tests.
- RBAC middleware blocks at least patient/provider/admin scope violations.
- Commission cap validation has unit tests for all facility types.
- Eligibility check writes decision records and returns deterministic reasons.
- Case transition service rejects invalid transitions.
- Audit logs are written for state changes and compliance decisions.

### Sprint 1 Day 1 Tasks

| Task | Owner | Output |
|---|---|---|
| Confirm backend runtime | Tech lead | NestJS/FastAPI/Supabase Edge Function decision |
| Apply migration in dev DB | BE | Migration result and fixes |
| Generate API types from OpenAPI | BE/FE | Shared request/response types |
| Create RBAC test fixtures | BE | patient, provider, coordinator, admin, partner users |
| Define seed data | BE/Product | 3 providers, 5 procedures, 2 partners, 5 cases |
| Wire existing consultation form plan | FE | Mapping from current form to `POST /v1/leads` |

### Sprint 1 Risks

| Risk | Mitigation |
|---|---|
| Supabase RLS and application RBAC drift | Keep app RBAC first, add RLS policies after auth model is finalized |
| Legal interpretation gaps | Keep compliance rules configurable and require legal review before production launch |
| Quote cap data mismatch | Store both requested rate and cap rate on quote and commission check |
| Medical data overexposure | Default to deidentified provider case detail and audit all staff access |

### Post-Sprint 1 Candidate Scope

Sprint 2 should focus on Admin Case Board, Case Detail, Matching Workbench, Provider Quote Composer, and Provider Compliance Documents screen.
