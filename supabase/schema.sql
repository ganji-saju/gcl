create extension if not exists pgcrypto;

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  nationality text,
  preferred_language text not null default 'en',
  treatment_interest text,
  hospital_slug text,
  preferred_date date,
  budget text,
  message text,
  consent boolean not null default false,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'quoted', 'booked', 'closed')),
  source_path text,
  utm jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inquiries_created_at_idx on public.inquiries (created_at desc);
create index if not exists inquiries_status_idx on public.inquiries (status);
create index if not exists inquiries_treatment_interest_idx on public.inquiries (treatment_interest);
create index if not exists inquiries_hospital_slug_idx on public.inquiries (hospital_slug);

alter table public.inquiries enable row level security;

drop policy if exists "Allow public inquiry inserts" on public.inquiries;
create policy "Allow public inquiry inserts"
on public.inquiries
for insert
to anon
with check (
  consent = true
  and length(trim(name)) between 1 and 160
  and email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
);

revoke all on public.inquiries from anon;
grant insert on public.inquiries to anon;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_inquiries_updated_at on public.inquiries;
create trigger set_inquiries_updated_at
before update on public.inquiries
for each row
execute function public.set_updated_at();
