# MVP Backlog and Sprint 1 Kickoff

Last updated: 2026-06-10

Ticket format is Jira/Linear-ready:

- ID: `GCL-{number}`
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

Planning update: `GCL-008 Partner Referral` is no longer only a link-based
referral/commission feature. It should expand into the multi-sided partner
network described in `07-multi-sided-partner-network-plan.md`, where agencies,
individual agents, interpreters, and travel agencies can be assigned to cases,
offer non-medical services, and help shortlist compliant providers under
platform guardrails.

## MVP Epics

| ID | Type | Priority | Epic | Outcome |
|---|---|---:|---|---|
| GCL-001 | Epic | P0 | Regulatory Foundation | Eligibility, provider verification, content review, commission cap, auditability are enforceable |
| GCL-002 | Epic | P0 | Patient Lead and Intake | International patient can submit lead, pass eligibility, complete intake |
| GCL-003 | Epic | P0 | Provider Supply | Verified providers, doctors, packages, slots, and compliance docs are managed |
| GCL-004 | Epic | P0 | Case CRM | Coordinators can qualify, assign, message, and progress cases |
| GCL-005 | Epic | P0 | Matching Engine | Coordinator can run score-based matching and request quotes |
| GCL-006 | Epic | P0 | Quote and Booking | Provider can quote; patient can accept; booking/deposit can be tracked |
| GCL-007 | Epic | P1 | Settlement and Reporting | Provider/partner settlement and annual performance report can be exported |
| GCL-008 | Epic | P1 | Partner Referral | Partners can create links and track attributed leads/commissions |
| GCL-009 | Epic | P1 | Analytics and Attribution | Marketing funnel and source performance are measurable |
| GCL-010 | Epic | P1 | Portal UX | Admin/Provider portal screens support MVP workflows |
| GCL-043 | Epic | P1 | Partner-Assisted Care Network | Patients can request partner services and partners can support hospital shortlisting under compliance controls |

## P0 Stories

| ID | Epic | Type | Priority | Owner | Estimate | Title |
|---|---|---|---:|---|---:|---|
| GCL-011 | GCL-001 | Story | P0 | BE | 5 | Apply v1 PostgreSQL core schema migration |
| GCL-012 | GCL-001 | Story | P0 | BE | 5 | Implement RBAC middleware for patient/provider/coordinator/admin/partner |
| GCL-013 | GCL-001 | Story | P0 | BE | 3 | Implement audit log writer for sensitive actions |
| GCL-014 | GCL-001 | Story | P0 | BE | 3 | Implement commission cap validation service |
| GCL-015 | GCL-001 | Story | P0 | BE | 3 | Implement provider public-exposure guard |
| GCL-016 | GCL-001 | Story | P0 | BE | 3 | Implement content approval guard |
| GCL-017 | GCL-002 | Story | P0 | FE/BE | 5 | Create lead capture API and connect existing consultation form |
| GCL-018 | GCL-002 | Story | P0 | BE | 5 | Implement patient eligibility-check endpoint |
| GCL-019 | GCL-002 | Story | P0 | FE/BE | 5 | Build medical intake submission flow |
| GCL-020 | GCL-004 | Story | P0 | BE | 5 | Implement case state machine service |
| GCL-021 | GCL-004 | Story | P0 | FE | 8 | Build Admin Case Board MVP |
| GCL-022 | GCL-004 | Story | P0 | FE | 8 | Build Admin Case Detail MVP |
| GCL-023 | GCL-003 | Story | P0 | BE | 5 | Implement provider, doctor, and package CRUD APIs |
| GCL-024 | GCL-003 | Story | P0 | FE | 8 | Build Provider Compliance Documents screen |
| GCL-025 | GCL-005 | Story | P0 | BE | 8 | Implement matching engine v1 scoring |
| GCL-026 | GCL-005 | Story | P0 | FE | 5 | Build Matching Workbench MVP |
| GCL-027 | GCL-006 | Story | P0 | BE | 8 | Implement quote request and quote creation APIs |
| GCL-028 | GCL-006 | Story | P0 | FE | 5 | Build Provider Quote Composer MVP |
| GCL-029 | GCL-006 | Story | P0 | BE | 5 | Implement booking API with idempotency |
| GCL-030 | GCL-006 | Story | P0 | BE | 5 | Implement deposit payment log API with idempotency |
| GCL-031 | GCL-001 | Story | P0 | FE | 5 | Build Content Review Queue MVP |
| GCL-032 | GCL-007 | Story | P0 | BE | 3 | Build annual performance report export query |

## P1 Stories

| ID | Epic | Type | Priority | Owner | Estimate | Title |
|---|---|---|---:|---|---:|---|
| GCL-033 | GCL-006 | Story | P1 | FE | 5 | Build Booking and Payment Monitor |
| GCL-034 | GCL-007 | Story | P1 | BE | 5 | Implement settlement draft generation |
| GCL-035 | GCL-007 | Story | P1 | FE | 5 | Build Settlement screen |
| GCL-036 | GCL-008 | Story | P1 | BE | 5 | Implement partner referral link APIs |
| GCL-037 | GCL-008 | Story | P1 | FE | 5 | Build Partner Dashboard MVP |
| GCL-038 | GCL-009 | Story | P1 | BE/Data | 5 | Implement attribution event ingestion |
| GCL-039 | GCL-009 | Story | P1 | FE | 5 | Build Attribution report screen |
| GCL-040 | GCL-003 | Story | P1 | FE | 5 | Build Provider Package Management screen |
| GCL-041 | GCL-003 | Story | P1 | FE | 5 | Build Provider Availability screen |
| GCL-042 | GCL-004 | Story | P1 | BE | 5 | Implement external message adapter abstraction |
| GCL-044 | GCL-043 | Story | P1 | Product/Compliance | 3 | Define agency/agent/interpreter/travel partner compliance rules |
| GCL-045 | GCL-043 | Story | P1 | FE/BE | 5 | Add partner-support request fields to consultation intake |
| GCL-046 | GCL-043 | Story | P1 | BE | 5 | Add partner service request and case partner assignment model |
| GCL-047 | GCL-043 | Story | P1 | BE | 5 | Implement partner-scoped RBAC and audit rules |
| GCL-048 | GCL-043 | Story | P1 | FE | 5 | Build admin partner assignment MVP |
| GCL-049 | GCL-043 | Story | P1 | BE | 5 | Build partner verification and service catalog APIs |
| GCL-050 | GCL-043 | Story | P1 | FE | 8 | Build Partner Dashboard MVP |

## Story Details

### GCL-011 - Apply v1 PostgreSQL core schema migration

Owner: BE  
Estimate: 5  
Dependencies: none

Acceptance criteria:

- Migration creates all enum types, core tables, indexes, and triggers from `20260609_0001_core_marketplace_schema.sql`.
- Existing `public.inquiries` table remains usable.
- `quotes` rejects rows where `commission_rate > commission_cap_rate`.
- `bookings.idempotency_key` and `payments.idempotency_key` are unique.
- Migration can be run on a clean Supabase Postgres project.

### GCL-012 - Implement RBAC middleware

Owner: BE  
Estimate: 5  
Dependencies: GCL-011

Acceptance criteria:

- JWT claims map to `user_role`.
- Provider users are scoped to their provider IDs.
- Patient users can only read their own cases and quotes.
- Coordinator access is case-assignment scoped unless admin override is present.
- Forbidden actions return `ERR_FORBIDDEN`.

### GCL-013 - Implement audit log writer

Owner: BE  
Estimate: 3  
Dependencies: GCL-011, GCL-012

Acceptance criteria:

- Shared audit function writes actor, role, entity, action, before/after JSON, IP, user agent.
- Case status change, quote creation/update, commission check, booking change, content approval, and provider verification use the writer.
- Audit log records are append-only in API behavior.

### GCL-014 - Implement commission cap validation service

Owner: BE  
Estimate: 3  
Dependencies: GCL-011

Acceptance criteria:

- Service derives cap from active commission contract or provider facility type.
- Quote creation fails with `ERR_COMMISSION_CAP_EXCEEDED` when requested rate exceeds cap.
- Every pass/fail writes `commission_checks`.
- Tests cover clinic 30%, hospital/general 20%, tertiary 15%.

### GCL-015 - Implement provider public-exposure guard

Owner: BE  
Estimate: 3  
Dependencies: GCL-011

Acceptance criteria:

- Public provider list/detail only returns `active` providers with verified non-expired registration.
- Doctor profile requires approved profile status.
- Package requires approved content status and active flag.
- Blocked results are not silently mixed with public results.

### GCL-016 - Implement content approval guard

Owner: BE  
Estimate: 3  
Dependencies: GCL-011

Acceptance criteria:

- Procedure content, package, doctor profile, review, and ad content are hidden until approved.
- Rejected and revision-required content cannot be published.
- Admin approval/rejection writes audit logs.

### GCL-017 - Create lead capture API and connect existing consultation form

Owner: FE/BE  
Estimate: 5  
Dependencies: GCL-011, GCL-012

Acceptance criteria:

- `POST /v1/leads` creates `leads` and optional `patients`.
- Existing consultation form can submit to the new API.
- UTM, referral code, source path, and locale are captured.
- Missing consent returns `ERR_BAD_REQUEST`.

### GCL-018 - Implement patient eligibility-check endpoint

Owner: BE  
Estimate: 5  
Dependencies: GCL-011

Acceptance criteria:

- `POST /v1/patients/eligibility-check` matches OpenAPI schema.
- Korean health insurance holder, alien registration holder, and overseas Korean residence report holder return ineligible reasons.
- Eligible result updates patient eligibility when patient ID is provided.
- All checks write `patient_eligibility_checks`.

### GCL-019 - Build medical intake submission flow

Owner: FE/BE  
Estimate: 5  
Dependencies: GCL-018

Acceptance criteria:

- Intake captures desired procedure, request, history, medications, allergies, budget, currency, travel dates.
- Intake cannot be submitted without medical-info consent.
- Submitted intake moves case to `intake_completed` if allowed by state machine.
- Risk flags are stored as JSON.

### GCL-020 - Implement case state machine service

Owner: BE  
Estimate: 5  
Dependencies: GCL-011, GCL-013

Acceptance criteria:

- All transitions in `03-case-state-machine-rbac.md` are enforced.
- Invalid transitions return `ERR_STATE_CONFLICT`.
- Terminal case reopen requires admin override with reason.
- Every transition writes audit log.

### GCL-021 - Build Admin Case Board MVP

Owner: FE  
Estimate: 8  
Dependencies: GCL-020

Acceptance criteria:

- Board supports status, owner, source, language, country, procedure, priority filters.
- Cards show SLA timer, case ID, country, language, procedure, owner, priority.
- Assign owner and priority update actions are available based on RBAC.
- Invalid transition buttons are disabled.

### GCL-022 - Build Admin Case Detail MVP

Owner: FE  
Estimate: 8  
Dependencies: GCL-020

Acceptance criteria:

- Detail view shows patient summary, intake, messages, matches, quotes, bookings, payments, audit side panel.
- Sensitive medical fields are collapsed by default.
- Coordinator can run match and request quote when state allows it.
- Compliance blockers are visible.

### GCL-023 - Implement provider, doctor, and package CRUD APIs

Owner: BE  
Estimate: 5  
Dependencies: GCL-011, GCL-012

Acceptance criteria:

- Provider CRUD is admin-only.
- Provider users can create/update own draft doctor profiles and packages.
- Public exposure guards are not bypassed by CRUD status.
- Package edits create or update content review state.

### GCL-024 - Build Provider Compliance Documents screen

Owner: FE  
Estimate: 8  
Dependencies: GCL-023

Acceptance criteria:

- Provider can upload registration, insurance, specialist, and business registration document metadata.
- Expiry alerts show 60/30/7 day warnings.
- Rejected document shows reason and resubmit action.
- Public exposure disabled state is visible to provider.

### GCL-025 - Implement matching engine v1 scoring

Owner: BE  
Estimate: 8  
Dependencies: GCL-014, GCL-015

Acceptance criteria:

- Score formula uses clinical fit, availability, language, price fit, provider quality, response SLA.
- Compliance and over-commission blockers exclude provider or apply explicit penalty.
- Score breakdown is persisted in `case_matches`.
- API matches `POST /v1/admin/cases/{id}/match`.

### GCL-026 - Build Matching Workbench MVP

Owner: FE  
Estimate: 5  
Dependencies: GCL-025

Acceptance criteria:

- Coordinator can enter or confirm procedure, budget, language, travel dates.
- Results display rank and score breakdown.
- Excluded providers show reason.
- Coordinator can request quote from selected providers.

### GCL-027 - Implement quote request and quote creation APIs

Owner: BE  
Estimate: 8  
Dependencies: GCL-014, GCL-020

Acceptance criteria:

- Coordinator can create quote requests for verified providers.
- Provider can create quote from quote request.
- Quote creation runs commission cap validation.
- Quote response matches OpenAPI `QuoteCreateResponse`.
- Successful sent quote can move case to `quote_sent`.

### GCL-028 - Build Provider Quote Composer MVP

Owner: FE  
Estimate: 5  
Dependencies: GCL-027

Acceptance criteria:

- Provider can enter medical fee, non-medical fee, currency, commission rate, deposit, validity, notes.
- Cap rate is shown before submission.
- Required price-change disclaimer is present.
- Over-cap submission is blocked client-side and still validated server-side.

### GCL-029 - Implement booking API with idempotency

Owner: BE  
Estimate: 5  
Dependencies: GCL-020, GCL-027

Acceptance criteria:

- `POST /v1/bookings` requires `Idempotency-Key`.
- Same key and same payload returns same booking result.
- Same key and different payload returns `ERR_IDEMPOTENCY_CONFLICT`.
- Provider confirmation can move case to `booking_confirmed`.

### GCL-030 - Implement deposit payment log API with idempotency

Owner: BE  
Estimate: 5  
Dependencies: GCL-029

Acceptance criteria:

- `POST /v1/payments/deposit` requires `Idempotency-Key`.
- Paid or authorized deposit moves case to `deposit_paid`.
- Failed payment leaves case in `deposit_pending`.
- Payment status changes write audit logs.

### GCL-031 - Build Content Review Queue MVP

Owner: FE  
Estimate: 5  
Dependencies: GCL-016

Acceptance criteria:

- Admin can filter by content type, status, provider, risk flag.
- Admin can approve, reject, or request revision.
- Reject requires reason.
- Approved content becomes eligible for public exposure.

### GCL-032 - Build annual performance report export query

Owner: BE  
Estimate: 3  
Dependencies: GCL-011

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
| GCL-011 | BE | 5 | Core schema foundation |
| GCL-012 | BE | 5 | Role and scope enforcement |
| GCL-013 | BE | 3 | Auditability from the start |
| GCL-014 | BE | 3 | Commission cap is a hard legal/business guard |
| GCL-015 | BE | 3 | Verified-provider exposure gate |
| GCL-016 | BE | 3 | Content approval gate |
| GCL-018 | BE | 5 | Eligibility is the first patient compliance gate |
| GCL-020 | BE | 5 | Case workflow must be deterministic |
| GCL-017 | FE/BE | 5 | Connect existing lead form to new model if capacity allows |

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
