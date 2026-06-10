-- Phase 2 operating layer: immutable case activity timeline.
-- Keeps an audit trail for partner assignment, shortlist changes, quote requests,
-- and provider quote responses without opening public reads.

create table if not exists public.case_activity_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases(id) on delete cascade,
  actor_role varchar(40) not null,
  actor_label text,
  event_type varchar(80) not null,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (actor_role in ('system', 'admin', 'coordinator', 'partner', 'provider')),
  check (event_type in (
    'partner_assigned',
    'partner_removed',
    'partner_shortlist_updated',
    'quote_requested',
    'provider_quote_submitted',
    'provider_quote_revised',
    'case_status_changed'
  ))
);

create index if not exists case_activity_events_case_created_idx
on public.case_activity_events (case_id, created_at desc);

create index if not exists case_activity_events_type_created_idx
on public.case_activity_events (event_type, created_at desc);

alter table public.case_activity_events enable row level security;

comment on table public.case_activity_events is 'Server-written audit timeline for Phase 2 partner/provider operating actions.';
