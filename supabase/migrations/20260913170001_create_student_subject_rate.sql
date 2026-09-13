create table public.student_subject_rate (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.tutor_profile (user_id) on delete cascade,
  student_id uuid not null references public.student (id) on delete cascade,
  subject_id uuid not null references public.subject (id) on delete cascade,
  hourly_rate numeric(10, 2) not null check (hourly_rate > 0),
  currency text not null default 'RUB' check (currency in ('RUB', 'EUR')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, subject_id)
);

create index student_subject_rate_tutor_id_idx on public.student_subject_rate (tutor_id);
create index student_subject_rate_student_id_idx on public.student_subject_rate (student_id);

alter table public.student_subject_rate enable row level security;

revoke all on table public.student_subject_rate from anon;
grant select, insert, update, delete on table public.student_subject_rate to authenticated;

create policy "Tutors can read their own rates"
on public.student_subject_rate for select to authenticated
using ((select auth.uid()) = tutor_id);

create policy "Tutors can create rates for their own students and subjects"
on public.student_subject_rate for insert to authenticated
with check (
  (select auth.uid()) = tutor_id
  and exists (select 1 from public.student s where s.id = student_id and s.tutor_id = tutor_id)
  and exists (select 1 from public.subject sub where sub.id = subject_id and sub.tutor_id = tutor_id)
);

create policy "Tutors can update their own rates"
on public.student_subject_rate for update to authenticated
using ((select auth.uid()) = tutor_id)
with check (
  (select auth.uid()) = tutor_id
  and exists (select 1 from public.student s where s.id = student_id and s.tutor_id = tutor_id)
  and exists (select 1 from public.subject sub where sub.id = subject_id and sub.tutor_id = tutor_id)
);

create policy "Tutors can delete their own rates"
on public.student_subject_rate for delete to authenticated
using ((select auth.uid()) = tutor_id);
