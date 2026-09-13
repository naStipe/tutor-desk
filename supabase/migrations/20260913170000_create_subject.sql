create table public.subject (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.tutor_profile (user_id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  constraint subject_name_not_blank check (btrim(name) <> '')
);

create index subject_tutor_id_idx on public.subject (tutor_id);
create unique index subject_tutor_id_name_idx on public.subject (tutor_id, lower(name));

alter table public.subject enable row level security;

revoke all on table public.subject from anon;
grant select, insert, update, delete on table public.subject to authenticated;

create policy "Tutors can read their own subjects"
on public.subject for select to authenticated
using ((select auth.uid()) = tutor_id);

create policy "Tutors can create their own subjects"
on public.subject for insert to authenticated
with check ((select auth.uid()) = tutor_id);

create policy "Tutors can update their own subjects"
on public.subject for update to authenticated
using ((select auth.uid()) = tutor_id)
with check ((select auth.uid()) = tutor_id);

create policy "Tutors can delete their own subjects"
on public.subject for delete to authenticated
using ((select auth.uid()) = tutor_id);
