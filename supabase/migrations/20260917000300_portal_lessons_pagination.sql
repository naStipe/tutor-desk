-- Add offset support and a matching count function so the portal lessons page can paginate
-- instead of loading up to 200 rows into one unpaginated table.
drop function if exists public.portal_list_lessons(uuid, timestamptz, timestamptz, int);

create or replace function public.portal_list_lessons(
  p_student_id uuid,
  p_start timestamptz default null,
  p_end timestamptz default null,
  p_limit int default 200,
  p_offset int default 0
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
  limit greatest(coalesce(p_limit, 200), 0)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.portal_list_lessons(uuid, timestamptz, timestamptz, int, int) from public;
grant execute on function public.portal_list_lessons(uuid, timestamptz, timestamptz, int, int) to authenticated;

create or replace function public.portal_count_lessons(
  p_student_id uuid,
  p_start timestamptz default null,
  p_end timestamptz default null
)
returns int
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::int
  from public.lesson l
  join public.portal_membership m on m.student_id = l.student_id and m.user_id = auth.uid()
  where l.student_id = p_student_id
    and (p_start is null or l.start_time >= p_start)
    and (p_end is null or l.start_time < p_end);
$$;

revoke all on function public.portal_count_lessons(uuid, timestamptz, timestamptz) from public;
grant execute on function public.portal_count_lessons(uuid, timestamptz, timestamptz) to authenticated;
