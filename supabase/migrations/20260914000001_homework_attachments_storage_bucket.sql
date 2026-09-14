insert into storage.buckets (id, name, public)
values ('homework-attachments', 'homework-attachments', false)
on conflict (id) do nothing;

create policy "Tutors can read their own homework attachment files"
on storage.objects for select to authenticated
using (
  bucket_id = 'homework-attachments'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

create policy "Tutors can upload their own homework attachment files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'homework-attachments'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

create policy "Tutors can delete their own homework attachment files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'homework-attachments'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);
