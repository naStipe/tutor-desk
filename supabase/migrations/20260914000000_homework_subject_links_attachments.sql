alter table public.homework add column subject_id uuid null references public.subject (id) on delete set null;
alter table public.homework add column links jsonb not null default '[]'::jsonb;
create index homework_subject_id_idx on public.homework (subject_id);

drop policy if exists "Tutors can create homework for their own students and lessons" on public.homework;
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
  and (
    subject_id is null
    or exists (
      select 1 from public.subject sub
      where sub.id = subject_id and sub.tutor_id = tutor_id
    )
  )
);

drop policy if exists "Tutors can update their own homework" on public.homework;
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
  and (
    subject_id is null
    or exists (
      select 1 from public.subject sub
      where sub.id = subject_id and sub.tutor_id = tutor_id
    )
  )
);

create table public.homework_attachment (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid not null references public.homework (id) on delete cascade,
  tutor_id uuid not null references public.tutor_profile (user_id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  content_type text null,
  size_bytes bigint null,
  created_at timestamptz not null default now()
);

create index homework_attachment_homework_id_idx on public.homework_attachment (homework_id);

alter table public.homework_attachment enable row level security;

revoke all on table public.homework_attachment from anon;
grant select, insert, delete on table public.homework_attachment to authenticated;

create policy "Tutors can read their own homework attachments"
on public.homework_attachment for select to authenticated
using ((select auth.uid()) = tutor_id);

create policy "Tutors can add attachments to their own homework"
on public.homework_attachment for insert to authenticated
with check (
  (select auth.uid()) = tutor_id
  and exists (select 1 from public.homework h where h.id = homework_id and h.tutor_id = tutor_id)
);

create policy "Tutors can delete their own homework attachments"
on public.homework_attachment for delete to authenticated
using ((select auth.uid()) = tutor_id);
