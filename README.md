# Global Patient Hub

Independent global patient acquisition hub for Korean medical tourism.

The site lets international patients compare Korean hospitals, treatment programs, language support, estimated prices, and submit consultation requests. It is designed as a separate deployable project for GitHub, Vercel, and Supabase.

## Local Development

```powershell
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

## Production Stack

- React + Vite
- Vercel static deployment
- Supabase Postgres lead table
- Row Level Security for anonymous consultation inserts

## Environment Variables

Copy `.env.example` to `.env.local`:

```powershell
Copy-Item .env.example .env.local
```

Then set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Without these values, the consultation form saves locally in demo mode.

For the internal partner-assisted operations API, also set these only in Vercel project environment variables:

- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_API_TOKEN`

Do not prefix `SUPABASE_SERVICE_ROLE_KEY` with `VITE_`. It must stay server-only and is used by `/api/admin/partner-mvp`.

## Supabase

Run `supabase/schema.sql` in the Supabase SQL editor.

The policy intentionally allows public inserts only. Public reads, updates, and deletes are not granted.

For the v1 international patient marketplace design pack, see `docs/product/README.md`.
The production-grade core schema DDL is additive and lives in
`supabase/migrations/20260609_0001_core_marketplace_schema.sql`.

For the partner-assisted MVP, apply:

- `supabase/migrations/20260610_0003_partner_assisted_mvp.sql`
- `supabase/migrations/20260610_0004_partner_mvp_seed.sql`

The seed migration creates starter partner operators, provider candidates, and partner-provider relationships for the first operating test.

## Vercel

Import the GitHub repository into Vercel. `vercel.json` sets:

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist/public`
- SPA route rewrites

See `docs/OPERATIONS.md` for the full launch checklist.
