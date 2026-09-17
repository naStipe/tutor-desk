-- Replace the single student.user_id column with a many-to-many membership model.
--
-- The old shape (one nullable unique user_id on student) forces one account per student and
-- can't express: a parent linked to several children, a child and their parent both linked to
-- the same student, or an adult student who is both learner and payer. It also makes every
-- portal account a "Parent/Child toggle" away from someone else's payment or admin view, since
-- there is only one identity slot per student.
--
-- portal_membership (user_id, student_id, role) lets any number of accounts attach to a student
-- under a specific role. portal_invite replaces the single hashed-token pair on student with its
-- own record per invite (role, email, expiry, revocation), so invites are auditable and a
-- student can have more than one outstanding invite (e.g. one for the child, one for a parent).

create table public.portal_membership (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  student_id uuid not null references public.student (id) on delete cascade,
  role text not null check (role in ('learner', 'guardian', 'payer')),
  created_at timestamptz not null default now(),
  unique (user_id, student_id, role)
);

create index portal_membership_user_id_idx on public.portal_membership (user_id);
create index portal_membership_student_id_idx on public.portal_membership (student_id);

alter table public.portal_membership enable row level security;

revoke all on table public.portal_membership from anon;
grant select on table public.portal_membership to authenticated;

create policy "Members can read their own membership rows"
on public.portal_membership for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Tutors can read membership rows for their own students"
on public.portal_membership for select to authenticated
using (
  exists (
    select 1 from public.student s
    where s.id = portal_membership.student_id and s.tutor_id = (select auth.uid())
  )
);

-- Every student currently linked to a portal account keeps that access, as a learner.
insert into public.portal_membership (user_id, student_id, role)
select user_id, id, 'learner' from public.student where user_id is not null;

create table public.portal_invite (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student (id) on delete cascade,
  role text not null check (role in ('learner', 'guardian', 'payer')),
  email text null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz null,
  accepted_at timestamptz null,
  accepted_by uuid null references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index portal_invite_student_id_idx on public.portal_invite (student_id);

alter table public.portal_invite enable row level security;

revoke all on table public.portal_invite from anon;
grant select, insert, update on table public.portal_invite to authenticated;

create policy "Tutors can manage invites for their own students"
on public.portal_invite for all to authenticated
using (
  exists (
    select 1 from public.student s
    where s.id = portal_invite.student_id and s.tutor_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.student s
    where s.id = portal_invite.student_id and s.tutor_id = (select auth.uid())
  )
);

-- These policies reference student.user_id, so they must go before the column does.
drop policy if exists "Students can read their own homework" on public.homework;
drop policy if exists "Students can read their tutor's subjects" on public.subject;
drop policy if exists "Students can read their tutor's profile" on public.tutor_profile;

alter table public.student
  drop column user_id,
  drop column invite_token_hash,
  drop column invite_token_expires_at;

drop function if exists public.accept_student_invite(text);

create or replace function public.accept_portal_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text := encode(digest(p_token, 'sha256'), 'hex');
  v_invite public.portal_invite%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Must be signed in to accept an invite';
  end if;

  select * into v_invite
  from public.portal_invite
  where token_hash = v_hash
    and expires_at > now()
    and revoked_at is null
    and accepted_at is null;

  if v_invite.id is null then
    raise exception 'This invite link is invalid or has expired.';
  end if;

  insert into public.portal_membership (user_id, student_id, role)
  values (auth.uid(), v_invite.student_id, v_invite.role)
  on conflict (user_id, student_id, role) do nothing;

  update public.portal_invite
  set accepted_at = now(), accepted_by = auth.uid()
  where id = v_invite.id;

  return v_invite.student_id;
end;
$$;

revoke all on function public.accept_portal_invite(text) from public;
grant execute on function public.accept_portal_invite(text) to authenticated;

-- Only a learner may submit their own work (parents/payers get read access, not this).
create or replace function public.submit_homework(p_homework_id uuid, p_submission_text text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid;
begin
  select h.student_id into v_student_id
  from public.homework h
  join public.portal_membership m
    on m.student_id = h.student_id and m.user_id = auth.uid() and m.role = 'learner'
  where h.id = p_homework_id;

  if v_student_id is null then
    raise exception 'Not signed in as a linked student';
  end if;

  update public.homework
  set submission_text = p_submission_text,
      submitted_at = now(),
      status = 'submitted',
      updated_at = now()
  where id = p_homework_id and student_id = v_student_id;

  if not found then
    raise exception 'Homework not found';
  end if;
end;
$$;

-- Portal reads: multi-student aware, still notes-free (see 20260917000000).
drop function if exists public.portal_get_student();

create or replace function public.portal_list_students()
returns table (id uuid, name text, tutor_id uuid, role text)
language sql
security definer
set search_path = public
stable
as $$
  select s.id, s.name, s.tutor_id, m.role
  from public.portal_membership m
  join public.student s on s.id = m.student_id
  where m.user_id = auth.uid()
  order by s.name, m.role;
$$;

revoke all on function public.portal_list_students() from public;
grant execute on function public.portal_list_students() to authenticated;

drop function if exists public.portal_list_lessons(timestamptz, timestamptz, int);

create or replace function public.portal_list_lessons(
  p_student_id uuid,
  p_start timestamptz default null,
  p_end timestamptz default null,
  p_limit int default 200
)
returns table (
  id uuid,
  student_id uuid,
  subject_id uuid,
  subject_name text,
  start_time timestamptz,
  end_time timestamptz,
  status text,
  meeting_url text,
  price numeric(10, 2),
  currency text,
  payment_status text,
  payment_method text,
  paid_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select l.id, l.student_id, l.subject_id, sub.name as subject_name,
         l.start_time, l.end_time, l.status,
         l.meeting_url, l.price, l.currency,
         l.payment_status, l.payment_method, l.paid_at
  from public.lesson l
  join public.portal_membership m on m.student_id = l.student_id and m.user_id = auth.uid()
  left join public.subject sub on sub.id = l.subject_id
  where l.student_id = p_student_id
    and (p_start is null or l.start_time >= p_start)
    and (p_end is null or l.start_time < p_end)
  order by l.start_time desc
  limit greatest(coalesce(p_limit, 200), 0);
$$;

revoke all on function public.portal_list_lessons(uuid, timestamptz, timestamptz, int) from public;
grant execute on function public.portal_list_lessons(uuid, timestamptz, timestamptz, int) to authenticated;

-- Recreate the policies dropped above, keyed off portal_membership instead of student.user_id.
create policy "Students can read their own homework"
on public.homework for select to authenticated
using (
  exists (
    select 1 from public.portal_membership m
    where m.student_id = homework.student_id and m.user_id = (select auth.uid())
  )
);

create policy "Students can read their tutor's subjects"
on public.subject for select to authenticated
using (
  exists (
    select 1 from public.portal_membership m
    join public.student s on s.id = m.student_id
    where s.tutor_id = subject.tutor_id and m.user_id = (select auth.uid())
  )
);

create policy "Students can read their tutor's profile"
on public.tutor_profile for select to authenticated
using (
  exists (
    select 1 from public.portal_membership m
    join public.student s on s.id = m.student_id
    where s.tutor_id = tutor_profile.user_id and m.user_id = (select auth.uid())
  )
);
