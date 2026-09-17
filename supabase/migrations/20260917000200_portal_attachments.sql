-- Homework attachments were tutor-only (RLS on homework_attachment, and the storage.objects
-- policies backing the homework-attachments bucket), so a student could see that a file was
-- attached but never open it from the portal. Extend read access to anyone with portal
-- membership on the underlying student, matching the read access they already have on the
-- homework row itself.

create policy "Portal members can read their own homework attachments"
on public.homework_attachment for select to authenticated
using (
  exists (
    select 1 from public.homework h
    join public.portal_membership m on m.student_id = h.student_id and m.user_id = (select auth.uid())
    where h.id = homework_attachment.homework_id
  )
);

-- Attachment storage paths are "<tutor_id>/<homework_id>/<file>" (see
-- src/features/homework/actions.ts), so the second path segment is the homework id.
create policy "Portal members can read their own homework attachment files"
on storage.objects for select to authenticated
using (
  bucket_id = 'homework-attachments'
  and exists (
    select 1 from public.homework h
    join public.portal_membership m on m.student_id = h.student_id and m.user_id = (select auth.uid())
    where h.id = (storage.foldername(name))[2]::uuid
  )
);
