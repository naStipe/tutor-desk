create table public.lesson (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.tutor_profile (user_id) on delete cascade,
  student_id uuid not null references public.student (id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'scheduled',
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_status_check check (status in ('scheduled', 'completed', 'cancelled', 'no_show')),
  constraint lesson_time_order_check check (end_time > start_time)
);

create index lesson_tutor_id_start_time_idx on public.lesson (tutor_id, start_time);
create index lesson_student_id_idx on public.lesson (student_id);

alter table public.lesson enable row level security;

revoke all on table public.lesson from anon;
grant select, insert, update on table public.lesson to authenticated;

create policy "Tutors can read their own lessons"
on public.lesson for select to authenticated
using ((select auth.uid()) = tutor_id);

create policy "Tutors can create lessons for their own students"
on public.lesson for insert to authenticated
with check (
  (select auth.uid()) = tutor_id
  and exists (
    select 1 from public.student s
    where s.id = student_id and s.tutor_id = tutor_id
  )
);

create policy "Tutors can update their own lessons"
on public.lesson for update to authenticated
using ((select auth.uid()) = tutor_id)
with check (
  (select auth.uid()) = tutor_id
  and exists (
    select 1 from public.student s
    where s.id = student_id and s.tutor_id = tutor_id
  )
);
