create table public.homework (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.tutor_profile (user_id) on delete cascade,
  student_id uuid not null references public.student (id) on delete cascade,
  lesson_id uuid null references public.lesson (id) on delete set null,
  title text not null,
  description text null,
  due_date date null,
  status text not null default 'assigned',
  submission_text text null,
  submitted_at timestamptz null,
  feedback_text text null,
  feedback_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint homework_status_check check (status in ('assigned', 'submitted', 'reviewed'))
);

create index homework_tutor_id_due_date_idx on public.homework (tutor_id, due_date);
create index homework_student_id_idx on public.homework (student_id);
create index homework_lesson_id_idx on public.homework (lesson_id);

alter table public.homework enable row level security;

revoke all on table public.homework from anon;
grant select, insert, update on table public.homework to authenticated;

create policy "Tutors can read their own homework"
on public.homework for select to authenticated
using ((select auth.uid()) = tutor_id);

create policy "Tutors can create homework for their own students and lessons"
on public.homework for insert to authenticated
with check (
  (select auth.uid()) = tutor_id
  and exists (
    select 1 from public.student s
    where s.id = student_id and s.tutor_id = tutor_id
  )
  and (
    lesson_id is null
    or exists (
      select 1 from public.lesson l
      where l.id = lesson_id and l.tutor_id = tutor_id
    )
  )
);

create policy "Tutors can update their own homework"
on public.homework for update to authenticated
using ((select auth.uid()) = tutor_id)
with check (
  (select auth.uid()) = tutor_id
  and exists (
    select 1 from public.student s
    where s.id = student_id and s.tutor_id = tutor_id
  )
  and (
    lesson_id is null
    or exists (
      select 1 from public.lesson l
      where l.id = lesson_id and l.tutor_id = tutor_id
    )
  )
);
