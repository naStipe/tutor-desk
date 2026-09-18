-- Tutor's active working hours, as minutes-since-midnight in their own configured timezone.
-- Used to bound the calendar view and to reject lessons scheduled outside the working day.
-- Defaults match the app's previous hardcoded 7 AM - 9 PM window.
alter table public.tutor_profile
  add column working_hours_start_minutes smallint not null default 420,
  add column working_hours_end_minutes smallint not null default 1260,
  add constraint tutor_profile_working_hours_range check (
    working_hours_start_minutes >= 0
    and working_hours_start_minutes < working_hours_end_minutes
    and working_hours_end_minutes <= 1440
  );
