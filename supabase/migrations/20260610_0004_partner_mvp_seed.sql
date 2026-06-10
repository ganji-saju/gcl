-- Optional MVP seed data for the partner-assisted operating flow.
-- Safe to re-run: all records are upserted by stable UUIDs.

insert into public.providers (
  id,
  name_legal,
  name_display,
  facility_type,
  address,
  city,
  district,
  country_code,
  medical_korea_registered,
  active,
  default_commission_cap_rate,
  average_response_minutes,
  quality_score
)
values
  ('20000000-0000-4000-8000-000000000001', 'Lumen Skin Center', '{"en":"Lumen Skin Center","ko":"루멘 스킨 센터"}', 'clinic', 'Gangnam-gu, Seoul', 'Seoul', 'Gangnam', 'KR', true, true, 0.3000, 360, 92),
  ('20000000-0000-4000-8000-000000000002', 'Prime Skin Gangnam', '{"en":"Prime Skin Gangnam","ko":"프라임 스킨 강남"}', 'clinic', 'Gangnam-gu, Seoul', 'Seoul', 'Gangnam', 'KR', true, true, 0.3000, 480, 86),
  ('20000000-0000-4000-8000-000000000003', 'Seoul Glow Dermatology', '{"en":"Seoul Glow Dermatology","ko":"서울 글로우 피부과"}', 'clinic', 'Gangnam-gu, Seoul', 'Seoul', 'Gangnam', 'KR', true, true, 0.3000, 720, 84),
  ('20000000-0000-4000-8000-000000000004', 'Apgujeong Laser Clinic', '{"en":"Apgujeong Laser Clinic","ko":"압구정 레이저 클리닉"}', 'clinic', 'Gangnam-gu, Seoul', 'Seoul', 'Gangnam', 'KR', true, false, 0.3000, 720, 72),
  ('20000000-0000-4000-8000-000000000005', 'Cheongdam Derm Wellness', '{"en":"Cheongdam Derm Wellness","ko":"청담 더마 웰니스"}', 'clinic', 'Gangnam-gu, Seoul', 'Seoul', 'Gangnam', 'KR', true, true, 0.3000, 480, 88)
on conflict (id) do update
set
  name_legal = excluded.name_legal,
  name_display = excluded.name_display,
  facility_type = excluded.facility_type,
  address = excluded.address,
  city = excluded.city,
  district = excluded.district,
  country_code = excluded.country_code,
  medical_korea_registered = excluded.medical_korea_registered,
  active = excluded.active,
  default_commission_cap_rate = excluded.default_commission_cap_rate,
  average_response_minutes = excluded.average_response_minutes,
  quality_score = excluded.quality_score,
  updated_at = now();

insert into public.partners (
  id,
  name,
  partner_type,
  contact_email,
  default_revenue_share_rate,
  active
)
values
  ('10000000-0000-4000-8000-000000000001', 'Tokyo Care Bridge', 'agency', 'ops+tokyo-care-bridge@example.com', 0.0000, true),
  ('10000000-0000-4000-8000-000000000002', 'Taipei Wellness Travel', 'travel_agency', 'ops+taipei-wellness@example.com', 0.0000, true),
  ('10000000-0000-4000-8000-000000000003', 'Seoul Med Interpreter Pool', 'interpreter', 'ops+seoul-interpreter@example.com', 0.0000, true)
on conflict (id) do update
set
  name = excluded.name,
  partner_type = excluded.partner_type,
  contact_email = excluded.contact_email,
  default_revenue_share_rate = excluded.default_revenue_share_rate,
  active = excluded.active,
  updated_at = now();

insert into public.partner_provider_relationships (
  partner_id,
  provider_id,
  relationship_status,
  allowed_services,
  notes,
  active
)
values
  ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'preferred', array['medical_agency','interpreter'], 'Japan market preferred dermatology partner.', true),
  ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'preferred', array['medical_agency','interpreter'], 'Japan market alternate provider.', true),
  ('10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000003', 'preferred', array['travel_agency','hotel_recovery'], 'Taiwan travel support preferred provider.', true),
  ('10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000005', 'preferred', array['travel_agency','hotel_recovery','airport_pickup'], 'Taiwan recovery support provider.', true),
  ('10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', 'preferred', array['interpreter'], 'Interpreter support for Japanese and English patients.', true),
  ('10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000005', 'preferred', array['interpreter','concierge'], 'Interpreter and recovery concierge support.', true)
on conflict (partner_id, provider_id) do update
set
  relationship_status = excluded.relationship_status,
  allowed_services = excluded.allowed_services,
  notes = excluded.notes,
  active = excluded.active,
  updated_at = now();
