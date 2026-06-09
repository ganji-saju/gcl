# Validation Roadmap - Japan/Taiwan Skin Package Wedge

Last updated: 2026-06-09

This roadmap deliberately validates market pull and operating constraints before full-scale product development. The first wedge is Japan/Taiwan inbound demand for Gangnam skin and aesthetic dermatology packages.

## Strategic Decision

Do not start full marketplace development until these seven gates are complete:

1. Legal operating structure confirmed
2. Japan/Taiwan skin-package wedge selected
3. 10 registered Gangnam providers secured
4. MVP screen definitions, OpenAPI, and ERD frozen
5. 10 EN/JP landing pages launched for lead testing
6. 100 leads validated through manual matching
7. Booking/deposit conversion confirmed, then full development starts

## Gate Plan

| Gate | Objective | Owner | Output | Pass Criteria | Stop / Revise Signal |
|---:|---|---|---|---|---|
| 1 | Confirm legal operating structure | Founder, Legal, Compliance | Signed legal/operating memo | Clear structure for facilitator/provider relationship, patient eligibility, fee handling, ad review, data handling | Unclear commission flow, unregistered-provider exposure risk, unresolved medical-advertising risk |
| 2 | Select Japan/Taiwan skin-package wedge | Product, Growth | Wedge brief and package thesis | 3 to 5 package SKUs with clear buyer, price range, recovery window, and language needs | Demand is too broad, AOV too low, package cannot support paid CAC |
| 3 | Secure 10 registered Gangnam providers | Partnerships, Compliance | Provider shortlist and LOIs/contracts | 10 providers with registration evidence, insurance evidence, language/SLA commitment, package price ranges | Fewer than 5 qualified providers or providers resist transparent quote flow |
| 4 | Freeze MVP screen/API/ERD | Product, Design, Engineering | Approved design pack | ERD, OpenAPI, Admin/Provider screens, RBAC, state machine signed off | New requirements keep changing compliance-critical flows |
| 5 | Launch 10 EN/JP landing pages | Growth, Content, Compliance | 10 reviewed landing pages | Pages live with tracking, consent, lead form, compliant claims, source attribution | Medical-ad review blockers or lead CVR below 1.5% after traffic sanity check |
| 6 | Manually match 100 leads | Coordinator, Partnerships | 100-lead validation sheet and CRM records | At least 100 real leads processed with response time, qualification, quote request, and quote sent data | Qualified rate below 20%, provider response slower than 24h, major language/price mismatch |
| 7 | Confirm booking/deposit conversion | Product, Finance, Ops | Conversion report and development go/no-go | Quote-to-deposit conversion >= 10%, provider quote turnaround <= 24h, no compliance incidents | Deposit conversion below 5%, refund/dispute risk high, CAC payback not plausible |

## Wedge Definition

| Dimension | Decision |
|---|---|
| Markets | Japan and Taiwan |
| Languages | Japanese first, English fallback; Traditional Chinese can follow after initial Taiwan signal |
| Geography | Seoul Gangnam and adjacent premium districts only |
| Treatment category | Dermatology, aesthetic skin, anti-aging, low-to-mid downtime packages |
| Initial packages | Laser toning bundle, skin booster bundle, acne scar program, lifting/anti-aging package, recovery-light 3-day skin package |
| Price band | USD 700 to 3,000 equivalent for packages; avoid single low-priced procedures as primary paid acquisition target |
| Patient promise | Transparent estimate, verified provider, language-supported coordinator, schedule planning, deposit-based booking |
| Non-goals | AI diagnosis, lowest-price comparison, treatment guarantee, unreviewed before/after marketing, domestic patient discounts |

## Recommended Initial Package SKUs

| SKU | Buyer Intent | Package Shape | Target AOV | Required Provider Capability |
|---|---|---|---:|---|
| JP-SKIN-01 | Short Seoul beauty trip | Laser toning + skin analysis + aftercare kit | USD 700 to 1,200 | Japanese coordinator, same-day consult, low downtime |
| JP-SKIN-02 | Anti-aging weekend | Skin booster + lifting consult + recovery care | USD 1,200 to 2,200 | Injectable/laser capability, adverse-event protocol |
| JP-SKIN-03 | Acne scar improvement | Fractional/laser plan + physician review | USD 1,500 to 3,000 | Dermatologist review, multi-session quote clarity |
| TW-SKIN-01 | K-beauty premium skin package | Toning + booster + hotel-friendly schedule | USD 900 to 1,800 | EN/JP support initially, Traditional Chinese content follow-up |
| TW-SKIN-02 | 3-day skin and wellness add-on | Skin treatment + recovery + concierge options | USD 1,500 to 3,000 | Non-medical fee separation, pickup/hotel partner option |

## Landing Page Test Plan

### Page Set

| Page | Locale | Primary Query/Intent | CTA |
|---|---|---|---|
| `/en/korea-skin-clinic-gangnam` | EN | Korea skin clinic Gangnam | Get package quote |
| `/en/korea-laser-toning-package` | EN | Korea laser toning package | Compare clinics |
| `/en/korea-skin-booster-package` | EN | Korea skin booster price | Request consultation |
| `/en/seoul-anti-aging-skin-package` | EN | Seoul anti-aging treatment | Get estimate |
| `/en/korea-acne-scar-laser-package` | EN | Korea acne scar laser | Ask coordinator |
| `/jp/korea-skin-clinic-gangnam` | JP | 韓国 皮膚科 江南 | 見積もり相談 |
| `/jp/korea-laser-toning-package` | JP | 韓国 レーザートーニング | 料金相談 |
| `/jp/korea-skin-booster-package` | JP | 韓国 スキンブースター | 相談する |
| `/jp/seoul-anti-aging-skin-package` | JP | ソウル アンチエイジング | 日程相談 |
| `/jp/korea-acne-scar-laser-package` | JP | 韓国 ニキビ跡 レーザー | クリニック比較 |

### Required Tracking

| Event | Required Properties |
|---|---|
| `landing_viewed` | locale, path, source, medium, campaign, keyword, referrer |
| `procedure_viewed` | procedure_slug, locale, source |
| `lead_started` | locale, path, package_interest |
| `lead_submitted` | locale, country, language, budget_range, package_interest, utm |
| `eligibility_checked` | eligible, reason, country |
| `coordinator_first_response` | lead_id, response_minutes |
| `quote_requested` | provider_id, package_interest |
| `quote_sent` | provider_id, medical_fee, nonmedical_fee, commission_rate |
| `deposit_paid` | amount, currency, provider |

## Manual Matching Validation

Before building the matching engine, process the first 100 leads manually using a structured sheet or lightweight CRM board.

### Required Fields

| Field Group | Fields |
|---|---|
| Lead | Lead ID, date, locale, country, source, campaign, landing page |
| Patient | Nationality, residence country, preferred language, visit window, budget |
| Eligibility | Eligible, reason, consent captured |
| Package | Desired package, procedure category, medical review needed |
| Provider Match | Matched provider 1/2/3, exclusion reasons, expected response SLA |
| Quote | Quote requested at, quote received at, medical fee, non-medical fee, deposit, valid until |
| Outcome | Patient contacted, quote sent, quote accepted, deposit paid, booking confirmed, closed lost reason |

### Manual Scoring

Use the production score formula manually, but only require coarse 1 to 5 scores:

| Score Area | Manual Check |
|---|---|
| Clinical fit | Provider offers exact package and appropriate doctor review |
| Availability | Provider can support requested travel dates |
| Language | Japanese/English support available at consultation and follow-up |
| Price fit | Package estimate overlaps patient budget |
| Provider quality | Registration verified, insurance verified, complaint risk acceptable |
| Response SLA | Provider replies within 24 hours |
| Compliance | No unapproved claims or over-cap commission |

## Go / No-Go Criteria For Full Development

Full development starts only if most of these are true:

| Metric | Minimum Go Threshold | Strong Signal |
|---|---:|---:|
| Landing visitor to lead | 2.5% | 5%+ |
| Lead to qualified case | 25% | 35%+ |
| Qualified case to quote request | 50% | 70%+ |
| Quote request to quote sent | 50% | 70%+ |
| Quote to deposit | 10% | 20%+ |
| Provider quote turnaround | < 24h | < 6h |
| First coordinator response | < 5m during staffed hours | < 1m |
| Compliance incidents | 0 | 0 |
| Paid CAC payback | Plausible within first visit | Confirmed within first visit |

## Development Sequencing After Validation

If Gate 7 passes, start development in this order:

1. Keep `public.inquiries` or the current form as a fallback lead sink.
2. Apply the v1 core schema migration.
3. Implement eligibility, RBAC, audit, provider exposure, content approval, and commission cap services.
4. Connect EN/JP landing forms to `POST /v1/leads`.
5. Build Admin Case Board and Case Detail for the coordinator workflow.
6. Build Provider Compliance Documents and Provider Quote Composer.
7. Replace manual matching sheet with Matching Engine v1 only after the 100-lead scoring data is reviewed.
8. Implement booking/deposit APIs after quote-to-deposit signal is proven.

## Immediate 14-Day Action Plan

| Day | Action | Output |
|---:|---|---|
| 1 | Confirm legal counsel scope and operating-structure questions | Legal issue list |
| 2 | Draft facilitator/provider/patient fee and data flow | Operating structure diagram |
| 3 | Select 5 skin package SKUs and target price ranges | Wedge brief |
| 4 | Build provider qualification checklist | Provider due diligence template |
| 5-7 | Contact 20 Gangnam providers to secure 10 qualified candidates | Provider pipeline |
| 8 | Freeze MVP design pack for validation phase | Approved docs |
| 9-10 | Draft EN/JP landing copy with compliance review checklist | Landing copy |
| 11-12 | Implement 10 landing pages and tracking | Test pages |
| 13 | Set up manual CRM sheet and coordinator SLA process | Lead operations board |
| 14 | Start traffic and lead capture test | First lead cohort |

## Key Operating Assumptions To Validate

- Japan and Taiwan patients will accept coordinator-mediated quote flow instead of direct clinic booking.
- Gangnam providers will respond with structured quotes within 24 hours.
- Package AOV is high enough to recover paid CAC within one visit.
- Patients will pay a deposit before travel when the provider is verified and the quote is transparent.
- Compliance review can keep landing/content publishing speed under 48 hours.

## Open Decisions

| Decision | Default | Needed Before |
|---|---|---|
| Legal entity and facilitator registration path | Confirm with counsel | Any paid facilitation or fee collection |
| Deposit merchant of record | Platform for deposit only, provider for medical balance | Gate 7 |
| Refund policy | Package/provider-specific but displayed before deposit | First deposit test |
| Taiwan language priority | EN/JP first, zh-TW after signal | Landing expansion |
| Provider contract model | Success fee within legal cap + non-medical fee separation | Provider onboarding |
