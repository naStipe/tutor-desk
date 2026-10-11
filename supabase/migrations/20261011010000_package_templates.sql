-- Reusable package presets ("10 lessons for 450 EUR") that a tutor defines once and applies to any of
-- their students from the student's Billing tab. Applying one copies its values into a lesson_package.
create table public.package_template (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.tutor_profile (user_id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  total_lessons integer not null check (total_lessons between 1 and 1000),
  price numeric(10, 2) null check (price is null or price >= 0),
  currency text null check (currency is null or currency in ('RUB', 'EUR')),
  created_at timestamptz not null default now()
);

create index package_template_tutor_id_idx on public.package_template (tutor_id);

alter table public.package_template enable row level security;
revoke all on table public.package_template from anon;
grant select, insert, delete on table public.package_template to authenticated;

create policy "Tutors can read their own package templates"
on public.package_template for select to authenticated
using ((select auth.uid()) = tutor_id);

create policy "Tutors can create their own package templates"
on public.package_template for insert to authenticated
with check ((select auth.uid()) = tutor_id);

create policy "Tutors can delete their own package templates"
on public.package_template for delete to authenticated
using ((select auth.uid()) = tutor_id);
