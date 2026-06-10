-- Partner-assisted care MVP extension.
-- Scope: patient partner-service request signal, manual partner assignment,
-- partner-safe provider shortlist, and non-medical partner service quote basis.
-- This migration is additive and does not replace the existing referral-link model.

create table if not exists public.partner_services (
  id uuid primary key default gen_random_uuid(),
  service_code varchar(80) not null unique,
  name varchar(160) not null,
  service_type varchar(80) not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (service_type in ('medical_agency', 'personal_agent', 'interpreter', 'travel_agency', 'airport_pickup', 'hotel_recovery', 'concierge'))
);

create table if not exists public.partner_verifications (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  verification_type varchar(80) not null,
  status public.verification_status not null default 'pending',
  document_url text,
  issue_date date,
  expires_at date,
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (verification_type in ('business_registration', 'facilitator_registration', 'interpreter_credential', 'travel_license', 'insurance', 'other')),
  check (expires_at is null or issue_date is null or expires_at >= issue_date)
);

create table if not exists public.partner_service_requests (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  case_id uuid references public.cases(id) on delete cascade,
  assistance_mode varchar(40) not null default 'platform_direct',
  requested_services text[] not null default '{}'::text[],
  patient_notes text,
  consent_to_share_with_partners boolean not null default false,
  status varchar(40) not null default 'requested',
  request_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (assistance_mode in ('platform_direct', 'partner_requested', 'partner_originated', 'partner_managed')),
  check (status in ('requested', 'reviewing', 'assigned', 'declined', 'cancelled'))
);

create table if not exists public.case_partner_assignments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete restrict,
  assignment_role varchar(80) not null,
  status varchar(40) not null default 'assigned',
  consent_scope jsonb not null default '{}'::jsonb,
  assigned_by uuid references public.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id, partner_id, assignment_role),
  check (assignment_role in ('primary_agency', 'personal_agent', 'interpreter', 'travel_operator', 'concierge', 'recovery_support')),
  check (status in ('assigned', 'accepted', 'declined', 'removed', 'completed'))
);

create table if not exists public.partner_provider_relationships (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  relationship_status varchar(40) not null default 'preferred',
  allowed_services text[] not null default '{}'::text[],
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (partner_id, provider_id),
  check (relationship_status in ('preferred', 'contracted', 'blocked', 'trial', 'inactive'))
);

create table if not exists public.partner_provider_shortlists (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  partner_id uuid references public.partners(id) on delete set null,
  provider_id uuid not null references public.providers(id) on delete cascade,
  selected_by uuid references public.users(id) on delete set null,
  rank integer,
  selection_status varchar(40) not null default 'shortlisted',
  reason text,
  quote_request_ready boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id, partner_id, provider_id),
  check (rank is null or rank > 0),
  check (selection_status in ('shortlisted', 'pinned', 'excluded', 'quote_requested', 'rejected'))
);

create table if not exists public.partner_service_quotes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete restrict,
  service_request_id uuid references public.partner_service_requests(id) on delete set null,
  service_items jsonb not null default '[]'::jsonb,
  nonmedical_fee numeric(14,2) not null default 0,
  currency char(3) not null default 'USD',
  status varchar(40) not null default 'draft',
  valid_until date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (nonmedical_fee >= 0),
  check (status in ('draft', 'sent', 'accepted', 'expired', 'cancelled'))
);

insert into public.partner_services (service_code, name, service_type, description)
values
  ('medical_agency', 'Medical agency coordination', 'medical_agency', 'Agency-led non-medical coordination and patient support.'),
  ('personal_agent', 'Personal agent', 'personal_agent', 'Dedicated personal agent for patient communication and logistics.'),
  ('interpreter', 'Interpreter', 'interpreter', 'In-person or remote interpretation support.'),
  ('travel_agency', 'Travel planning', 'travel_agency', 'Flights, itinerary, and local travel planning support.'),
  ('airport_pickup', 'Airport pickup', 'airport_pickup', 'Airport pickup and transfer arrangement.'),
  ('hotel_recovery', 'Hotel and recovery support', 'hotel_recovery', 'Accommodation and recovery-stay support.')
on conflict (service_code) do update
set
  name = excluded.name,
  service_type = excluded.service_type,
  description = excluded.description,
  active = true,
  updated_at = now();

create index if not exists partner_service_requests_case_status_idx
on public.partner_service_requests (case_id, status, created_at desc);

create index if not exists partner_service_requests_lead_idx
on public.partner_service_requests (lead_id);

create index if not exists case_partner_assignments_case_status_idx
on public.case_partner_assignments (case_id, status);

create index if not exists case_partner_assignments_partner_status_idx
on public.case_partner_assignments (partner_id, status);

create index if not exists partner_provider_relationships_provider_idx
on public.partner_provider_relationships (provider_id, active);

create index if not exists partner_provider_shortlists_case_status_idx
on public.partner_provider_shortlists (case_id, selection_status, rank);

create index if not exists partner_service_quotes_case_status_idx
on public.partner_service_quotes (case_id, status, created_at desc);

alter table public.partner_services enable row level security;
alter table public.partner_verifications enable row level security;
alter table public.partner_service_requests enable row level security;
alter table public.case_partner_assignments enable row level security;
alter table public.partner_provider_relationships enable row level security;
alter table public.partner_provider_shortlists enable row level security;
alter table public.partner_service_quotes enable row level security;

drop policy if exists "Allow public partner service request inserts" on public.partner_service_requests;
create policy "Allow public partner service request inserts"
on public.partner_service_requests
for insert
to anon
with check (
  status = 'requested'
  and assistance_mode in ('platform_direct', 'partner_requested', 'partner_originated')
);

grant insert on public.partner_service_requests to anon;

comment on table public.partner_service_requests is 'Patient-requested partner assistance signal. Public inserts are allowed only for intake; reads require application/RLS scope.';
comment on table public.case_partner_assignments is 'Case-scoped assignment of partner organizations or agents. Partner access must be consent- and service-scoped.';
comment on table public.partner_provider_shortlists is 'Partner or coordinator selected provider candidates for a case. Compliance gates still apply before quote request.';
comment on table public.partner_service_quotes is 'Non-medical partner service quote. Keep separate from provider medical quotes and commission-cap checks.';
