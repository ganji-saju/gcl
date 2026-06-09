-- Public lead-capture policies for the v1 validation flow.
-- These policies allow anonymous inserts only. Public reads, updates, and deletes remain blocked.

alter table public.patients enable row level security;
alter table public.patient_eligibility_checks enable row level security;
alter table public.leads enable row level security;
alter table public.cases enable row level security;
alter table public.medical_intakes enable row level security;

drop policy if exists "Allow public patient inserts for lead capture" on public.patients;
create policy "Allow public patient inserts for lead capture"
on public.patients
for insert
to anon
with check (
  consent_medical_info = true
  and preferred_language in ('en', 'ja', 'zh', 'th', 'vi', 'ru', 'ko', 'ar')
);

drop policy if exists "Allow public eligibility check inserts for lead capture" on public.patient_eligibility_checks;
create policy "Allow public eligibility check inserts for lead capture"
on public.patient_eligibility_checks
for insert
to anon
with check (
  nationality <> ''
  and residence_country <> ''
);

drop policy if exists "Allow public lead inserts for validation" on public.leads;
create policy "Allow public lead inserts for validation"
on public.leads
for insert
to anon
with check (
  consent_medical_info = true
  and preferred_language in ('en', 'ja', 'zh', 'th', 'vi', 'ru', 'ko', 'ar')
  and (email is null or email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);

drop policy if exists "Allow public case inserts for eligible validation leads" on public.cases;
create policy "Allow public case inserts for eligible validation leads"
on public.cases
for insert
to anon
with check (
  status in ('new', 'qualified')
  and priority in ('low', 'normal', 'high', 'urgent')
);

drop policy if exists "Allow public intake inserts for validation leads" on public.medical_intakes;
create policy "Allow public intake inserts for validation leads"
on public.medical_intakes
for insert
to anon
with check (
  status in ('draft', 'submitted')
  and (budget_min is null or budget_min >= 0)
  and (budget_max is null or budget_max >= coalesce(budget_min, 0))
);

grant insert on public.patients to anon;
grant insert on public.patient_eligibility_checks to anon;
grant insert on public.leads to anon;
grant insert on public.cases to anon;
grant insert on public.medical_intakes to anon;
