-- Prepaid lesson packages ("buy 10 lessons"). A package belongs to one student. A lesson covered by
-- a package carries lesson.package_id and is marked paid. Balance is derived, never stored, so it
-- cannot drift:
--   booked    = linked lessons still 'scheduled' (reserved, released again if cancelled)
--   used      = linked lessons 'completed' or 'no_show'
--   remaining = total_lessons - booked - used
create table public.lesson_package (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.tutor_profile (user_id) on delete cascade,
  student_id uuid not null references public.student (id) on delete cascade,
  total_lessons integer not null check (total_lessons between 1 and 1000),
  price numeric(10, 2) null check (price is null or price >= 0),
  currency text null check (currency is null or currency in ('RUB', 'EUR')),
  note text null check (note is null or char_length(note) <= 500),
  purchased_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, student_id)
);

create index lesson_package_tutor_student_idx on public.lesson_package (tutor_id, student_id);
create index lesson_package_student_id_idx on public.lesson_package (student_id);

alter table public.lesson_package enable row level security;
revoke all on table public.lesson_package from anon;
grant select, insert, delete on table public.lesson_package to authenticated;

create policy "Tutors can read their own lesson packages"
on public.lesson_package for select to authenticated
using ((select auth.uid()) = tutor_id);

create policy "Tutors can create packages for their own students"
on public.lesson_package for insert to authenticated
with check (
  (select auth.uid()) = tutor_id
  and exists (select 1 from public.student s where s.id = student_id and s.tutor_id = tutor_id)
);

create policy "Tutors can delete their own lesson packages"
on public.lesson_package for delete to authenticated
using ((select auth.uid()) = tutor_id);

-- Composite FK: a lesson can only point at a package of the SAME student (and a student always
-- belongs to the lesson's tutor through the existing lesson policies), so a forged package_id of
-- another tutor's package is rejected. Deleting a package only clears package_id.
alter table public.lesson add column package_id uuid null;
alter table public.lesson
  add constraint lesson_package_same_student_fkey
  foreign key (package_id, student_id)
  references public.lesson_package (id, student_id)
  on delete set null (package_id);
create index lesson_package_id_idx on public.lesson (package_id);

-- Marks elapsed scheduled lessons completed. Runs as the caller (RLS applies): own lessons only.
create or replace function public.complete_elapsed_lessons()
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  n integer;
begin
  update public.lesson
  set status = 'completed', updated_at = now()
  where tutor_id = (select auth.uid())
    and status = 'scheduled'
    and end_time <= now();
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Keeps one student's package coverage in sync: releases credits of cancelled lessons, then covers
-- the earliest uncovered scheduled lessons while a package still has room. Runs as the caller.
create or replace function public.sync_student_package_credits(p_student_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tutor uuid := (select auth.uid());
  v_lesson uuid;
  v_package uuid;
begin
  if v_tutor is null then
    return;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_student_id::text, 0));

  update public.lesson
  set package_id = null, payment_status = 'unpaid', paid_at = null, updated_at = now()
  where tutor_id = v_tutor
    and student_id = p_student_id
    and status = 'cancelled'
    and package_id is not null;

  for v_lesson in
    select id from public.lesson
    where tutor_id = v_tutor
      and student_id = p_student_id
      and status = 'scheduled'
      and package_id is null
      and payment_status = 'unpaid'
    order by start_time
  loop
    select p.id into v_package
    from public.lesson_package p
    where p.tutor_id = v_tutor
      and p.student_id = p_student_id
      and p.total_lessons > (
        select count(*) from public.lesson x where x.package_id = p.id
      )
    order by p.purchased_at, p.created_at
    limit 1;

    exit when v_package is null;

    update public.lesson
    set package_id = v_package, payment_status = 'paid', paid_at = now(), updated_at = now()
    where id = v_lesson;
  end loop;
end;
$$;

revoke all on function public.complete_elapsed_lessons() from public, anon;
revoke all on function public.sync_student_package_credits(uuid) from public, anon;
grant execute on function public.complete_elapsed_lessons() to authenticated;
grant execute on function public.sync_student_package_credits(uuid) to authenticated;
