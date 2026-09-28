-- Aggregate-only unpaid summary for the tutor-facing student billing page: same "sum in the
-- database instead of downloading every row" reasoning as portal_unpaid_summary
-- (20260917020000_tutor_contact_and_homework_comments.sql), so the two stay consistent even
-- though a tutor session could also just select+sum client-side. Grouped by currency since a
-- tutor could in theory change their default currency over time. security definer plus an
-- explicit tutor_id = auth.uid() check are defense-in-depth on top of lesson's own RLS select
-- policy (20260913150813_create_lesson.sql: using ((select auth.uid()) = tutor_id)), mirroring
-- portal_unpaid_summary's shape.
create or replace function public.tutor_unpaid_summary(p_student_id uuid)
returns table (currency text, total numeric, count integer)
language sql
security definer
set search_path = public
stable
as $$
  select l.currency, sum(l.price) as total, count(*)::int as count
  from public.lesson l
  where l.student_id = p_student_id
    and l.tutor_id = auth.uid()
    and l.status = 'completed'
    and l.payment_status = 'unpaid'
    and l.price is not null
  group by l.currency;
$$;

revoke all on function public.tutor_unpaid_summary(uuid) from public;
revoke all on function public.tutor_unpaid_summary(uuid) from anon;
grant execute on function public.tutor_unpaid_summary(uuid) to authenticated;
