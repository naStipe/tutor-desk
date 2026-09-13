create table public.lesson_series (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.tutor_profile (user_id) on delete cascade,
  student_id uuid not null references public.student (id) on delete cascade,
  subject_id uuid null references public.subject (id) on delete set null,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_minutes smallint not null check (start_minutes between 0 and 1439),
  duration_minutes smallint not null default 60 check (duration_minutes > 0),
  start_date date not null,
  end_date date null,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  generated_until date not null default (current_date - 1),
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_series_date_order_check check (end_date is null or end_date >= start_date)
);

create index lesson_series_tutor_id_idx on public.lesson_series (tutor_id);
create index lesson_series_student_id_idx on public.lesson_series (student_id);
create index lesson_series_active_idx on public.lesson_series (status) where status = 'active';

alter table public.lesson_series enable row level security;

revoke all on table public.lesson_series from anon;
grant select, insert, update, delete on table public.lesson_series to authenticated;

create policy "Tutors can read their own lesson series"
on public.lesson_series for select to authenticated
using ((select auth.uid()) = tutor_id);

create policy "Tutors can create lesson series for their own students"
on public.lesson_series for insert to authenticated
with check (
  (select auth.uid()) = tutor_id
  and exists (select 1 from public.student s where s.id = student_id and s.tutor_id = tutor_id)
  and (
    subject_id is null
    or exists (select 1 from public.subject sub where sub.id = subject_id and sub.tutor_id = tutor_id)
  )
);

create policy "Tutors can update their own lesson series"
on public.lesson_series for update to authenticated
using ((select auth.uid()) = tutor_id)
with check (
  (select auth.uid()) = tutor_id
  and exists (select 1 from public.student s where s.id = student_id and s.tutor_id = tutor_id)
  and (
    subject_id is null
    or exists (select 1 from public.subject sub where sub.id = subject_id and sub.tutor_id = tutor_id)
  )
);
