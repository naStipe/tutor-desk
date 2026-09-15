-- Links a student row to their own auth.users account, plus a hashed invite token the tutor
-- shares with them once to establish that link.
alter table public.student
  add column user_id uuid null references auth.users (id) on delete set null,
  add column invite_token_hash text null,
  add column invite_token_expires_at timestamptz null;

create unique index student_user_id_key on public.student (user_id) where user_id is not null;

-- Students can read their own record and the tutor-owned rows that belong to it.
create policy "Students can read their own student row"
  on public.student for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Students can read their own lessons"
  on public.lesson for select
  to authenticated
  using (
    exists (
      select 1 from public.student s
      where s.id = lesson.student_id and s.user_id = (select auth.uid())
    )
  );

create policy "Students can read their own homework"
  on public.homework for select
  to authenticated
  using (
    exists (
      select 1 from public.student s
      where s.id = homework.student_id and s.user_id = (select auth.uid())
    )
  );

create policy "Students can read their tutor's subjects"
  on public.subject for select
  to authenticated
  using (
    exists (
      select 1 from public.student s
      where s.tutor_id = subject.tutor_id and s.user_id = (select auth.uid())
    )
  );

-- Accepting an invite and submitting homework both need to change exactly one thing under a
-- student's own identity without granting them a broad UPDATE policy on tutor-owned rows, so
-- both go through SECURITY DEFINER functions instead of RLS UPDATE policies.

create or replace function public.accept_student_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text := encode(digest(p_token, 'sha256'), 'hex');
  v_student_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Must be signed in to accept an invite';
  end if;

  select id into v_student_id
  from public.student
  where invite_token_hash = v_hash
    and invite_token_expires_at > now();

  if v_student_id is null then
    raise exception 'This invite link is invalid or has expired.';
  end if;

  update public.student
  set user_id = auth.uid(),
      invite_token_hash = null,
      invite_token_expires_at = null
  where id = v_student_id;

  return v_student_id;
end;
$$;

revoke all on function public.accept_student_invite(text) from public;
grant execute on function public.accept_student_invite(text) to authenticated;

create or replace function public.submit_homework(p_homework_id uuid, p_submission_text text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid;
begin
  select id into v_student_id from public.student where user_id = auth.uid();
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

revoke all on function public.submit_homework(uuid, text) from public;
grant execute on function public.submit_homework(uuid, text) to authenticated;
