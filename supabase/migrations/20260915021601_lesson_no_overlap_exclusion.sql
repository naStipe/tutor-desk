create extension if not exists btree_gist;

alter table public.lesson
  add constraint lesson_no_overlap
  exclude using gist (
    tutor_id with =,
    tstzrange(start_time, end_time) with &&
  )
  where (status <> 'cancelled');
