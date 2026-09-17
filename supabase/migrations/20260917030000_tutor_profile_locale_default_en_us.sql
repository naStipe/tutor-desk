-- The column default was 'ru-RU' while the app's own fallback constant is 'en-US'
-- (src/features/tutor-profile/data.ts FALLBACK_LOCALE). Every signup gets a real
-- tutor_profile row via ensureCurrentTutorProfile's upsert, so the DB default won by
-- writing 'ru-RU' into every new account's row, landing new tutors with Russian date
-- formatting while every UI string stays hardcoded English. Align the default with the
-- app's own fallback.
alter table public.tutor_profile
  alter column locale set default 'en-US';
