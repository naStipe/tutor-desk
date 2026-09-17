-- Portal home page needs a way to show "contact your teacher" details, and homework needs a
-- lightweight discussion thread between tutor and student/guardian. Neither existed yet.

alter table public.tutor_profile
  add column contact_email text null,
  add column contact_phone text null;

create table public.homework_comment (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid not null references public.homework (id) on delete cascade,
  tutor_id uuid not null references public.tutor_profile (user_id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  author_role text not null check (author_role in ('tutor', 'learner', 'guardian', 'payer')),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index homework_comment_homework_id_idx on public.homework_comment (homework_id);

alter table public.homework_comment enable row level security;

revoke all on table public.homework_comment from anon;
grant select, insert on table public.homework_comment to authenticated;

create policy "Tutors can read comments on their own homework"
on public.homework_comment for select to authenticated
using ((select auth.uid()) = tutor_id);

create policy "Tutors can post comments on their own homework"
on public.homework_comment for insert to authenticated
with check (
  (select auth.uid()) = tutor_id
  and author_id = (select auth.uid())
  and author_role = 'tutor'
  and exists (select 1 from public.homework h where h.id = homework_id and h.tutor_id = tutor_id)
);

create policy "Portal members can read comments on their homework"
on public.homework_comment for select to authenticated
using (
  exists (
    select 1 from public.homework h
    join public.portal_membership m on m.student_id = h.student_id and m.user_id = (select auth.uid())
    where h.id = homework_comment.homework_id
  )
);

create policy "Portal members can post comments on their homework"
on public.homework_comment for insert to authenticated
with check (
  author_id = (select auth.uid())
  and exists (
    select 1 from public.homework h
    join public.portal_membership m
      on m.student_id = h.student_id
      and m.user_id = (select auth.uid())
      and m.role = homework_comment.author_role
    where h.id = homework_comment.homework_id
      and h.tutor_id = homework_comment.tutor_id
  )
);

-- Aggregate-only unpaid summary for the portal home page: a student can have a long lesson
-- history, and downloading every unpaid row just to add up a total (as the tutor dashboard used
-- to for its own unbilled count) doesn't scale. Grouped by currency since a tutor could in theory
-- change their default currency over time.
create or replace function public.portal_unpaid_summary(p_student_id uuid)
returns table (currency text, total numeric, count integer)
language sql
security definer
set search_path = public
stable
as $$
  select l.currency, sum(l.price) as total, count(*)::int as count
  from public.lesson l
  join public.portal_membership m on m.student_id = l.student_id and m.user_id = auth.uid()
  where l.student_id = p_student_id
    and l.status = 'completed'
    and l.payment_status = 'unpaid'
    and l.price is not null
  group by l.currency;
$$;

revoke all on function public.portal_unpaid_summary(uuid) from public;
grant execute on function public.portal_unpaid_summary(uuid) to authenticated;
