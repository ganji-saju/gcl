# Global Patient Hub Progress & Maintenance Manual

Last updated: 2026-06-10  
Current production URL: https://global-patient-hub.vercel.app  
Latest verified app commit before this planning update: `ba002b9`

## 1. Current Product State

Global Patient Hub is now a React + Vite static web app for a Korea-based international patient acquisition platform. The site is positioned as a regulated international patient marketplace plus coordinator CRM and quote/booking engine, with the first wedge focused on Japan/Taiwan skin package demand.

The product plan has been expanded from a patient-hospital hub into a future multi-sided network: patient - partner operator - hospital. Partner operators include agencies, individual agents, interpreters, travel agencies, concierge services, and recovery/travel support vendors. The platform should remain the compliance, consent, audit, matching, and settlement layer while partners receive scoped case access and can support patient service requests and hospital shortlisting.

The public site currently includes:

- Patient-facing home page.
- Hospital listing and hospital detail pages.
- Treatment listing and treatment detail pages.
- Comparison page.
- Consultation lead form.
- EN/JP skin package landing routes.
- Floating contact dock for WhatsApp, LINE, WeChat, and KakaoTalk.
- Back-to-top button.
- Automatic scroll reset on route changes.
- Multilingual UI with RTL support for Arabic.
- Planned V2 partner-assisted care model documented in `docs/product/07-multi-sided-partner-network-plan.md`.

Internal/admin surfaces currently include:

- `/admin/beta`: closed beta command center.
- `/admin/cases`: case dashboard.
- `/admin/quote-booking`: quote/deposit/booking MVP.
- `/admin/landing-routes`: internal landing route inventory and draft input UI.

Important: `/admin/*` routes are hidden from public navigation, but they are not yet protected by authentication or RBAC. Do not put real confidential data there before adding route protection.

## 2. Work Completed

### Foundation

- Created the `global-patient-hub` project as a React + Vite app.
- Added Vercel-compatible static deployment settings.
- Added Supabase lead-capture integration with local demo fallback.
- Added product, API, database, and operating documentation under `docs/`.

Relevant files:

- `package.json`
- `vite.config.ts`
- `vercel.json`
- `README.md`
- `docs/OPERATIONS.md`

### Product/PRD/DB/API Design

The initial PRD direction was translated into documentation and schema assets for:

- Regulated foreign patient marketplace.
- Future partner-assisted patient acquisition and care orchestration.
- Coordinator CRM.
- Quote/booking/deposit workflow.
- Compliance guardrails.
- Case status and beta operating plan.
- Supabase/Postgres schema migrations.

Relevant files:

- `docs/product/README.md`
- `docs/product/*`
- `docs/operations/closed-beta-master-sheet.xlsx`
- `supabase/schema.sql`
- `supabase/migrations/20260609_0001_core_marketplace_schema.sql`
- `supabase/migrations/20260609_0002_public_v1_lead_capture_policies.sql`

### Japan/Taiwan Skin Package Wedge

Implemented Japan/Taiwan skin package wedge content and route data:

- Skin package SKU cards.
- EN/JP landing page route dataset.
- Skin package landing page renderer.
- Consultation form package/market prefill.
- Public home repositioned around skin package quote matching.

Relevant files:

- `client/src/lib/wedgeData.ts`
- `client/src/pages/SkinPackageLanding.tsx`
- `client/src/pages/Home.tsx`
- `client/src/pages/Consultation.tsx`

### Lead Capture and Supabase v1 Expansion

Consultation form now captures richer lead-validation data:

- nationality
- residence country
- preferred language
- package/market interest
- travel window
- budget range
- foreign patient eligibility flags
- consent flags
- attribution/source landing data

Storage behavior:

- If Supabase env vars are missing, leads are saved to browser local storage demo mode.
- If v1 tables are available, inserts go to `patients`, `patient_eligibility_checks`, `leads`, `cases`, and `medical_intakes`.
- If v1 insert fails, it falls back to the older `inquiries` table.

Relevant files:

- `client/src/pages/Consultation.tsx`
- `client/src/lib/supabase.ts`
- `supabase/schema.sql`
- `supabase/migrations/20260609_0001_core_marketplace_schema.sql`
- `supabase/migrations/20260609_0002_public_v1_lead_capture_policies.sql`

### Closed Beta Operations MVP

Implemented first internal operations surfaces for the closed beta:

- 5-provider SLA tracker.
- 300-lead test plan.
- deposit target tracking.
- settlement ledger validation.
- provider/channel ranking.
- case dashboard.
- quote/deposit/booking MVP screen.

Relevant files:

- `client/src/lib/betaData.ts`
- `client/src/pages/ClosedBetaOps.tsx`
- `client/src/pages/CaseDashboard.tsx`
- `client/src/pages/QuoteBookingMvp.tsx`
- `docs/operations/closed-beta-master-sheet.xlsx`
- `client/public/beta/closed-beta-master-sheet.xlsx`

### Public/Internal Content Separation

Removed internal route/debug content from the public home page. The landing route inventory is now kept in an internal admin surface.

Relevant files:

- `client/src/pages/Home.tsx`
- `client/src/pages/AdminLandingRoutes.tsx`
- `client/src/components/Navbar.tsx`
- `client/src/App.tsx`

### Multilingual and RTL Fixes

Improved multilingual UI behavior:

- Added/cleaned public home translations.
- Arabic keeps `rtl` layout.
- Switching from Arabic back to EN/JP/etc resets `html` and `body` back to `ltr`.

Relevant files:

- `client/src/contexts/I18nContext.tsx`
- `client/src/index.css`

### Floating Contact Dock and Scroll Behavior

Added global UI helpers:

- Right-side floating chat button.
- Expand-up contact buttons for WhatsApp, LINE, WeChat, KakaoTalk.
- Back-to-top button that appears after scrolling.
- Route-change scroll manager so menu clicks no longer leave the user at the footer.
- Hash links such as `/#process` scroll to the correct section below the sticky nav.

Relevant files:

- `client/src/components/FloatingActionDock.tsx`
- `client/src/components/ScrollManager.tsx`
- `client/src/components/Layout.tsx`
- `client/src/App.tsx`
- `client/src/index.css`

## 3. Route Map

Public routes:

| Route | Purpose | Main file |
| --- | --- | --- |
| `/` | Public home | `client/src/pages/Home.tsx` |
| `/hospitals` | Hospital list/search | `client/src/pages/Hospitals.tsx` |
| `/hospitals/:slug` | Hospital detail | `client/src/pages/HospitalDetail.tsx` |
| `/treatments` | Treatment list | `client/src/pages/Treatments.tsx` |
| `/treatments/:slug` | Treatment detail | `client/src/pages/TreatmentDetail.tsx` |
| `/compare` | Provider comparison | `client/src/pages/Compare.tsx` |
| `/consultation` | Lead intake form | `client/src/pages/Consultation.tsx` |
| `/:locale/:slug` | Skin package landing pages | `client/src/pages/SkinPackageLanding.tsx` |

Internal routes:

| Route | Purpose | Main file |
| --- | --- | --- |
| `/admin/beta` | Closed beta command center | `client/src/pages/ClosedBetaOps.tsx` |
| `/admin/cases` | Case dashboard | `client/src/pages/CaseDashboard.tsx` |
| `/admin/quote-booking` | Quote/deposit/booking MVP | `client/src/pages/QuoteBookingMvp.tsx` |
| `/admin/landing-routes` | Landing route manager | `client/src/pages/AdminLandingRoutes.tsx` |

Router file:

- `client/src/App.tsx`

## 4. Edit Manual

### Change Top Navigation Menu

Edit:

- `client/src/components/Navbar.tsx`

Look for:

```ts
const navLinks = [
  { href: "/en/korea-skin-clinic-gangnam", label: t("nav.skinPackages") },
  { href: "/hospitals", label: t("nav.hospitals") },
  { href: "/treatments", label: t("nav.treatments") },
  { href: "/compare", label: t("nav.compare") },
  { href: "/#process", label: t("nav.process") },
];
```

If you add a new label, also add translation keys in:

- `client/src/contexts/I18nContext.tsx`

### Change Home Page Copy or Layout

Edit:

- `client/src/pages/Home.tsx`
- `client/src/contexts/I18nContext.tsx`

Current home copy mostly uses translation keys under:

- `publicHome.*`
- `home.match.*`
- `home.category.*`
- `home.featured.*`

Rule: keep public home patient-facing. Do not expose internal route sets, validation counts, Supabase state, beta targets, or admin workflows on the public home.

### Change Languages or Translations

Edit:

- `client/src/contexts/I18nContext.tsx`

Main areas:

- `LANGUAGES`: supported language list and direction.
- `T`: translation dictionary.
- `I18nProvider`: writes `lang`, `dir`, and `data-direction` to `html` and `body`.

Arabic must remain:

```ts
{ code: "ar", label: "Arabic", nativeLabel: "العربية", shortLabel: "AR", dir: "rtl" }
```

All other current languages should remain `ltr`.

CSS direction fallback lives in:

- `client/src/index.css`

### Change Floating Contact Buttons

Edit:

- `client/src/components/FloatingActionDock.tsx`

Look for:

```ts
const CONTACT_LINKS = [...]
```

Update the `href` values when the official IDs are confirmed:

- WhatsApp: `https://wa.me/...`
- LINE: `https://line.me/R/ti/p/...`
- WeChat: `weixin://dl/chat?...`
- KakaoTalk: `https://pf.kakao.com/.../chat`

Current values are placeholders based on the project phone/handle pattern. Replace before production marketing traffic.

### Change Back-to-Top or Route Scroll Behavior

Edit:

- `client/src/components/FloatingActionDock.tsx` for the top button.
- `client/src/components/ScrollManager.tsx` for route/hash scroll behavior.
- `client/src/index.css` for `scroll-margin-top`.

If menu clicks show the footer again, check:

- `ScrollManager` is mounted in `client/src/App.tsx`.
- The target page route is inside the `wouter` router.
- Hash targets have a matching `id`.

### Change Skin Package SKUs

Edit:

- `client/src/lib/wedgeData.ts`

Look for:

```ts
export const SKIN_PACKAGE_SKUS = [...]
```

Each SKU controls package card data:

- id
- title
- shortTitle
- market
- treatmentSlug
- price range
- duration
- recovery window
- coordinator languages
- included items
- compliance note

After adding a SKU, connect it to landing pages through `packageIds`.

### Change EN/JP Landing Pages

Edit:

- `client/src/lib/wedgeData.ts`

Look for:

```ts
export const SKIN_LANDING_PAGES = [...]
```

Each row creates a route:

```txt
/{locale}/{slug}
```

Example:

```txt
/en/korea-skin-clinic-gangnam
/jp/korea-skin-clinic-gangnam
```

The renderer is:

- `client/src/pages/SkinPackageLanding.tsx`

Internal route inventory UI is:

- `client/src/pages/AdminLandingRoutes.tsx`

Important: do not show route inventories on the public home. Keep them under admin/internal screens.

### Change Hospital or Treatment Data

Edit:

- `client/src/lib/sampleData.ts`

This file contains:

- `SAMPLE_HOSPITALS`
- `SAMPLE_TREATMENTS`
- hospital/treatment localization helpers
- language labels
- specialty labels

Used by:

- `Home.tsx`
- `Hospitals.tsx`
- `HospitalDetail.tsx`
- `Treatments.tsx`
- `TreatmentDetail.tsx`
- `Compare.tsx`
- `Consultation.tsx`

### Change Consultation Form

Edit:

- `client/src/pages/Consultation.tsx`
- `client/src/lib/supabase.ts`

Form data model:

- `InquiryInput` in `client/src/lib/supabase.ts`

Storage flow:

1. If Supabase env vars are missing: local demo storage.
2. Try v1 marketplace tables.
3. Fallback to `inquiries`.

If fields change, update both:

- form state and UI in `Consultation.tsx`
- insert mapping in `supabase.ts`
- database schema/RLS if the field is persisted

### Change Supabase Schema

Existing schema files:

- `supabase/schema.sql`
- `supabase/migrations/20260609_0001_core_marketplace_schema.sql`
- `supabase/migrations/20260609_0002_public_v1_lead_capture_policies.sql`

Recommended rule:

- Do not edit old migrations after they have been applied.
- Add a new migration file with a later timestamp.

Example naming:

```txt
supabase/migrations/20260610_0001_add_partner_tracking.sql
```

### Change Closed Beta/Admin Data

Edit:

- `client/src/lib/betaData.ts`

Screens using it:

- `client/src/pages/ClosedBetaOps.tsx`
- `client/src/pages/CaseDashboard.tsx`
- `client/src/pages/QuoteBookingMvp.tsx`

Use this for seed/demo operations data only until real backend persistence is added.

### Change Global Layout, Footer, or Floating UI

Edit:

- `client/src/components/Layout.tsx`
- `client/src/components/Navbar.tsx`
- `client/src/components/Footer.tsx`
- `client/src/components/FloatingActionDock.tsx`

`Layout.tsx` currently mounts:

- `Navbar`
- page content
- `Footer`
- `FloatingActionDock`

### Change Styling

Global CSS:

- `client/src/index.css`

Most UI styling is Tailwind class-based in each component.

Avoid:

- public debug panels
- large marketing-only hero cards that obscure the actual product
- internal ops metrics on public pages
- treatment guarantee language
- unverified provider claims

## 5. Local Development

Install dependencies:

```powershell
npm install
```

Run local dev server:

```powershell
npm run dev
```

Open the Vite local URL shown in the terminal.

Typecheck:

```powershell
npm run check
```

Production build:

```powershell
npm run build
```

Preview build locally:

```powershell
npm run preview
```

## 6. Deployment Flow

Normal deployment is GitHub push to Vercel production:

```powershell
git status
git add .
git commit -m "Describe the change"
git push origin main
```

Then check Vercel:

```powershell
vercel ls global-patient-hub
```

Production URL:

```txt
https://global-patient-hub.vercel.app
```

Quick HTTP check:

```powershell
curl.exe -I -L https://global-patient-hub.vercel.app
```

## 7. Verification Checklist

Run before committing meaningful UI/data changes:

- `npm run check`
- `npm run build`
- Open home page.
- Open `/consultation`.
- Open one landing page, for example `/en/korea-skin-clinic-gangnam`.
- Change language EN -> AR -> EN and confirm direction returns to left-to-right.
- Scroll down and test Back-to-top.
- Open floating Chat and confirm the four channel buttons appear.
- From page bottom, click a nav item and confirm the next page starts at top.
- Click Process and confirm it scrolls to `/#process`, not the footer.
- Confirm there is no framework error overlay and no console errors.

## 8. Compliance and Content Guardrails

Keep these rules when editing copy or data:

- Do not promise treatment results.
- Do not use "guaranteed", "best", "number 1", or unsupported superiority claims.
- Do not advertise unverified providers as verified.
- Keep medical and non-medical fees separated.
- Keep sponsored/promoted placement visibly labeled if used later.
- Do not expose internal test routes, beta metrics, Supabase/RLS details, or admin workflows on public pages.
- Do not collect passports or medical documents in the public frontend until private storage and access controls are implemented.

## 9. Known Limitations

- `/admin/*` is not auth-protected yet.
- Admin route draft form is local UI state only; it does not persist to Supabase/CMS yet.
- Floating contact channel IDs should be replaced with official production IDs.
- Current data is mostly seed/static data, not real live provider inventory.
- Vite build has a chunk-size warning. It is not blocking, but future code splitting can improve load performance.
- Supabase insert depends on correct env vars and applied migrations.

## 10. Troubleshooting

### Menu click opens next page near footer

Check:

- `client/src/components/ScrollManager.tsx`
- `ScrollManager` mount in `client/src/App.tsx`

### Arabic direction does not reset

Check:

- `I18nProvider` in `client/src/contexts/I18nContext.tsx`
- RTL/LTR CSS in `client/src/index.css`

### Consultation saves locally

Cause:

- Supabase env vars are missing.

Check:

- `.env.local`
- Vercel environment variables
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Supabase v1 insert falls back to inquiries

Possible causes:

- v1 migrations not applied.
- RLS policy missing.
- column mismatch.
- anon insert permission missing.

Check:

- browser console warning
- Supabase logs
- `supabase/migrations/20260609_0001_core_marketplace_schema.sql`
- `supabase/migrations/20260609_0002_public_v1_lead_capture_policies.sql`

### Git index.lock blocks commit

On Windows, stale Git locks appeared during this project. Use caution:

1. Confirm no Git process is actively running.
2. Remove stale lock only if safe:

```powershell
Remove-Item -LiteralPath .git\index.lock
```

Do not remove the lock while a real Git operation is running.

## 11. Recommended Next Work

Priority next steps:

1. Add auth/RBAC protection for `/admin/*`.
2. Replace static admin seed data with Supabase-backed tables.
3. Connect landing route manager drafts to persistence.
4. Replace contact channel placeholder IDs with official accounts.
5. Add spam protection to consultation submission.
6. Add route-level code splitting to reduce bundle size.
7. Add real provider verification workflow and document expiry alerts.
8. Add settlement ledger persistence and audit logs.
