-- Expand admin landing routes from the initial EN/JP Japan/Taiwan wedge
-- to global locale and market segment codes.

alter table public.admin_landing_routes
  drop constraint if exists admin_landing_routes_locale_check,
  drop constraint if exists admin_landing_routes_market_check,
  drop constraint if exists admin_landing_routes_locale_code_check,
  drop constraint if exists admin_landing_routes_market_code_check;

alter table public.admin_landing_routes
  add constraint admin_landing_routes_locale_code_check
    check (locale ~ '^[a-z]{2,3}(-[a-z0-9]{2,8})?$'),
  add constraint admin_landing_routes_market_code_check
    check (market ~ '^[a-z][a-z0-9_]{1,39}$');

comment on table public.admin_landing_routes is
  'Admin-managed global landing route drafts and publish state. Locale accepts short BCP-47 style codes; market accepts internal global segment keys.';
