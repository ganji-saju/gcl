# Closed Beta Operating Plan

Last updated: 2026-06-10

This document converts the Japan/Taiwan skin-package wedge into a closed beta operating system. The goal is not broad traffic growth. The goal is to prove that verified providers, coordinator handling, quote clarity, deposit conversion, and settlement can work on real leads before scaling spend.

## Beta Objective

Run a controlled beta for 300 Japan/Taiwan dermatology-package leads and secure at least 15 deposit-paid bookings from verified Gangnam-area providers.

Primary success criteria:

- 300 total leads captured from EN/JP landing routes.
- 5 core providers under written SLA.
- 150+ qualified cases.
- 80+ quote requests.
- 45+ quotes sent.
- 15+ deposit-paid bookings.
- 0 compliance incidents.
- 100% quote, deposit, booking, and settlement ledger traceability.

## Operating Sequence

| Step | Workstream | Output | Owner | Gate |
|---:|---|---|---|---|
| 1 | Closed Beta Master Sheet | Single operating workbook for leads, providers, SLA, cases, quotes, deposits, bookings, ledger, rankings | Ops | Sheet usable before new paid traffic |
| 2 | Provider SLA | 5 signed provider SLA agreements | Biz/Ops | Provider is eligible for quote requests |
| 3 | Coordinator Playbook | Qualification, first-response, matching, quote, deposit, aftercare scripts | Ops | Coordinator can handle first 50 leads consistently |
| 4 | Quote/Deposit/Booking MVP | Minimum workflow for quote creation, deposit logging, booking status | Product/BE/FE | Manual ops can be replaced without losing auditability |
| 5 | Case Dashboard | Daily operating board for SLA, state, owner, source, conversion | FE/Ops | No case can sit unowned past SLA |
| 6 | 300 Lead Test | EN/JP landing traffic test and manual qualification | Growth/Ops | 300 leads or stop-loss reached |
| 7 | Deposit Target | 15+ deposit-paid bookings | Ops/Biz | Proves booking intent |
| 8 | Settlement Ledger | Provider commission and partner payout reconciliation | Finance/Ops | Zero unreconciled paid cases |
| 9 | Provider Ranking | Rank providers by conversion, SLA, cancellation, complaints, revenue | Data/Ops | Budget allocation rule ready |
| 10 | Budget Focus | Concentrate spend on top provider/channel combinations | Growth | Scale only winning cells |

## 1. Closed Beta Master Sheet

Use one workbook as the operating source of truth until the admin dashboard fully replaces it.

Generated workbook:

- `../../docs/operations/closed-beta-master-sheet.xlsx`
- Public app download path: `/beta/closed-beta-master-sheet.xlsx`

Recommended tabs:

| Tab | Purpose | Key Columns |
|---|---|---|
| `00_Dashboard` | Daily KPI snapshot | leads, qualified, quote requested, quote sent, deposit paid, booking confirmed, CAC, revenue, SLA breaches |
| `01_Leads` | Raw lead capture and attribution | lead_id, created_at, locale, market, source, campaign, landing_path, package_id, name, contact, nationality, residence_country, consent flags |
| `02_Cases` | Coordinator case board | case_id, lead_id, owner, status, priority, language, procedure, budget band, travel dates, first_response_at, last_contacted_at, next_action_at |
| `03_Provider_SLA` | Provider eligibility for beta | provider_id, provider_name, registration_verified, insurance_verified, languages, SLA_hours, quote_template_ready, deposit_policy_ready, active |
| `04_Matching` | Manual matching evidence | case_id, provider_id, rank, clinical_fit, availability, language_fit, price_fit, SLA_score, exclusion_reason |
| `05_Quotes` | Quote tracking | quote_id, case_id, provider_id, medical_fee, nonmedical_fee, currency, commission_rate, cap_rate, deposit_amount, valid_until, sent_at, accepted_at |
| `06_Deposits_Bookings` | Booking proof | payment_id, booking_id, case_id, quote_id, deposit_status, deposit_amount, paid_at, scheduled_at, booking_status, refund_status |
| `07_Settlement_Ledger` | Financial reconciliation | ledger_id, provider_id, case_id, gross_medical_fee, commission_rate, commission_amount, partner_payout, platform_net, settlement_status |
| `08_Provider_Ranking` | Provider performance ranking | provider_id, leads_matched, quotes_sent, quote_rate, deposit_count, deposit_rate, SLA_breach_rate, complaint_count, rank |
| `09_Channel_Ranking` | Channel performance ranking | source, campaign, leads, qualified_rate, quote_rate, deposit_rate, CAC, platform_revenue, contribution_profit |
| `10_Risk_Log` | Compliance and operating issues | issue_id, case_id, provider_id, risk_type, severity, owner, status, resolution, audit_note |

Sheet rules:

- Do not overwrite IDs. Use immutable IDs from the app when available.
- Every paid case must appear in `05_Quotes`, `06_Deposits_Bookings`, and `07_Settlement_Ledger`.
- Every SLA breach must have an owner and resolution note.
- Every quote must store medical and non-medical fees separately.
- Every commission row must store both requested rate and cap rate.

## 2. Core Provider SLA

Closed beta requires 5 core providers, not 10 weak providers. A provider can receive beta cases only after all minimum terms are confirmed.

Minimum SLA terms:

| SLA Item | Required Standard |
|---|---|
| Registration | Foreign-patient provider registration verified and not expired |
| Insurance | Medical malpractice insurance or mutual aid evidence verified |
| Languages | Japanese or English coordinator handoff accepted |
| First quote response | Within 24 business hours |
| Urgent quote response | Within 4 business hours for high-intent travel-window cases |
| Quote format | Medical fee, non-medical fee, deposit, validity, notes separated |
| Price-change wording | Final treatment and price may change after provider consultation |
| Deposit handling | Clear cancellation and refund policy before payment |
| Case outcome reporting | Visit, no-show, treated, refund, complaint status reported within 48 hours |
| Compliance | No unapproved before/after, cure guarantee, misleading ranking, or discount bait content |

Provider beta eligibility score:

```text
provider_beta_score =
  registration_ready * 25
+ quote_response_ready * 20
+ language_ready * 15
+ package_price_ready * 15
+ booking_policy_ready * 10
+ historical_trust_signal * 10
+ aftercare_ready * 5
- compliance_risk_penalty
```

Provider must score 80+ to be active in closed beta.

## 3. Coordinator Playbook

Coordinator goal: move qualified patients from lead to quote acceptance without making medical claims.

Operating SLA:

| Stage | Target |
|---|---|
| New lead first response | Under 5 minutes during staffed hours |
| Lead qualification | Same day |
| Manual match shortlist | Within 2 hours after intake complete |
| Provider quote request | Within 1 hour after match approval |
| Quote follow-up | Within 30 minutes after quote sent |
| Deposit follow-up | 24h, 48h, and 72h sequence |
| Pre-visit confirmation | 7 days, 3 days, 1 day before visit |

Qualification checklist:

- Confirm patient is not a Korean National Health Insurance holder.
- Confirm residence country and nationality.
- Confirm language preference.
- Confirm target package or procedure.
- Confirm budget band.
- Confirm travel window.
- Confirm timeline urgency.
- Confirm whether the patient needs hotel, transport, translation, or recovery support.
- Confirm medical-information consent before collecting sensitive history.

Coordinator scripts must avoid:

- Treatment guarantees.
- "Best", "No. 1", "safest", or direct superiority claims.
- Final price promises before provider review.
- Before/after outcome promises.
- Domestic-patient discount language.

## 4. Quote / Deposit / Booking MVP

MVP should support the narrow beta workflow before broad portal features.

P0 workflow:

1. Coordinator opens case.
2. Coordinator selects matched provider.
3. Provider or coordinator creates quote.
4. Quote validates commission cap.
5. Patient accepts quote.
6. Deposit payment is logged.
7. Booking is confirmed.
8. Ledger entry is generated.

Minimum data objects:

| Object | Required Fields |
|---|---|
| Quote | case_id, provider_id, medical_fee, nonmedical_fee, currency, commission_rate, cap_rate, deposit_amount, valid_until, disclaimer, status |
| Deposit | case_id, quote_id, amount, currency, payment_provider, status, paid_at, transaction_ref |
| Booking | case_id, quote_id, provider_id, scheduled_at, visit_type, status, cancellation_policy |
| Ledger | case_id, provider_id, gross_medical_fee, commission_amount, partner_payout, platform_net, settlement_status |

Hard API rules:

- Quote creation fails if `commission_rate > cap_rate`.
- Booking and deposit APIs require idempotency keys.
- Deposit-paid state cannot exist without accepted quote.
- Booking-confirmed state cannot exist without provider confirmation.
- All quote, payment, booking, and ledger mutations write audit logs.

## 5. Case Dashboard Operations

Daily operating board views:

Implemented MVP route:

- `/admin/cases`

| View | Filter | Purpose |
|---|---|---|
| `New Leads` | status = new | First response and eligibility |
| `Qualified No Intake` | status = qualified | Push intake completion |
| `Needs Matching` | status = intake_completed or matching_ready | Coordinator shortlist |
| `Quote SLA Risk` | quote_requested and provider SLA timer active | Prevent provider delays |
| `Quote Sent Follow-up` | quote_sent | Drive acceptance |
| `Deposit Pending` | deposit_pending | Close booking intent |
| `Booked This Month` | booking_confirmed | Visit preparation |
| `Ledger Review` | deposit_paid or treated | Settlement check |

Card fields:

- case_id
- owner
- status
- source / campaign
- market / locale
- language
- package_id
- budget band
- travel dates
- matched provider
- SLA timer
- next action
- risk flags

## 6. 300 Lead Test

Traffic allocation:

| Segment | Target Leads | Landing Locale | Notes |
|---|---:|---|---|
| Japan laser toning | 75 | JP | Fastest intent validation |
| Japan skin booster | 75 | JP | Higher AOV and repeat potential |
| Japan acne scar laser | 40 | JP | More consult-heavy |
| Taiwan skin booster | 60 | EN | English flow for Taiwan demand |
| Taiwan recovery add-on | 30 | EN | Tests non-medical margin |
| Retargeting / referral | 20 | EN/JP | Tests lower CAC |

Stop-loss rules:

- Stop a channel if paid CAC exceeds expected platform revenue for 7 consecutive days.
- Stop a provider if SLA breach rate exceeds 30% after 10 assigned cases.
- Stop a package if qualified-to-quote rate is below 20% after 30 leads.
- Stop any content or campaign immediately if compliance risk is raised.

## 7. Deposit Target

Beta target is 15 deposit-paid bookings from 300 leads.

Required funnel:

| Stage | Target Count | Target Rate |
|---|---:|---:|
| Leads | 300 | 100% |
| Qualified cases | 150 | 50% of leads |
| Quote requests | 80 | 53% of qualified |
| Quotes sent | 45 | 56% of quote requests |
| Quote accepted | 22 | 49% of quotes sent |
| Deposit paid | 15 | 68% of accepted quotes |

If the beta produces fewer than 10 deposits, do not scale paid traffic. Fix offer, provider response, or quote clarity first.

## 8. Settlement Ledger

Ledger must reconcile four numbers for every paid case:

Implemented MVP routes:

- `/admin/beta`
- `/admin/quote-booking`

```text
platform_net =
  medical_fee * commission_rate
+ nonmedical_fee * service_margin_rate
- partner_payout
- payment_fee
- refund_or_dispute_cost
```

Ledger validation checks:

- Quote exists.
- Deposit exists.
- Booking exists.
- Commission rate is not above cap.
- Partner attribution is not duplicated.
- Refund status is reflected.
- Provider settlement status is clear.
- Ledger row ties back to case_id and quote_id.

## 9. Provider Conversion Ranking

Rank providers weekly. Do not rank only by revenue.

Recommended score:

```text
provider_rank_score =
  deposit_rate * 0.30
+ quote_response_rate * 0.20
+ median_response_time_score * 0.15
+ quote_acceptance_rate * 0.15
+ patient_satisfaction_score * 0.10
+ settlement_cleanliness_score * 0.05
+ compliance_clean_score * 0.05
- complaint_penalty
- refund_penalty
```

Provider tiering:

| Tier | Rule | Action |
|---|---|---|
| A | Top 20%, no compliance issue, SLA breach under 10% | More leads and co-marketing |
| B | Middle 50%, acceptable SLA | Maintain baseline lead allocation |
| C | Bottom 30% or SLA breach over 30% | Reduce lead allocation |
| Blocked | Compliance issue, expired docs, over-cap quote | No public exposure or case assignment |

## 10. Budget Focus Rule

Scale only combinations that pass both provider and channel gates.

Budget allocation rule:

| Cell Type | Rule | Budget Action |
|---|---|---|
| Winning provider + winning channel | Deposit rate 5%+, positive contribution profit | Increase weekly budget 20-30% |
| Winning provider + weak channel | Provider converts but CAC high | Test new creative or lower bid |
| Weak provider + winning channel | Channel produces qualified leads but provider misses SLA | Reallocate leads to better provider |
| Weak provider + weak channel | Low qualification and low deposit | Stop |

Weekly decision cadence:

- Monday: review prior-week funnel and SLA.
- Tuesday: adjust budget allocation.
- Wednesday: provider SLA review.
- Thursday: quote quality review.
- Friday: ledger and settlement review.

## Closed Beta Ticket Backlog

| ID | Type | Priority | Owner | Estimate | Title |
|---|---|---:|---|---:|---|
| GPH-BETA-001 | Task | P0 | Ops | 3 | Create Closed Beta Master Sheet workbook |
| GPH-BETA-002 | Task | P0 | Biz | 5 | Sign 5 provider SLA agreements |
| GPH-BETA-003 | Task | P0 | Ops | 3 | Finalize coordinator qualification and follow-up scripts |
| GPH-BETA-004 | Story | P0 | FE/BE | 8 | Build Quote MVP with commission cap validation |
| GPH-BETA-005 | Story | P0 | FE/BE | 8 | Build Deposit logging and status workflow |
| GPH-BETA-006 | Story | P0 | FE/BE | 5 | Build Booking confirmation workflow |
| GPH-BETA-007 | Story | P0 | FE | 8 | Build Case Dashboard MVP |
| GPH-BETA-008 | Task | P0 | Growth | 5 | Run EN/JP 300-lead acquisition test |
| GPH-BETA-009 | Task | P0 | Finance | 5 | Reconcile settlement ledger for every deposit-paid case |
| GPH-BETA-010 | Task | P1 | Data | 3 | Build provider and channel ranking report |

## Day 1 Kickoff

Day 1 outputs:

1. Name the 5 target providers and assign SLA owner.
2. Create the Closed Beta Master Sheet from the tab structure above.
3. Assign one coordinator owner for the first 50 leads.
4. Freeze allowed statuses and next-action rules for the case board.
5. Confirm quote disclaimer, deposit policy, and refund wording.
6. Start tracking all EN/JP landing traffic with source and campaign parameters.
