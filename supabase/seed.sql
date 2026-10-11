-- LOCAL DEVELOPMENT ONLY. Loaded by `supabase db reset` against the local stack, never the hosted project.
-- Test tutors (fake addresses, throwaway password):
--   tutor-a@tutordesk.test / TestPass123!   (has data)
--   tutor-b@tutordesk.test / TestPass123!   (second tenant, for cross-tenant checks)

create extension if not exists pgcrypto with schema extensions;

do $$
declare
  a uuid := '11111111-1111-4111-8111-111111111111';
  b uuid := '22222222-2222-4222-8222-222222222222';
  uid uuid;
  mail text;
begin
  foreach uid in array array[a, b] loop
    mail := case when uid = a then 'tutor-a@tutordesk.test' else 'tutor-b@tutordesk.test' end;
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', mail,
      extensions.crypt('TestPass123!', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
    );
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
    values (
      gen_random_uuid(), uid, uid::text,
      json_build_object('sub', uid::text, 'email', mail, 'email_verified', true)::jsonb,
      'email', now(), now(), now()
    );
  end loop;

  insert into public.tutor_profile (user_id, name, currency, default_hourly_rate)
  values (a, 'Test Tutor A', 'EUR', 40), (b, 'Test Tutor B', 'EUR', 30);
end
$$;

-- Tutor A: students, one with a separate payer, one with a package.
insert into public.student (id, tutor_id, name, email, guardian_name, guardian_email, default_hourly_rate, default_currency)
values
  ('aaaaaaa1-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Anna Adult', 'anna@example.test', null, null, 40, 'EUR'),
  ('aaaaaaa1-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Boris Child', null, 'Olga Parent', 'olga@example.test', 35, 'EUR'),
  ('aaaaaaa1-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'Clara Package', 'clara@example.test', null, null, 40, 'EUR');

insert into public.student (id, tutor_id, name)
values ('bbbbbbb1-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'Other Tutor Student');

-- Lessons for tutor A, relative to now() so statuses are meaningful whenever the stack is reset.
insert into public.lesson (tutor_id, student_id, start_time, end_time, status, price, currency, payment_status)
values
  -- elapsed, still stored as scheduled: must read Completed and be swept to completed
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaa1-0000-4000-8000-000000000001', now() - interval '3 hours', now() - interval '2 hours', 'scheduled', 40, 'EUR', 'unpaid'),
  -- happening right now: must read In progress
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaa1-0000-4000-8000-000000000002', now() - interval '30 minutes', now() + interval '30 minutes', 'scheduled', 35, 'EUR', 'unpaid'),
  -- already completed, unpaid
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaa1-0000-4000-8000-000000000001', now() - interval '2 days', now() - interval '2 days' + interval '1 hour', 'completed', 40, 'EUR', 'unpaid'),
  -- future, scheduled
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaa1-0000-4000-8000-000000000001', now() + interval '1 day', now() + interval '1 day' + interval '1 hour', 'scheduled', 40, 'EUR', 'unpaid'),
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaa1-0000-4000-8000-000000000003', now() + interval '2 days', now() + interval '2 days' + interval '1 hour', 'scheduled', 40, 'EUR', 'unpaid'),
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaa1-0000-4000-8000-000000000003', now() + interval '3 days', now() + interval '3 days' + interval '1 hour', 'scheduled', 40, 'EUR', 'unpaid'),
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaa1-0000-4000-8000-000000000003', now() + interval '4 days', now() + interval '4 days' + interval '1 hour', 'scheduled', 40, 'EUR', 'unpaid'),
  -- cancelled
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaa1-0000-4000-8000-000000000001', now() + interval '5 days', now() + interval '5 days' + interval '1 hour', 'cancelled', 40, 'EUR', 'unpaid');

insert into public.lesson (tutor_id, student_id, start_time, end_time, price, currency)
values ('22222222-2222-4222-8222-222222222222', 'bbbbbbb1-0000-4000-8000-000000000001', now() + interval '1 day', now() + interval '1 day' + interval '1 hour', 30, 'EUR');

-- NOTE: the Clara package is NOT seeded here; add it through the Billing tab to exercise the flow.
