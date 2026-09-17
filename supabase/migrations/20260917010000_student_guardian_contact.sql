-- The learner's own email/phone/telegram (added in 20260913150812 / 20260913160000) is
-- insufficient for a child: the person paying and consenting is often not the learner. This adds
-- a separate payer/guardian contact so the two are never conflated.
alter table public.student
  add column guardian_name text null,
  add column guardian_email text null,
  add column guardian_phone text null,
  add column guardian_telegram text null;
