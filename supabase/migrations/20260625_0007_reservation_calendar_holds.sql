-- Reservation calendar operating layer: slot holds, booking-linked outbox, and audit events.

alter table public.availability_slots
  add column if not exists hold_case_id uuid references public.cases(id) on delete set null,
  add column if not exists hold_quote_id uuid references public.quotes(id) on delete set null;

create index if not exists availability_slots_hold_expiry_idx
on public.availability_slots (hold_expires_at)
where status = 'held';

create index if not exists availability_slots_hold_case_idx
on public.availability_slots (hold_case_id)
where hold_case_id is not null;

alter table public.notification_outbox
  add column if not exists booking_id uuid references public.bookings(id) on delete set null,
  add column if not exists send_after timestamptz not null default now(),
  add column if not exists delivery_key varchar(160);

create index if not exists notification_outbox_send_after_idx
on public.notification_outbox (status, send_after);

create index if not exists notification_outbox_booking_idx
on public.notification_outbox (booking_id, created_at desc)
where booking_id is not null;

create unique index if not exists notification_outbox_delivery_key_idx
on public.notification_outbox (delivery_key)
where delivery_key is not null;

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
  'deposit_checkout_created',
  'availability_slot_created',
  'availability_slot_held',
  'availability_slot_released',
  'booking_confirmed_from_slot',
  'booking_reminder_queued'
));

comment on column public.availability_slots.hold_case_id is 'Case that owns the current temporary hold, when a slot is held.';
comment on column public.availability_slots.hold_quote_id is 'Quote associated with the current temporary hold, when available.';
comment on column public.notification_outbox.send_after is 'Earliest time this queued notification should be dispatched.';
comment on column public.notification_outbox.delivery_key is 'Optional idempotency key for scheduled or booking-linked notifications.';
