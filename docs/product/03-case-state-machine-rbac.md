# Case State Machine and RBAC Matrix

Last updated: 2026-06-09

## Case Status Values

| Status | Meaning | Owner |
|---|---|---|
| `new` | Lead or patient case created, not yet qualified | Coordinator |
| `qualified` | Patient appears eligible and commercially relevant | Coordinator |
| `intake_completed` | Intake submitted with required medical/travel/budget fields | Patient, Coordinator |
| `matching_ready` | Intake reviewed and matching inputs are complete | Coordinator |
| `matched` | One or more providers ranked or excluded with reasons | Coordinator |
| `quote_requested` | Quote request sent to at least one provider | Coordinator, Provider |
| `quote_sent` | At least one compliant quote sent to patient | Coordinator |
| `deposit_pending` | Patient accepted quote and payment is pending | Patient, Coordinator |
| `deposit_paid` | Deposit payment is paid or authorized | Patient, Coordinator |
| `booking_confirmed` | Provider confirmed booking schedule | Provider, Coordinator |
| `visited` | Patient visited provider | Provider, Coordinator |
| `treated` | Treatment/procedure/checkup completed and outcome logged | Provider, Coordinator |
| `aftercare` | Post-visit follow-up is active | Coordinator |
| `closed_won` | Case completed and commercially won | Admin/Coordinator |
| `closed_lost` | Case closed without treatment or revenue | Admin/Coordinator |

## Allowed State Transitions

| From | To | Actor | Required Guard |
|---|---|---|---|
| `new` | `qualified` | Coordinator, Admin | Eligibility check passed or coordinator override with reason |
| `new` | `closed_lost` | Coordinator, Admin | Lost reason required |
| `qualified` | `intake_completed` | Patient, Coordinator | `medical_intakes.status = submitted`, medical-info consent true |
| `qualified` | `closed_lost` | Coordinator, Admin | Lost reason required |
| `intake_completed` | `matching_ready` | Coordinator, Admin | Intake reviewed; procedure, budget, language, travel dates available |
| `matching_ready` | `matched` | Coordinator, Admin | Matching run persisted to `case_matches` |
| `matched` | `quote_requested` | Coordinator, Admin | Quote request created for verified provider only |
| `quote_requested` | `quote_sent` | Coordinator, Admin | Quote exists, quote status sent, commission cap check passed |
| `quote_sent` | `deposit_pending` | Patient, Coordinator | Patient accepts non-expired quote |
| `deposit_pending` | `deposit_paid` | Payment service, Admin | Deposit payment status `paid` or `authorized` |
| `deposit_paid` | `booking_confirmed` | Provider, Coordinator | Booking status `confirmed` |
| `booking_confirmed` | `visited` | Provider, Coordinator | Visit record created |
| `visited` | `treated` | Provider, Coordinator | Treatment outcome logged |
| `treated` | `aftercare` | Coordinator, Admin | Aftercare task created |
| `aftercare` | `closed_won` | Coordinator, Admin | Required aftercare tasks complete or waived with reason |
| Any non-terminal | `closed_lost` | Coordinator, Admin | Lost reason required |

Terminal statuses:

- `closed_won`
- `closed_lost`

Terminal cases cannot be reopened except by admin override. Admin override must write an `audit_logs` entry with reason.

## Blocking Rules

| Rule | Blocks |
|---|---|
| Patient not eligible | `new -> qualified`, intake submission, quote acceptance |
| Medical-info consent missing | Intake creation and medical data storage |
| Provider not verified | Public exposure, matching inclusion, quote request |
| Provider registration expired | Matching inclusion, quote request, booking confirmation |
| Package/content not approved | Public exposure and patient-facing quote package display |
| Quote commission above cap | Quote creation and `quote_requested -> quote_sent` |
| Quote expired | Quote acceptance |
| Deposit payment not paid/authorized | `deposit_pending -> deposit_paid` |
| Booking not confirmed | `deposit_paid -> booking_confirmed` |

## Side Effects By Transition

| Transition | Side Effects |
|---|---|
| `new -> qualified` | Update `leads.status = qualified`, write audit log |
| `qualified -> intake_completed` | Create/update `medical_intakes`, update `patients.consent_medical_info`, write audit log |
| `intake_completed -> matching_ready` | Set case priority based on budget/travel/risk flags |
| `matching_ready -> matched` | Insert `case_matches`, persist score breakdown and exclusions |
| `matched -> quote_requested` | Insert `quote_requests`, start provider SLA timer |
| `quote_requested -> quote_sent` | Insert `quotes`, insert `commission_checks`, send patient notification |
| `quote_sent -> deposit_pending` | Mark quote accepted, create pending booking or payment intent if needed |
| `deposit_pending -> deposit_paid` | Insert/update `payments`, notify provider/coordinator |
| `deposit_paid -> booking_confirmed` | Update `bookings`, hold availability slot |
| `booking_confirmed -> visited` | Insert `treatment_visits` preliminary record |
| `visited -> treated` | Update visit outcome and gross medical revenue |
| `treated -> aftercare` | Create follow-up tasks and review request schedule |
| `aftercare -> closed_won` | Generate settlement basis and annual report source data |

## RBAC Roles

| Role | Description |
|---|---|
| `patient` | Overseas patient or authorized companion managing own case |
| `provider` | Hospital/clinic staff user scoped to one or more providers |
| `coordinator` | Platform staff handling patient communication and case conversion |
| `admin` | Platform administrator with compliance, finance, and override permissions |
| `partner` | Referral partner, travel agency, influencer, overseas agency |

## RBAC Matrix

Legend:

- `N`: No access
- `R`: Read
- `C`: Create
- `U`: Update
- `A`: Approve/admin action
- `O`: Own or scoped only

| Resource / Action | Patient | Provider | Coordinator | Admin | Partner |
|---|---:|---:|---:|---:|---:|
| Public procedures/providers | R | R | R | R | R |
| Lead create | C | N | C | C | C |
| Lead list | N | N | R | R | O |
| Eligibility check | C/O | N | C/U | C/U | C |
| Patient profile | O/RU | N | R/U scoped | R/U | N |
| Medical intake | O/CU | R scoped deidentified | R/U scoped | R/U | N |
| Patient documents | O/C | N by default | R/U scoped | R/U | N |
| Case list | O/R | R scoped | R scoped | R | O summary |
| Case status update | N | U scoped limited | U scoped | U/A | N |
| Assign coordinator | N | N | N | A | N |
| Matching run | N | N | C/U scoped | C/U/A | N |
| Match result read | N | N | R scoped | R | N |
| Quote request create | N | N | C scoped | C/A | N |
| Quote create | N | C scoped | C scoped | C/A | N |
| Quote update | N | U own draft | U scoped draft | U/A | N |
| Quote approve/send | R own sent | R own | U scoped | A | N |
| Quote accept | O/C | N | C scoped on behalf | C/A | N |
| Booking create | O/C | N | C scoped | C/A | N |
| Booking confirm/change | R own | U scoped | U scoped | U/A | N |
| Payment create | O/C | N | R scoped | C/U/A | N |
| Payment refund | N | N | Request only | A | N |
| Messages | O/C/R | C/R scoped | C/R scoped | C/R | N |
| Provider profile | R public | U own draft | R | U/A | N |
| Provider compliance docs | N | C/U own | R | A | N |
| Doctor profile | R approved | C/U own draft | R | A | N |
| Package create/update | R approved | C/U own draft | R | A | N |
| Content review decision | N | N | N | A | N |
| Commission contract | N | R own summary | N | C/U/A | N |
| Commission check result | N | R own | R scoped | R/A | N |
| Settlement | N | R own | N | C/U/A | R own payout |
| Annual report export | N | R own | N | C/U/A | N |
| Attribution report | N | R own summary | R scoped | R/A | R own |
| Audit logs | N | N | R scoped | R | N |

## API Authorization Rules

| Endpoint Family | Required Role | Scope |
|---|---|---|
| `/v1/procedures`, `/v1/providers` GET | Public | Approved public content only |
| `/v1/leads` POST | Public | Anonymous allowed with consent and anti-spam |
| `/v1/patients/eligibility-check` POST | Public or authenticated | Can create check before full account |
| `/v1/intakes` POST | Patient, Coordinator, Admin | Patient owns case or staff assigned |
| `/v1/cases/{id}` GET | Patient, Coordinator, Admin | Patient owns case; coordinator assigned; admin all |
| `/v1/provider/*` | Provider, Admin | Provider users scoped to provider IDs |
| `/v1/admin/*` | Coordinator, Admin | Coordinator limited to case workflows; admin all |
| `/v1/partners/*` | Partner, Admin | Partner scoped to own referral links/leads/commissions |

## Audit Requirements

Always write `audit_logs` for:

- Eligibility override
- Medical intake view by staff
- Patient document view/download
- Case owner change
- Case status change
- Matching run
- Quote create/update/send/accept
- Commission check fail/pass
- Booking confirm/reschedule/cancel
- Payment status change
- Refund action
- Provider verification approve/reject
- Content approve/reject
- Settlement approve/pay/dispute
- Annual report export/submission status change

## Error Codes

| Code | Trigger |
|---|---|
| `ERR_PATIENT_NOT_ELIGIBLE` | Eligibility rules fail |
| `ERR_PROVIDER_NOT_VERIFIED` | Provider lacks valid verified registration or insurance |
| `ERR_CONTENT_NOT_APPROVED` | Public/API exposure attempted before approval |
| `ERR_COMMISSION_CAP_EXCEEDED` | `commission_rate > commission_cap_rate` |
| `ERR_STATE_CONFLICT` | Requested state transition is not allowed |
| `ERR_IDEMPOTENCY_CONFLICT` | Same idempotency key used with different payload |
| `ERR_FORBIDDEN` | Role or scope does not permit action |
