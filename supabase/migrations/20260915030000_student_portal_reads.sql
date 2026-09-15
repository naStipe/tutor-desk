-- Once a student links their own account, they need to see who their tutor is and how to pay
-- them (name, currency, default rate, payment instructions are all meant to be visible to
-- students; nothing on this table is tutor-private).
create policy "Students can read their tutor's profile"
  on public.tutor_profile for select
  to authenticated
  using (
    exists (
      select 1 from public.student s
      where s.tutor_id = tutor_profile.user_id and s.user_id = (select auth.uid())
    )
  );
