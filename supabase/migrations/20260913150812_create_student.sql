create table public.student (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.tutor_profile (user_id) on delete cascade,
  name text not null,
  email text null,
  notes text null,
  archived_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index student_tutor_id_idx on public.student (tutor_id);

alter table public.student enable row level security;

revoke all on table public.student from anon;
grant select, insert, update on table public.student to authenticated;

create policy "Tutors can read their own students"
on public.student for select to authenticated
using ((select auth.uid()) = tutor_id);

create policy "Tutors can create their own students"
on public.student for insert to authenticated
with check ((select auth.uid()) = tutor_id);

create policy "Tutors can update their own students"
on public.student for update to authenticated
using ((select auth.uid()) = tutor_id)
with check ((select auth.uid()) = tutor_id);
