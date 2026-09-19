-- Tutors can now permanently delete their own lessons (previously only cancel via status update).
grant delete on table public.lesson to authenticated;

create policy "Tutors can delete their own lessons"
on public.lesson for delete to authenticated
using ((select auth.uid()) = tutor_id);
