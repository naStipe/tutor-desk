-- Each of these tables has two permissive SELECT policies for the authenticated role (one for
-- the tutor's own row, one for a linked portal member). Postgres evaluates every permissive
-- policy for a given role/action and ORs the results, so both run on every query. Merge each pair
-- into a single OR-combined policy instead.

drop policy "Tutors can read their own homework" on public.homework;
drop policy "Students can read their own homework" on public.homework;

create policy "Members can read their own homework"
on public.homework for select to authenticated
using (
  (select auth.uid()) = tutor_id
  or exists (
    select 1 from public.portal_membership m
    where m.student_id = homework.student_id and m.user_id = (select auth.uid())
  )
);

drop policy "Tutors can read their own homework attachments" on public.homework_attachment;
drop policy "Portal members can read their own homework attachments" on public.homework_attachment;

create policy "Members can read their own homework attachments"
on public.homework_attachment for select to authenticated
using (
  (select auth.uid()) = tutor_id
  or exists (
    select 1 from public.homework h
    join public.portal_membership m
      on m.student_id = h.student_id and m.user_id = (select auth.uid())
    where h.id = homework_attachment.homework_id
  )
);

drop policy "Tutors can read comments on their own homework" on public.homework_comment;
drop policy "Portal members can read comments on their homework" on public.homework_comment;

create policy "Members can read comments on their own homework"
on public.homework_comment for select to authenticated
using (
  (select auth.uid()) = tutor_id
  or exists (
    select 1 from public.homework h
    join public.portal_membership m
      on m.student_id = h.student_id and m.user_id = (select auth.uid())
    where h.id = homework_comment.homework_id
  )
);

drop policy "Members can read their own membership rows" on public.portal_membership;
drop policy "Tutors can read membership rows for their own students" on public.portal_membership;

create policy "Members and their tutors can read membership rows"
on public.portal_membership for select to authenticated
using (
  (select auth.uid()) = user_id
  or exists (
    select 1 from public.student s
    where s.id = portal_membership.student_id and s.tutor_id = (select auth.uid())
  )
);

drop policy "Tutors can read their own subjects" on public.subject;
drop policy "Students can read their tutor's subjects" on public.subject;

create policy "Members can read their tutor's subjects"
on public.subject for select to authenticated
using (
  (select auth.uid()) = tutor_id
  or exists (
    select 1 from public.portal_membership m
    join public.student s on s.id = m.student_id
    where s.tutor_id = subject.tutor_id and m.user_id = (select auth.uid())
  )
);

drop policy "Tutors can read their own profile" on public.tutor_profile;
drop policy "Students can read their tutor's profile" on public.tutor_profile;

create policy "Members can read their tutor's profile"
on public.tutor_profile for select to authenticated
using (
  (select auth.uid()) = user_id
  or exists (
    select 1 from public.portal_membership m
    join public.student s on s.id = m.student_id
    where s.tutor_id = tutor_profile.user_id and m.user_id = (select auth.uid())
  )
);
