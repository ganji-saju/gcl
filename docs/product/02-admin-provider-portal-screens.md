# Admin and Provider Portal Screen Definition

Last updated: 2026-06-09

Scope: MVP operations for a compliant international patient marketplace, coordinator CRM, and quote/booking engine.

## Information Architecture

```text
Admin / Coordinator Portal
  ├─ Dashboard
  ├─ Case CRM
  │   ├─ Case Board
  │   ├─ Case Detail
  │   ├─ Matching Workbench
  │   └─ Quote Review
  ├─ Provider Compliance
  ├─ Content Review
  ├─ Booking and Payment Monitor
  ├─ Settlement
  ├─ Annual Performance Report
  ├─ Attribution
  └─ Audit Logs

Provider Portal
  ├─ Dashboard
  ├─ Case Inbox
  ├─ Case Detail
  ├─ Quote Composer
  ├─ Availability
  ├─ Packages
  ├─ Compliance Documents
  ├─ Bookings
  ├─ Performance
  └─ Settings
```

## Shared UI Rules

| Rule | Requirement |
|---|---|
| Language | UI supports English first for providers, Korean for internal admins, with copy keys ready for i18n |
| Sensitive data | Medical details are hidden by default and require explicit case access |
| Audit | Any state change, quote change, commission change, booking change, or content approval writes an audit log |
| Compliance block | Unverified providers, expired registrations, over-cap commissions, and unapproved content show blocking states |
| SLA | Case and quote queues display elapsed time and due time |
| Sponsored content | Any promoted provider placement must be labeled |

## Admin / Coordinator Portal

### A1. Dashboard

| Item | Definition |
|---|---|
| Primary users | Admin, Coordinator |
| Purpose | Daily operational overview |
| Data | `cases`, `leads`, `quotes`, `bookings`, `payments`, `provider_registrations`, `content_reviews` |
| Components | KPI strip, SLA queue, compliance alerts, conversion funnel, recent paid cases |
| Key metrics | New leads, qualified cases, quote sent rate, deposit paid rate, average first response time, compliance blockers |
| Actions | Open case, assign coordinator, open compliance item, open content review |
| Empty state | "No open cases for the selected filters." |

### A2. Case Board

| Item | Definition |
|---|---|
| Primary users | Coordinator, Admin |
| Purpose | Manage cases by status and SLA |
| Data | `cases`, `patients`, `leads`, `medical_intakes`, `messages` |
| Views | Kanban by case status, table view, urgent queue |
| Filters | Status, owner, source, language, country, procedure, priority, last contacted, created date |
| Row/card fields | Case ID, patient country, preferred language, desired procedure, source, status, priority, SLA timer, owner |
| Actions | Assign owner, change priority, contact patient, open case detail, close lost |
| Validation | Manual status change must follow allowed state transition matrix |

### A3. Case Detail

| Item | Definition |
|---|---|
| Primary users | Coordinator, Admin |
| Purpose | Single case workspace |
| Data | `cases`, `patients`, `medical_intakes`, `patient_documents`, `messages`, `case_matches`, `quote_requests`, `quotes`, `bookings`, `payments`, `aftercare_tasks` |
| Layout | Header summary, timeline, patient/intake panel, message panel, matching/quote panel, booking/payment panel, audit side panel |
| Actions | Send message, add internal note, request missing intake info, run match, request quote, accept provider response, request booking, create aftercare task |
| Sensitive fields | Medical history, medications, allergies, uploaded documents |
| Validation | Medical data access requires coordinator/admin role and case assignment unless admin override |
| Compliance alerts | Ineligible patient, missing consent, provider not verified, expired quote, over-cap quote attempt |

### A4. Matching Workbench

| Item | Definition |
|---|---|
| Primary users | Coordinator, Admin |
| Purpose | Review and select provider matches |
| Data | `providers`, `provider_registrations`, `provider_procedures`, `doctors`, `availability_slots`, `commission_contracts`, `case_matches` |
| Inputs | Procedure, budget, currency, language, travel dates, risk flags |
| Output | Ranked providers with score breakdown |
| Columns | Rank, provider, doctor, clinical fit, availability, language, price fit, quality, response SLA, compliance status, promoted label |
| Actions | Re-run match, pin provider, exclude provider, request quote |
| Guardrails | Exclude unverified providers and providers with expired registration; show exclusion reason |

### A5. Quote Review

| Item | Definition |
|---|---|
| Primary users | Coordinator, Admin |
| Purpose | Inspect quotes before patient presentation |
| Data | `quote_requests`, `quotes`, `commission_checks`, `providers`, `commission_contracts` |
| Fields | Medical fee, non-medical fee, currency, commission rate, cap rate, deposit, validity, notes |
| Actions | Send to patient, request revision, cancel quote |
| Validation | `commission_rate <= commission_cap_rate`; quote must include disclaimer that final price can change after consultation |
| Blocking errors | `ERR_COMMISSION_CAP_EXCEEDED`, `ERR_PROVIDER_NOT_VERIFIED` |

### A6. Provider Compliance

| Item | Definition |
|---|---|
| Primary users | Admin |
| Purpose | Verify provider registration, insurance, specialist requirements |
| Data | `providers`, `provider_registrations`, `doctors`, `provider_departments` |
| Filters | Pending, verified, expiring within 30 days, expired, rejected, facility type |
| Actions | Approve, reject, request revision, deactivate provider |
| Required evidence | Registration number, registration document, issue/expiry date, insurance provider, coverage amount |
| Guardrails | Public exposure disabled unless verified and active |

### A7. Content Review

| Item | Definition |
|---|---|
| Primary users | Admin, Compliance reviewer |
| Purpose | Review medical advertising and public content |
| Data | `content_reviews`, `procedure_content_pages`, `treatment_packages`, `doctors`, `reviews` |
| Filters | Pending, risk flag, content type, provider, submitted date |
| Risk flags | Treatment guarantee, false/exaggerated claim, unsupported ranking, comparison claim, aggressive discount, testimonial risk, before/after risk |
| Actions | Approve, reject, request revision, add reviewer note |
| Guardrails | Public page/package/profile/review remains hidden until approved |

### A8. Booking and Payment Monitor

| Item | Definition |
|---|---|
| Primary users | Coordinator, Admin |
| Purpose | Track booking confirmation and deposit status |
| Data | `bookings`, `payments`, `quotes`, `cases` |
| Views | Upcoming bookings, deposit pending, failed payments, cancellation/refund queue |
| Actions | Confirm manually, reschedule, cancel, trigger refund workflow, add internal note |
| Validation | Booking creation and deposit payment require `Idempotency-Key` at API level |

### A9. Settlement

| Item | Definition |
|---|---|
| Primary users | Admin, Finance |
| Purpose | Calculate provider commission and partner payouts |
| Data | `quotes`, `payments`, `treatment_visits`, `partner_commissions`, `settlements` |
| Views | Monthly provider settlement, per-case settlement, partner commissions |
| Actions | Generate draft, approve, mark paid, dispute |
| Validation | Commission calculated only from medical fee or gross medical revenue, not bundled non-medical fees |

### A10. Annual Performance Report

| Item | Definition |
|---|---|
| Primary users | Admin, Finance, Compliance |
| Purpose | Export previous-year foreign patient acquisition results |
| Data | `annual_performance_reports`, `treatment_visits`, `providers`, `settlements` |
| Filters | Report year, provider, submission status |
| Actions | Generate, review, export CSV, mark submitted, mark correction required |
| Output columns | Provider ID, provider name, facility type, patient count, gross medical revenue, commission paid, currency |
| Deadline support | Highlight incomplete reports until the end of February reporting cycle |

### A11. Attribution

| Item | Definition |
|---|---|
| Primary users | Admin, Growth |
| Purpose | Analyze marketing performance |
| Data | `attribution_events`, `procedure_views`, `leads`, `cases`, `payments`, `partners` |
| Views | Source/campaign table, funnel chart, partner performance, country/procedure split |
| Metrics | Sessions, leads, qualified cases, quotes sent, deposits paid, paid cases, CAC, revenue |
| Actions | Export CSV, drill into source, drill into partner |

### A12. Audit Logs

| Item | Definition |
|---|---|
| Primary users | Admin, Compliance |
| Purpose | Trace sensitive changes |
| Data | `audit_logs` |
| Filters | Actor, entity, action, date, role, case ID |
| Actions | View before/after JSON, export logs |
| Guardrails | No edit/delete action in UI |

## Provider Portal

### P1. Dashboard

| Item | Definition |
|---|---|
| Primary users | Provider user |
| Purpose | Provider operational summary |
| Data | `quote_requests`, `quotes`, `bookings`, `provider_registrations`, `provider_procedures`, `treatment_packages` |
| Components | Open quote requests, booking schedule, SLA indicator, compliance alerts, monthly performance |
| Actions | Open quote request, upload compliance document, add slot, create package |

### P2. Case Inbox

| Item | Definition |
|---|---|
| Primary users | Provider user |
| Purpose | Receive matched/assigned cases |
| Data | `quote_requests`, `cases`, `medical_intakes` deidentified fields |
| Fields | Case ID, procedure, language, travel dates, budget range, risk flag summary, quote due time |
| Actions | Open detail, start quote, decline with reason |
| Privacy | Patient direct contact and sensitive identifiers hidden unless coordinator explicitly shares |

### P3. Provider Case Detail

| Item | Definition |
|---|---|
| Primary users | Provider user |
| Purpose | Review case information needed for quote |
| Data | `quote_requests`, `cases`, `medical_intakes`, `messages` provider-safe subset |
| Sections | Case summary, deidentified intake, travel window, coordinator notes, quote history |
| Actions | Ask coordinator question, create quote, update quote draft |
| Guardrails | Provider cannot see competing providers or platform commission calculation beyond their own cap/rate |

### P4. Quote Composer

| Item | Definition |
|---|---|
| Primary users | Provider user |
| Purpose | Submit compliant quote |
| Data | `quote_requests`, `quotes`, `commission_contracts` |
| Fields | Medical fee, non-medical fee, currency, commission rate, deposit, valid until, notes |
| Required copy | "Final price may change after in-person consultation." |
| Actions | Save draft, submit quote, revise draft |
| Validation | Medical fee and non-medical fee separated; commission rate must not exceed cap; valid-until required |

### P5. Availability

| Item | Definition |
|---|---|
| Primary users | Provider user |
| Purpose | Manage available slots for international patients |
| Data | `availability_slots`, `doctors`, `procedures` |
| Views | Calendar, list, bulk upload |
| Actions | Add slot, block slot, update language support, cancel slot |
| Validation | End time must be after start time; held slots show hold expiry |

### P6. Packages

| Item | Definition |
|---|---|
| Primary users | Provider user |
| Purpose | Register treatment packages for review |
| Data | `treatment_packages`, `procedures`, `content_reviews` |
| Fields | Package name, procedure, medical fee range, non-medical fee range, duration, included/excluded items |
| Actions | Create, edit draft, submit for review, archive |
| Guardrails | New or edited packages are not public until content review approval |

### P7. Compliance Documents

| Item | Definition |
|---|---|
| Primary users | Provider user |
| Purpose | Upload and maintain registration/insurance/specialist evidence |
| Data | `provider_registrations`, `patient_documents` for provider docs if reused, `doctors` |
| Required docs | Foreign patient provider registration, insurance/certificate, specialist evidence by department |
| Actions | Upload, replace, submit for verification |
| Alerts | Expiring within 60/30/7 days, expired, rejected |

### P8. Bookings

| Item | Definition |
|---|---|
| Primary users | Provider user |
| Purpose | Confirm and manage patient visits |
| Data | `bookings`, `quotes`, `cases`, `payments` deposit status |
| Fields | Scheduled time, visit type, case ID, deposit status, coordinator, status |
| Actions | Confirm, reschedule, mark completed, mark no-show |
| Guardrails | Cancellation reason required when cancelling confirmed booking |

### P9. Performance

| Item | Definition |
|---|---|
| Primary users | Provider manager |
| Purpose | Track lead-to-revenue performance |
| Data | `quote_requests`, `quotes`, `bookings`, `treatment_visits`, `settlements` |
| Metrics | Assigned cases, quote response rate, average response time, bookings, visits, gross medical revenue, estimated commission |
| Actions | Export CSV, filter by month/procedure |

### P10. Settings

| Item | Definition |
|---|---|
| Primary users | Provider manager |
| Purpose | Manage provider profile and users |
| Data | `providers`, `provider_users`, `provider_departments`, `doctors` |
| Actions | Invite user, deactivate user, edit display name, update languages, edit departments |
| Guardrails | Public-facing profile edits require content/compliance review if they affect medical claims |

## MVP Navigation Permissions

| Screen | Patient | Provider | Coordinator | Admin | Partner |
|---|---:|---:|---:|---:|---:|
| Admin Dashboard | No | No | Yes | Yes | No |
| Case Board | No | No | Yes | Yes | No |
| Case Detail | Own case only | Assigned provider subset | Assigned cases | All | No |
| Matching Workbench | No | No | Yes | Yes | No |
| Quote Review | Own quotes only | Own provider quotes | Assigned cases | All | No |
| Provider Compliance | No | Own provider docs | Read | Manage | No |
| Content Review | No | Own submissions | No | Manage | No |
| Settlement | No | Own provider summary | No | Manage | Own partner payout |
| Attribution | No | Own provider summary | Read | Manage | Own partner attribution |
| Audit Logs | No | No | Case scoped | All | No |
