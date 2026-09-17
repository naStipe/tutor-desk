-- Advisor flagged these foreign key columns as unindexed: every join/cascade delete through them
-- (e.g. deleting a tutor_profile cascading into homework_attachment/homework_comment) does a
-- sequential scan instead of an index lookup.
create index if not exists homework_attachment_tutor_id_idx on public.homework_attachment (tutor_id);
create index if not exists homework_comment_author_id_idx on public.homework_comment (author_id);
create index if not exists homework_comment_tutor_id_idx on public.homework_comment (tutor_id);
create index if not exists lesson_series_subject_id_idx on public.lesson_series (subject_id);
create index if not exists portal_invite_accepted_by_idx on public.portal_invite (accepted_by);
create index if not exists student_subject_rate_subject_id_idx on public.student_subject_rate (subject_id);
