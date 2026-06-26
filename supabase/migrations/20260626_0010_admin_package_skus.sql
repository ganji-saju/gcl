-- Admin-managed package code catalog for landing route drafts.

create table if not exists public.admin_package_skus (
  id varchar(80) primary key,
  short_title text not null,
  market varchar(40) not null default 'global',
  category varchar(40) not null default 'skin',
  price_min_usd integer not null default 0 check (price_min_usd >= 0),
  price_max_usd integer not null default 0 check (price_max_usd >= price_min_usd),
  duration_days integer not null default 1 check (duration_days between 1 and 60),
  recovery_window text not null default '',
  coordinator_languages text[] not null default '{}'::text[],
  best_for text not null default '',
  includes text[] not null default '{}'::text[],
  compliance_note text not null default '',
  source varchar(40) not null default 'admin',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (id ~ '^[a-z0-9][a-z0-9_-]{1,79}$'),
  check (market ~ '^[a-z][a-z0-9_]{1,39}$')
);

create index if not exists admin_package_skus_active_idx
on public.admin_package_skus (active, market, updated_at desc);

alter table public.admin_package_skus enable row level security;

comment on table public.admin_package_skus is
  'Admin-managed package code catalog used by landing route drafts. Rows can override or hide code-defined package SKUs.';
