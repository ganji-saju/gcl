# Global Patient Hub Operations

## Recommended Architecture

- Frontend: React + Vite static app deployed on Vercel.
- Database: Supabase Postgres table `public.inquiries` for patient leads.
- Security: browser uses only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; RLS allows anonymous inserts only.
- Source control: push this folder as a fresh GitHub repository, then import that repository in Vercel.

## Supabase Setup

1. Create a new Supabase project.
2. Open SQL Editor and run `supabase/schema.sql`.
3. Copy the project URL and publishable/anon key.
4. Set Vercel environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

The app will store demo inquiries in browser local storage until those variables are configured.

## v1 Marketplace Design Pack

The current public app uses `public.inquiries` as a simple lead-capture POC. The v1
regulated marketplace design pack is documented under `docs/product/README.md`.
Before full v1 development, follow the seven-gate validation roadmap in
`docs/product/05-validation-roadmap-japan-taiwan-skin-wedge.md`.

After the landing-page validation setup is live, run the closed beta operating
plan in `docs/product/06-closed-beta-operating-plan.md`. That plan defines the
Closed Beta Master Sheet, 5-provider SLA gate, coordinator playbook, 300-lead
test, 15-deposit target, settlement ledger validation, and provider/channel
ranking rules.

For backend implementation, apply the additive core schema migration after the POC schema:

```powershell
supabase/migrations/20260609_0001_core_marketplace_schema.sql
```

That migration adds the provider verification, patient eligibility, case CRM,
matching, quote, booking, payment, compliance, settlement, and reporting tables.

## Vercel Setup

Use these settings when importing the GitHub repository:

- Framework Preset: Vite
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist/public`

`vercel.json` already includes SPA rewrites so routes like `/hospitals/aura-facial-institute` work after refresh.

## GitHub Publish

```powershell
git init
git add .
git commit -m "Create global patient hub"
gh repo create global-patient-hub --private --source . --remote origin --push
```

Change `--private` to `--public` only when you are ready to expose the code.

## Operating Notes

- Treat listed prices as estimates; final quotes must be confirmed by licensed providers.
- Add spam protection before heavy traffic. Recommended next step: Vercel serverless function or Supabase Edge Function with Turnstile verification before insert.
- Keep the anon key public only with RLS enabled and tested.
- Do not store medical documents in this frontend. Use a private Supabase Storage bucket or CRM workflow for sensitive files.
