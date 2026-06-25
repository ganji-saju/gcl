# Reservation Calendar, Temporary Hold, and Notification Flow

## Operating Surface

- Admin route: `/admin/reservation-calendar`
- Primary users: operations coordinators who already handle quote, deposit, and booking follow-up.
- Default local behavior: demo mode in Vite dev only, so the calendar can be reviewed without live credentials.
- Production behavior: internal gate requires a Supabase email-auth session whose email is active in `ops_user_access`.

## Data Structure

- `availability_slots` remains the source of provider supply.
- A temporary hold sets `status = 'held'`, `hold_expires_at`, `hold_case_id`, and `hold_quote_id`.
- Booking confirmation writes `bookings` with `status = 'confirmed'`, then marks the selected slot `booked`.
- `notification_outbox` can now carry `booking_id`, `send_after`, and `delivery_key` for idempotent immediate and scheduled messages.

## API Actions

- `createAvailabilitySlot`: creates provider availability from the calendar.
- `holdAvailabilitySlot`: places a short hold and queues `slot_hold_created`.
- `releaseAvailabilitySlot`: clears an unbooked hold and reopens the slot.
- `confirmHeldBooking`: confirms the booking, books the slot, advances the case to `booking_confirmed`, queues patient/provider confirmation notices, and queues a 24-hour reminder when the scheduled time is far enough in the future.

## Notification Templates

- `slot_hold_created`: patient-facing hold notice with expiry.
- `booking_confirmed_patient`: patient-facing booking confirmation.
- `booking_confirmed_provider`: provider operations notice.
- `booking_reminder_24h`: scheduled patient reminder using `send_after`.

## Guardrails

- A booked or unavailable slot cannot be held.
- An unexpired held slot cannot be taken by another case through the admin API.
- Booking confirmation validates that the quote, case, and provider match the selected slot.
- The Vite local demo bypass is scoped to this route and is stripped from production by `import.meta.env.DEV`.
