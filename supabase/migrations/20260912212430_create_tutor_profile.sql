create table public.tutor_profile (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tutor_profile enable row level security;

revoke all on table public.tutor_profile from anon;
grant select, insert, update on table public.tutor_profile to authenticated;

create policy "Tutors can read their own profile"
on public.tutor_profile for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Tutors can create their own profile"
on public.tutor_profile for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Tutors can update their own profile"
on public.tutor_profile for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
