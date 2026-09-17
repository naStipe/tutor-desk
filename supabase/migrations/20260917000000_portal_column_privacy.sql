-- RLS restricts which rows a role can see, not which columns. The "Students can read their own
-- student row" / "own lessons" policies let a signed-in student query public.student and
-- public.lesson directly over PostgREST with their own JWT and get every column, including
-- tutor-private notes, even though the portal UI never renders them. Column-level GRANT/REVOKE
-- can't fix this either, since tutors and students share the same "authenticated" Postgres role.
--
-- Fix: drop the broad row policies for students and replace portal reads with SECURITY DEFINER
-- functions (same pattern already used for accept_student_invite / submit_homework) that return
-- an explicit, notes-free column list.

drop policy if exists "Students can read their own student row" on public.student;
drop policy if exists "Students can read their own lessons" on public.lesson;

create or replace function public.portal_get_student()
returns table (id uuid, name text, tutor_id uuid)
language sql
security definer
set search_path = public
stable
as $$
  select s.id, s.name, s.tutor_id
  from public.student s
  where s.user_id = auth.uid();
$$;

revoke all on function public.portal_get_student() from public;
grant execute on function public.portal_get_student() to authenticated;

create or replace function public.portal_list_lessons(
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
  join public.student s on s.id = l.student_id
  left join public.subject sub on sub.id = l.subject_id
  where s.user_id = auth.uid()
    and (p_start is null or l.start_time >= p_start)
    and (p_end is null or l.start_time < p_end)
  order by l.start_time desc
  limit greatest(coalesce(p_limit, 200), 0);
$$;

revoke all on function public.portal_list_lessons(timestamptz, timestamptz, int) from public;
grant execute on function public.portal_list_lessons(timestamptz, timestamptz, int) to authenticated;
