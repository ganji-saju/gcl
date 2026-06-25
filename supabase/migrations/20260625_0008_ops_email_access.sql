-- Email-based internal operations access for admin, partner, and provider portals.

create extension if not exists citext;

create table if not exists public.ops_user_access (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  role public.user_role not null,
  partner_id uuid references public.partners(id) on delete restrict,
  provider_id uuid references public.providers(id) on delete restrict,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ops_user_access_role_check
    check (role in ('admin', 'partner', 'provider')),
  constraint ops_user_access_scope_check
    check (
      (role = 'admin' and partner_id is null and provider_id is null)
      or (role = 'partner' and partner_id is not null and provider_id is null)
      or (role = 'provider' and provider_id is not null and partner_id is null)
    )
);

create index if not exists ops_user_access_email_active_idx
on public.ops_user_access (email)
where active;

create index if not exists ops_user_access_partner_idx
on public.ops_user_access (partner_id)
where partner_id is not null;

create index if not exists ops_user_access_provider_idx
on public.ops_user_access (provider_id)
where provider_id is not null;

drop trigger if exists set_ops_user_access_updated_at on public.ops_user_access;
create trigger set_ops_user_access_updated_at
before update on public.ops_user_access
for each row execute function public.set_updated_at();

alter table public.ops_user_access enable row level security;

comment on table public.ops_user_access is 'Server-only allowlist that maps Supabase Auth emails to internal operations roles and account scopes.';
comment on column public.ops_user_access.email is 'Email verified by Supabase Auth before the operations API authorizes access.';
comment on column public.ops_user_access.partner_id is 'Required when role is partner; scopes partner portal data.';
comment on column public.ops_user_access.provider_id is 'Required when role is provider; scopes provider portal data.';
