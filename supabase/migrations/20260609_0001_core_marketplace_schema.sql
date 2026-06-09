-- Global Patient Hub v1 core schema
-- Scope: compliant international patient marketplace + coordinator CRM + quote/booking engine.
-- This migration is additive and does not remove the existing public.inquiries POC table.

create extension if not exists pgcrypto;
create extension if not exists citext;

do $$
begin
  create type public.user_role as enum ('patient', 'provider', 'coordinator', 'admin', 'partner');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.user_status as enum ('invited', 'active', 'suspended', 'deleted');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.facility_type as enum ('clinic', 'hospital', 'general_hospital', 'tertiary_hospital');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.registration_type as enum ('foreign_patient_provider', 'facilitator');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.verification_status as enum ('pending', 'verified', 'expired', 'rejected');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.content_review_status as enum ('draft', 'pending', 'approved', 'rejected', 'revision_required');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.case_status as enum (
    'new',
    'qualified',
    'intake_completed',
    'matching_ready',
    'matched',
    'quote_requested',
    'quote_sent',
    'deposit_pending',
    'deposit_paid',
    'booking_confirmed',
    'visited',
    'treated',
    'aftercare',
    'closed_won',
    'closed_lost'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.case_priority as enum ('low', 'normal', 'high', 'urgent');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.intake_status as enum ('draft', 'submitted', 'reviewed');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.quote_request_status as enum ('requested', 'responded', 'cancelled', 'expired');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.quote_status as enum ('draft', 'sent', 'accepted', 'expired', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.booking_status as enum ('requested', 'confirmed', 'rescheduled', 'completed', 'cancelled', 'no_show');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.visit_type as enum ('consultation', 'procedure', 'surgery', 'checkup');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.payment_type as enum ('deposit', 'balance', 'refund');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.payment_status as enum ('pending', 'authorized', 'paid', 'failed', 'refunded');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.settlement_cycle as enum ('monthly', 'per_case');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.contract_status as enum ('active', 'expired', 'suspended');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.content_type as enum ('procedure_page', 'package', 'doctor_profile', 'review', 'ad');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.report_submission_status as enum ('draft', 'submitted', 'accepted', 'correction_required');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.message_channel as enum ('whatsapp', 'line', 'wechat', 'email', 'sms', 'in_app', 'phone');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.message_direction as enum ('inbound', 'outbound', 'internal_note');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.document_type as enum (
    'passport',
    'medical_record',
    'image',
    'consent',
    'provider_registration',
    'insurance_certificate',
    'specialist_certificate',
    'business_registration',
    'other'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.slot_status as enum ('available', 'held', 'booked', 'unavailable');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.lead_status as enum ('new', 'qualified', 'disqualified', 'converted', 'closed');
exception when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.facility_commission_cap(p_facility_type public.facility_type)
returns numeric
language sql
immutable
as $$
  select case p_facility_type
    when 'clinic' then 0.3000
    when 'hospital' then 0.2000
    when 'general_hospital' then 0.2000
    when 'tertiary_hospital' then 0.1500
  end
$$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email citext unique,
  phone varchar(40),
  full_name text,
  role public.user_role not null,
  status public.user_status not null default 'active',
  locale varchar(12) not null default 'en',
  timezone varchar(64),
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (locale in ('en', 'ja', 'zh', 'th', 'vi', 'ru', 'ko', 'ar'))
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.users(id) on delete set null,
  nationality varchar(80),
  residence_country varchar(80),
  preferred_language varchar(12) not null default 'en',
  foreign_patient_eligible boolean,
  eligibility_reason text,
  passport_required_later boolean not null default true,
  consent_medical_info boolean not null default false,
  consent_marketing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.patient_eligibility_checks (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete set null,
  nationality varchar(80) not null,
  residence_country varchar(80) not null,
  has_korean_national_health_insurance boolean not null default false,
  has_korean_alien_registration boolean not null default false,
  has_overseas_korean_residence_report boolean not null default false,
  purpose varchar(120),
  eligible boolean not null,
  reason varchar(120) not null,
  checked_by uuid references public.users(id) on delete set null,
  checked_at timestamptz not null default now(),
  request_snapshot jsonb not null default '{}'::jsonb
);

create table if not exists public.procedure_categories (
  id uuid primary key default gen_random_uuid(),
  slug varchar(120) not null unique,
  name jsonb not null,
  description jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.procedures (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.procedure_categories(id) on delete restrict,
  slug varchar(160) not null unique,
  name jsonb not null,
  description jsonb not null default '{}'::jsonb,
  recovery_days_min integer not null default 0,
  recovery_days_max integer not null default 0,
  requires_medical_review boolean not null default true,
  ad_review_required boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (recovery_days_min >= 0),
  check (recovery_days_max >= recovery_days_min)
);

create table if not exists public.procedure_content_pages (
  id uuid primary key default gen_random_uuid(),
  procedure_id uuid not null references public.procedures(id) on delete cascade,
  locale varchar(12) not null,
  title text not null,
  body jsonb not null default '{}'::jsonb,
  price_disclaimer text,
  seo_title text,
  meta_description text,
  content_review_status public.content_review_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (procedure_id, locale)
);

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  name_legal varchar(240) not null,
  name_display jsonb not null,
  facility_type public.facility_type not null,
  address text not null,
  city varchar(80) not null default 'Seoul',
  district varchar(80),
  country_code char(2) not null default 'KR',
  medical_korea_registered boolean not null default false,
  active boolean not null default false,
  default_commission_cap_rate numeric(5,4) not null,
  average_response_minutes integer not null default 0,
  quality_score numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (default_commission_cap_rate >= 0 and default_commission_cap_rate <= public.facility_commission_cap(facility_type)),
  check (average_response_minutes >= 0),
  check (quality_score >= 0 and quality_score <= 100)
);

create table if not exists public.provider_registrations (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  registration_type public.registration_type not null,
  registration_no varchar(120) not null,
  issued_at date,
  expires_at date,
  insurance_provider varchar(200),
  insurance_coverage_amount numeric(14,2),
  verified_status public.verification_status not null default 'pending',
  verified_by uuid references public.users(id) on delete set null,
  verified_at timestamptz,
  document_url text,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_id, registration_type, registration_no),
  check (expires_at is null or issued_at is null or expires_at >= issued_at),
  check (insurance_coverage_amount is null or insurance_coverage_amount >= 0)
);

create table if not exists public.provider_departments (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  name jsonb not null,
  specialty varchar(160) not null,
  languages text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.provider_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  job_title varchar(160),
  permissions jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider_id)
);

create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  department_id uuid references public.provider_departments(id) on delete set null,
  name jsonb not null,
  specialty varchar(160) not null,
  license_no_hash varchar(128),
  years_experience integer,
  languages text[] not null default '{}',
  profile_status public.content_review_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (years_experience is null or years_experience >= 0)
);

create table if not exists public.provider_procedures (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  procedure_id uuid not null references public.procedures(id) on delete restrict,
  doctor_id uuid references public.doctors(id) on delete set null,
  available boolean not null default true,
  medical_fee_min numeric(14,2),
  medical_fee_max numeric(14,2),
  currency char(3) not null default 'KRW',
  clinical_notes text,
  content_review_status public.content_review_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_id, procedure_id, doctor_id),
  check (medical_fee_min is null or medical_fee_min >= 0),
  check (medical_fee_max is null or medical_fee_max >= coalesce(medical_fee_min, 0))
);

create table if not exists public.treatment_packages (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  procedure_id uuid not null references public.procedures(id) on delete restrict,
  package_name jsonb not null,
  medical_fee_min numeric(14,2) not null,
  medical_fee_max numeric(14,2) not null,
  nonmedical_fee_min numeric(14,2) not null default 0,
  nonmedical_fee_max numeric(14,2) not null default 0,
  currency char(3) not null default 'KRW',
  duration_days integer not null default 1,
  included_items jsonb not null default '[]'::jsonb,
  excluded_items jsonb not null default '[]'::jsonb,
  content_review_status public.content_review_status not null default 'draft',
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (medical_fee_min >= 0),
  check (medical_fee_max >= medical_fee_min),
  check (nonmedical_fee_min >= 0),
  check (nonmedical_fee_max >= nonmedical_fee_min),
  check (duration_days > 0)
);

create table if not exists public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  doctor_id uuid references public.doctors(id) on delete set null,
  procedure_id uuid references public.procedures(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.slot_status not null default 'available',
  language_support text[] not null default '{}',
  hold_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.commission_contracts (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  effective_from date not null,
  effective_to date,
  base_rate numeric(5,4) not null,
  cap_rate numeric(5,4) not null,
  settlement_cycle public.settlement_cycle not null default 'monthly',
  status public.contract_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from),
  check (base_rate >= 0 and base_rate <= cap_rate),
  check (cap_rate >= 0 and cap_rate <= 0.3000)
);

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name varchar(240) not null,
  partner_type varchar(80) not null,
  contact_email citext,
  contact_phone varchar(40),
  default_revenue_share_rate numeric(5,4) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (default_revenue_share_rate >= 0 and default_revenue_share_rate <= 1)
);

create table if not exists public.referral_links (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  code varchar(80) not null unique,
  landing_path text not null,
  campaign varchar(160),
  active boolean not null default true,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete set null,
  referral_link_id uuid references public.referral_links(id) on delete set null,
  name text,
  email citext,
  phone varchar(40),
  nationality varchar(80),
  residence_country varchar(80),
  preferred_language varchar(12) not null default 'en',
  desired_procedure_id uuid references public.procedures(id) on delete set null,
  treatment_interest text,
  budget_min numeric(14,2),
  budget_max numeric(14,2),
  currency char(3),
  status public.lead_status not null default 'new',
  source varchar(80),
  attribution jsonb not null default '{}'::jsonb,
  assigned_coordinator_id uuid references public.users(id) on delete set null,
  disqualified_reason text,
  consent_medical_info boolean not null default false,
  consent_marketing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (budget_min is null or budget_min >= 0),
  check (budget_max is null or budget_max >= coalesce(budget_min, 0))
);

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete restrict,
  lead_id uuid references public.leads(id) on delete set null,
  owner_coordinator_id uuid references public.users(id) on delete set null,
  desired_procedure_id uuid references public.procedures(id) on delete set null,
  source varchar(80),
  status public.case_status not null default 'new',
  priority public.case_priority not null default 'normal',
  last_contacted_at timestamptz,
  closed_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.medical_intakes (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  desired_procedure_id uuid references public.procedures(id) on delete set null,
  chief_request text,
  medical_history jsonb not null default '{}'::jsonb,
  medications jsonb not null default '[]'::jsonb,
  allergies jsonb not null default '[]'::jsonb,
  budget_min numeric(14,2),
  budget_max numeric(14,2),
  currency char(3) not null default 'USD',
  travel_start_date date,
  travel_end_date date,
  risk_flags jsonb not null default '{}'::jsonb,
  status public.intake_status not null default 'draft',
  submitted_at timestamptz,
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id),
  check (budget_min is null or budget_min >= 0),
  check (budget_max is null or budget_max >= coalesce(budget_min, 0)),
  check (travel_end_date is null or travel_start_date is null or travel_end_date >= travel_start_date)
);

create table if not exists public.patient_documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  case_id uuid references public.cases(id) on delete cascade,
  document_type public.document_type not null,
  file_url text not null,
  file_sha256 varchar(128),
  uploaded_by uuid references public.users(id) on delete set null,
  verified_status public.verification_status not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.case_matches (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  doctor_id uuid references public.doctors(id) on delete set null,
  match_score numeric(6,2),
  score_breakdown jsonb not null default '{}'::jsonb,
  rank integer,
  is_promoted boolean not null default false,
  excluded_reason text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (case_id, provider_id, doctor_id),
  check (match_score is null or (match_score >= 0 and match_score <= 100)),
  check (rank is null or rank > 0)
);

create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  case_match_id uuid references public.case_matches(id) on delete set null,
  requested_by uuid references public.users(id) on delete set null,
  status public.quote_request_status not null default 'requested',
  due_at timestamptz,
  notes text,
  requested_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id, provider_id, case_match_id)
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid references public.quote_requests(id) on delete set null,
  case_id uuid not null references public.cases(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete restrict,
  medical_fee numeric(14,2) not null,
  nonmedical_fee numeric(14,2) not null default 0,
  currency char(3) not null,
  commission_rate numeric(5,4) not null,
  commission_amount numeric(14,2) generated always as (round(medical_fee * commission_rate, 2)) stored,
  commission_cap_rate numeric(5,4) not null,
  deposit_amount numeric(14,2) not null default 0,
  valid_until timestamptz not null,
  status public.quote_status not null default 'draft',
  notes text,
  created_by uuid references public.users(id) on delete set null,
  sent_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (medical_fee >= 0),
  check (nonmedical_fee >= 0),
  check (commission_rate >= 0),
  check (commission_cap_rate >= 0),
  check (commission_rate <= commission_cap_rate),
  check (deposit_amount >= 0),
  check (deposit_amount <= medical_fee + nonmedical_fee)
);

create table if not exists public.commission_checks (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.quotes(id) on delete cascade,
  case_id uuid references public.cases(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  requested_rate numeric(5,4) not null,
  cap_rate numeric(5,4) not null,
  passed boolean not null,
  violation_code varchar(80),
  checked_by uuid references public.users(id) on delete set null,
  checked_at timestamptz not null default now(),
  check (requested_rate >= 0),
  check (cap_rate >= 0)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete restrict,
  provider_id uuid not null references public.providers(id) on delete restrict,
  scheduled_at timestamptz not null,
  visit_type public.visit_type not null,
  status public.booking_status not null default 'requested',
  cancellation_reason text,
  refund_policy_snapshot jsonb not null default '{}'::jsonb,
  idempotency_key varchar(160),
  created_by uuid references public.users(id) on delete set null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idempotency_key)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  payment_type public.payment_type not null,
  amount numeric(14,2) not null,
  currency char(3) not null,
  provider varchar(80) not null,
  status public.payment_status not null default 'pending',
  transaction_ref varchar(200),
  idempotency_key varchar(160),
  metadata jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, transaction_ref),
  unique (idempotency_key),
  check (amount >= 0)
);

create table if not exists public.treatment_visits (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  provider_id uuid not null references public.providers(id) on delete restrict,
  visit_type public.visit_type not null,
  visited_at timestamptz not null,
  outcome_status varchar(80) not null,
  gross_medical_revenue numeric(14,2) not null default 0,
  currency char(3) not null default 'KRW',
  notes text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (gross_medical_revenue >= 0)
);

create table if not exists public.aftercare_tasks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  assigned_to uuid references public.users(id) on delete set null,
  task_type varchar(80) not null,
  due_at timestamptz not null,
  completed_at timestamptz,
  status varchar(40) not null default 'open',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('open', 'in_progress', 'completed', 'cancelled'))
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  rating integer not null,
  body text,
  locale varchar(12) not null default 'en',
  consent_to_publish boolean not null default false,
  content_review_status public.content_review_status not null default 'pending',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (rating between 1 and 5)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  sender_user_id uuid references public.users(id) on delete set null,
  channel public.message_channel not null,
  direction public.message_direction not null,
  body text,
  attachments jsonb not null default '[]'::jsonb,
  external_ref varchar(200),
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.attribution_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  case_id uuid references public.cases(id) on delete set null,
  session_id varchar(160),
  event_name varchar(120) not null,
  source varchar(120),
  medium varchar(120),
  campaign varchar(160),
  keyword varchar(200),
  referrer text,
  landing_path text,
  event_payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table if not exists public.procedure_views (
  id uuid primary key default gen_random_uuid(),
  procedure_id uuid not null references public.procedures(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  session_id varchar(160),
  locale varchar(12),
  source varchar(120),
  occurred_at timestamptz not null default now()
);

create table if not exists public.content_reviews (
  id uuid primary key default gen_random_uuid(),
  content_type public.content_type not null,
  content_id uuid not null,
  submitted_by uuid references public.users(id) on delete set null,
  review_status public.content_review_status not null default 'pending',
  risk_flags jsonb not null default '{}'::jsonb,
  reviewer_notes text,
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id) on delete set null,
  actor_role public.user_role,
  entity_table varchar(120) not null,
  entity_id uuid,
  action varchar(80) not null,
  before_state jsonb,
  after_state jsonb,
  reason text,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.partner_commissions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  payment_id uuid references public.payments(id) on delete set null,
  base_platform_revenue numeric(14,2) not null,
  revenue_share_rate numeric(5,4) not null,
  commission_amount numeric(14,2) generated always as (round(base_platform_revenue * revenue_share_rate, 2)) stored,
  currency char(3) not null,
  status varchar(40) not null default 'pending',
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (base_platform_revenue >= 0),
  check (revenue_share_rate >= 0 and revenue_share_rate <= 1),
  check (status in ('pending', 'approved', 'paid', 'void'))
);

create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  gross_medical_revenue numeric(14,2) not null default 0,
  commission_amount numeric(14,2) not null default 0,
  nonmedical_margin numeric(14,2) not null default 0,
  currency char(3) not null default 'KRW',
  status varchar(40) not null default 'draft',
  approved_by uuid references public.users(id) on delete set null,
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end >= period_start),
  check (gross_medical_revenue >= 0),
  check (commission_amount >= 0),
  check (nonmedical_margin >= 0),
  check (status in ('draft', 'approved', 'paid', 'disputed', 'void'))
);

create table if not exists public.annual_performance_reports (
  id uuid primary key default gen_random_uuid(),
  report_year integer not null,
  provider_id uuid not null references public.providers(id) on delete cascade,
  patient_count integer not null default 0,
  gross_medical_revenue numeric(14,2) not null default 0,
  commission_paid numeric(14,2) not null default 0,
  currency char(3) not null default 'KRW',
  submitted_at timestamptz,
  submission_status public.report_submission_status not null default 'draft',
  export_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (report_year, provider_id),
  check (report_year between 2000 and 2100),
  check (patient_count >= 0),
  check (gross_medical_revenue >= 0),
  check (commission_paid >= 0)
);

create index if not exists users_role_idx on public.users (role);
create index if not exists patients_residence_country_idx on public.patients (residence_country);
create index if not exists eligibility_checks_patient_idx on public.patient_eligibility_checks (patient_id, checked_at desc);
create index if not exists procedures_category_active_idx on public.procedures (category_id, active);
create index if not exists providers_facility_active_idx on public.providers (facility_type, active);
create index if not exists provider_registrations_provider_status_idx on public.provider_registrations (provider_id, verified_status, expires_at);
create index if not exists provider_procedures_lookup_idx on public.provider_procedures (procedure_id, available, content_review_status);
create index if not exists treatment_packages_provider_procedure_idx on public.treatment_packages (provider_id, procedure_id, active);
create index if not exists availability_slots_provider_time_idx on public.availability_slots (provider_id, starts_at, status);
create index if not exists leads_status_created_idx on public.leads (status, created_at desc);
create index if not exists leads_attribution_gin_idx on public.leads using gin (attribution);
create index if not exists cases_status_priority_idx on public.cases (status, priority, created_at desc);
create index if not exists cases_owner_status_idx on public.cases (owner_coordinator_id, status);
create index if not exists medical_intakes_case_idx on public.medical_intakes (case_id);
create index if not exists case_matches_case_rank_idx on public.case_matches (case_id, rank);
create index if not exists quote_requests_provider_status_idx on public.quote_requests (provider_id, status, due_at);
create index if not exists quotes_case_status_idx on public.quotes (case_id, status);
create index if not exists bookings_provider_time_idx on public.bookings (provider_id, scheduled_at, status);
create index if not exists payments_case_status_idx on public.payments (case_id, status);
create index if not exists messages_case_sent_idx on public.messages (case_id, sent_at desc);
create index if not exists attribution_events_session_idx on public.attribution_events (session_id, occurred_at);
create index if not exists content_reviews_status_idx on public.content_reviews (review_status, created_at);
create index if not exists audit_logs_entity_idx on public.audit_logs (entity_table, entity_id, created_at desc);
create index if not exists annual_reports_year_provider_idx on public.annual_performance_reports (report_year, provider_id);

do $$
declare
  t text;
begin
  foreach t in array array[
    'users',
    'patients',
    'procedure_categories',
    'procedures',
    'procedure_content_pages',
    'providers',
    'provider_registrations',
    'provider_departments',
    'provider_users',
    'doctors',
    'provider_procedures',
    'treatment_packages',
    'availability_slots',
    'commission_contracts',
    'partners',
    'leads',
    'cases',
    'medical_intakes',
    'patient_documents',
    'quote_requests',
    'quotes',
    'bookings',
    'payments',
    'treatment_visits',
    'aftercare_tasks',
    'reviews',
    'content_reviews',
    'partner_commissions',
    'settlements',
    'annual_performance_reports'
  ]
  loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', t, t);
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

comment on table public.providers is 'Registered Korean providers. Public exposure requires active=true, Medical Korea registration, verified registration, and approved content.';
comment on table public.quotes is 'Medical and non-medical fees are separated. commission_rate <= commission_cap_rate is enforced by check constraint.';
comment on table public.content_reviews is 'Compliance review queue for procedure pages, packages, doctor profiles, reviews, and ads.';
comment on table public.audit_logs is 'Append-only audit trail for medical information, quote, commission, booking, payment, and content-review changes.';
