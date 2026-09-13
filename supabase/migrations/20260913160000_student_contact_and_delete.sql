alter table public.student
  add column phone text null,
  add column telegram text null;

grant delete on table public.student to authenticated;

create policy "Tutors can delete their own students"
on public.student for delete to authenticated
using ((select auth.uid()) = tutor_id);
