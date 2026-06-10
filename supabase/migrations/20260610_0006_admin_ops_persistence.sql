-- Admin operations persistence for launch-readiness work.
-- Keeps public pages patient-facing while internal operators can manage route
-- drafts, official contact channels, and provider verification readiness.

create table if not exists public.admin_landing_routes (
  id uuid primary key default gen_random_uuid(),
  locale varchar(12) not null,
  slug varchar(160) not null,
  market varchar(40) not null,
  intent text not null,
  title text not null,
  subtitle text not null default '',
  search_theme text not null default '',
  cta text not null default '',
  secondary_cta text not null default '',
  package_ids text[] not null default '{}'::text[],
  status varchar(40) not null default 'draft',
  source varchar(40) not null default 'admin',
  active boolean not null default true,
  published_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (locale, slug),
  check (locale in ('en', 'jp')),
  check (market in ('japan', 'taiwan')),
  check (status in ('draft', 'published', 'paused', 'archived')),
  check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table if not exists public.contact_channel_settings (
  channel varchar(40) primary key,
  label varchar(80) not null,
  href text not null,
  official_account_id varchar(160),
  official_verified boolean not null default false,
  active boolean not null default true,
  display_order integer not null default 0,
  notes text,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (channel in ('whatsapp', 'line', 'wechat', 'kakao')),
  check (href ~ '^(https?://|weixin://)')
);

create table if not exists public.provider_operating_profiles (
  provider_id uuid primary key references public.providers(id) on delete cascade,
  public_exposure_status varchar(40) not null default 'blocked',
  data_source_status varchar(40) not null default 'demo_seed',
  supported_markets text[] not null default '{}'::text[],
  supported_languages text[] not null default '{}'::text[],
  standard_sla_hours integer not null default 24,
  urgent_sla_hours integer not null default 6,
  price_range_usd_min numeric(14,2),
  price_range_usd_max numeric(14,2),
  quote_template_ready boolean not null default false,
  deposit_policy_ready boolean not null default false,
  sla_contract_status varchar(40) not null default 'draft',
  verification_summary text,
  source_notes text,
  last_verified_at timestamptz,
  next_step text,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (public_exposure_status in ('blocked', 'candidate', 'ready', 'published')),
  check (data_source_status in ('demo_seed', 'candidate', 'verified_docs', 'contracted')),
  check (sla_contract_status in ('draft', 'sent', 'negotiating', 'pending_docs', 'signed')),
  check (standard_sla_hours > 0),
  check (urgent_sla_hours > 0),
  check (price_range_usd_min is null or price_range_usd_min >= 0),
  check (price_range_usd_max is null or price_range_usd_max >= coalesce(price_range_usd_min, 0))
);

create table if not exists public.provider_data_quality_checks (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  check_type varchar(80) not null,
  status varchar(40) not null default 'pending',
  evidence_url text,
  expires_at date,
  notes text,
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_id, check_type),
  check (check_type in ('foreign_patient_registration', 'malpractice_insurance', 'specialist', 'language_support', 'sla_contract', 'price_range', 'deposit_policy')),
  check (status in ('pending', 'verified', 'expired', 'rejected', 'not_applicable'))
);

create table if not exists public.notification_outbox (
  id varchar(120) primary key,
  case_id uuid references public.cases(id) on delete cascade,
  quote_id uuid references public.quotes(id) on delete set null,
  channel varchar(40) not null,
  recipient text,
  template varchar(120) not null,
  status varchar(40) not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  dispatch_result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (channel in ('email', 'whatsapp', 'kakao', 'line', 'sms')),
  check (status in ('queued', 'sent', 'failed'))
);

alter table public.case_activity_events drop constraint if exists case_activity_events_event_type_check;
alter table public.case_activity_events add constraint case_activity_events_event_type_check
check (event_type in (
  'partner_assigned',
  'partner_removed',
  'partner_shortlist_updated',
  'quote_requested',
  'provider_quote_submitted',
  'provider_quote_revised',
  'case_status_changed',
  'notification_queued',
  'notification_sent',
  'deposit_checkout_created'
));

create index if not exists admin_landing_routes_status_idx
on public.admin_landing_routes (status, active, updated_at desc);

create index if not exists provider_operating_profiles_status_idx
on public.provider_operating_profiles (public_exposure_status, data_source_status);

create index if not exists provider_data_quality_checks_provider_status_idx
on public.provider_data_quality_checks (provider_id, status, expires_at);

create index if not exists notification_outbox_case_created_idx
on public.notification_outbox (case_id, created_at desc);

alter table public.admin_landing_routes enable row level security;
alter table public.contact_channel_settings enable row level security;
alter table public.provider_operating_profiles enable row level security;
alter table public.provider_data_quality_checks enable row level security;
alter table public.notification_outbox enable row level security;

insert into public.contact_channel_settings (channel, label, href, official_account_id, official_verified, active, display_order, notes)
values
  ('whatsapp', 'WhatsApp', 'https://wa.me/YOUR_OFFICIAL_WHATSAPP_NUMBER', null, false, true, 10, 'Replace with the official WhatsApp Business account URL before launch.'),
  ('line', 'LINE', 'https://line.me/R/ti/p/YOUR_OFFICIAL_LINE_ID', null, false, true, 20, 'Replace with the official LINE account URL before launch.'),
  ('wechat', 'WeChat', 'weixin://dl/chat?YOUR_OFFICIAL_WECHAT_ID', null, false, true, 30, 'Replace with the official WeChat account ID before launch.'),
  ('kakao', 'KakaoTalk', 'https://pf.kakao.com/YOUR_OFFICIAL_KAKAO_ID/chat', null, false, true, 40, 'Replace with the official KakaoTalk channel URL before launch.')
on conflict (channel) do update
set
  label = excluded.label,
  href = case
    when public.contact_channel_settings.official_verified then public.contact_channel_settings.href
    else excluded.href
  end,
  active = excluded.active,
  display_order = excluded.display_order,
  notes = excluded.notes,
  updated_at = now();

update public.providers
set
  name_legal = case id
    when '20000000-0000-4000-8000-000000000001' then 'Gangnam Dermatology Candidate 01'
    when '20000000-0000-4000-8000-000000000002' then 'Gangnam Dermatology Candidate 02'
    when '20000000-0000-4000-8000-000000000003' then 'Gangnam Dermatology Candidate 03'
    when '20000000-0000-4000-8000-000000000004' then 'Apgujeong Dermatology Candidate 04'
    when '20000000-0000-4000-8000-000000000005' then 'Cheongdam Dermatology Candidate 05'
    else name_legal
  end,
  name_display = case id
    when '20000000-0000-4000-8000-000000000001' then '{"en":"Gangnam Dermatology Candidate 01"}'::jsonb
    when '20000000-0000-4000-8000-000000000002' then '{"en":"Gangnam Dermatology Candidate 02"}'::jsonb
    when '20000000-0000-4000-8000-000000000003' then '{"en":"Gangnam Dermatology Candidate 03"}'::jsonb
    when '20000000-0000-4000-8000-000000000004' then '{"en":"Apgujeong Dermatology Candidate 04"}'::jsonb
    when '20000000-0000-4000-8000-000000000005' then '{"en":"Cheongdam Dermatology Candidate 05"}'::jsonb
    else name_display
  end,
  address = case
    when id in (
      '20000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000002',
      '20000000-0000-4000-8000-000000000003',
      '20000000-0000-4000-8000-000000000004',
      '20000000-0000-4000-8000-000000000005'
    ) then 'Gangnam-gu, Seoul (exact address pending document verification)'
    else address
  end,
  medical_korea_registered = case
    when id in (
      '20000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000002',
      '20000000-0000-4000-8000-000000000003',
      '20000000-0000-4000-8000-000000000004',
      '20000000-0000-4000-8000-000000000005'
    ) then false
    else medical_korea_registered
  end,
  updated_at = now()
where id in (
  '20000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000002',
  '20000000-0000-4000-8000-000000000003',
  '20000000-0000-4000-8000-000000000004',
  '20000000-0000-4000-8000-000000000005'
);

insert into public.provider_operating_profiles (
  provider_id,
  public_exposure_status,
  data_source_status,
  supported_markets,
  supported_languages,
  standard_sla_hours,
  urgent_sla_hours,
  price_range_usd_min,
  price_range_usd_max,
  quote_template_ready,
  deposit_policy_ready,
  sla_contract_status,
  verification_summary,
  source_notes,
  next_step
)
values
  ('20000000-0000-4000-8000-000000000001', 'candidate', 'candidate', array['japan'], array['ja','en','ko'], 6, 4, 700, 1200, true, false, 'sent', 'Candidate record. Foreign-patient registration and insurance documents must be uploaded before public exposure.', 'Replace with signed SLA and provider documents.', 'Collect registration certificate and insurance evidence.'),
  ('20000000-0000-4000-8000-000000000002', 'candidate', 'candidate', array['japan'], array['ja','en','ko'], 8, 4, 1200, 2200, true, false, 'negotiating', 'Candidate record. Deposit/refund policy is not finalized.', 'Replace with signed SLA and provider documents.', 'Confirm deposit refund wording and SLA owner.'),
  ('20000000-0000-4000-8000-000000000003', 'candidate', 'candidate', array['taiwan'], array['en','zh','ko'], 12, 6, 900, 1800, true, false, 'draft', 'Candidate record. Taiwan support and price range need evidence.', 'Replace with signed SLA and provider documents.', 'Send first SLA draft and confirm language coverage.'),
  ('20000000-0000-4000-8000-000000000004', 'blocked', 'candidate', array['japan'], array['ja','en','ko'], 12, 6, 1500, 3000, true, false, 'pending_docs', 'Blocked until insurance and registration documents are verified.', 'Replace with signed SLA and provider documents.', 'Verify insurance before assigning cases.'),
  ('20000000-0000-4000-8000-000000000005', 'candidate', 'candidate', array['japan','taiwan'], array['ja','en','zh','ko'], 8, 4, 1500, 3000, false, false, 'sent', 'Candidate record. Quote template and public exposure review are still pending.', 'Replace with signed SLA and provider documents.', 'Finalize quote template and package price ranges.')
on conflict (provider_id) do update
set
  public_exposure_status = excluded.public_exposure_status,
  data_source_status = excluded.data_source_status,
  supported_markets = excluded.supported_markets,
  supported_languages = excluded.supported_languages,
  standard_sla_hours = excluded.standard_sla_hours,
  urgent_sla_hours = excluded.urgent_sla_hours,
  price_range_usd_min = excluded.price_range_usd_min,
  price_range_usd_max = excluded.price_range_usd_max,
  quote_template_ready = excluded.quote_template_ready,
  deposit_policy_ready = excluded.deposit_policy_ready,
  sla_contract_status = excluded.sla_contract_status,
  verification_summary = excluded.verification_summary,
  source_notes = excluded.source_notes,
  next_step = excluded.next_step,
  updated_at = now();

insert into public.provider_data_quality_checks (provider_id, check_type, status, notes)
select provider_id, check_type, 'pending', 'Required before public exposure.'
from public.provider_operating_profiles
cross join unnest(array[
  'foreign_patient_registration',
  'malpractice_insurance',
  'language_support',
  'sla_contract',
  'price_range',
  'deposit_policy'
]) as checks(check_type)
on conflict (provider_id, check_type) do nothing;

comment on table public.admin_landing_routes is 'Admin-managed EN/JP landing route drafts and publish state. Public rendering still uses approved application routes.';
comment on table public.contact_channel_settings is 'Official external messaging channel configuration. Keep official_verified false until account ownership is confirmed.';
comment on table public.provider_operating_profiles is 'Internal provider readiness profile for beta operations. Do not treat candidate/demo rows as public verified providers.';
comment on table public.provider_data_quality_checks is 'Evidence checklist for provider registration, insurance, language, SLA, and pricing readiness.';
comment on table public.notification_outbox is 'Server-written notification queue/audit table for quote/deposit/booking follow-up messages.';
