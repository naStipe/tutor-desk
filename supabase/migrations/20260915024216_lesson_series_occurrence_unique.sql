alter table public.lesson
  add constraint lesson_series_start_time_unique unique (series_id, start_time);
