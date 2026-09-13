begin;

do $$
declare
  test_user_ids uuid[];
  other_student_id uuid;
begin
  if to_regclass('public.student_subject_rate') is null then
    raise exception 'public.student_subject_rate does not exist';
  end if;

  if not exists (
    select from pg_class
    where oid = 'public.student_subject_rate'::regclass and relrowsecurity
  ) then
    raise exception 'RLS is not enabled on public.student_subject_rate';
  end if;

  select array_agg(id order by created_at)
  into test_user_ids
  from (select id, created_at from auth.users order by created_at limit 2) users;

  if coalesce(array_length(test_user_ids, 1), 0) < 2 then
    raise exception 'Hosted RLS verification requires at least two existing Auth users';
  end if;

  perform set_config('tutordesk.test_user_a', test_user_ids[1]::text, true);
  perform set_config('tutordesk.test_user_b', test_user_ids[2]::text, true);

  insert into public.tutor_profile (user_id)
  values (test_user_ids[1]), (test_user_ids[2])
  on conflict (user_id) do nothing;

  -- Created here (unrestricted role) so the RLS block below can attempt a cross-tenant
  -- insert against a real student it does not own, without needing a mid-test role switch.
  insert into public.student (tutor_id, name) values (test_user_ids[2], 'Other Tutor Student')
  returning id into other_student_id;
  perform set_config('tutordesk.other_student_id', other_student_id::text, true);
end
$$;

do $$
begin
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', current_setting('tutordesk.test_user_a'), 'role', 'authenticated')::text,
    true
  );
end
$$;
set local role authenticated;

do $$
declare
  own_id uuid := current_setting('tutordesk.test_user_a')::uuid;
  own_student_id uuid;
  own_subject_id uuid;
  new_rate_id uuid;
begin
  insert into public.student (tutor_id, name) values (own_id, 'Rate Test Student')
  returning id into own_student_id;
  insert into public.subject (tutor_id, name) values (own_id, 'Rate Test Subject')
  returning id into own_subject_id;

  insert into public.student_subject_rate (tutor_id, student_id, subject_id, hourly_rate, currency)
  values (own_id, own_student_id, own_subject_id, 1500, 'RUB')
  returning id into new_rate_id;

  if (select count(*) from public.student_subject_rate) <> 1 then
    raise exception 'Authenticated tutor did not see exactly their own rate';
  end if;

  update public.student_subject_rate set hourly_rate = 2000 where id = new_rate_id;
  if not exists (
    select from public.student_subject_rate where id = new_rate_id and hourly_rate = 2000
  ) then
    raise exception 'Authenticated tutor could not update their own rate';
  end if;

  delete from public.student_subject_rate where id = new_rate_id;
  if exists (select from public.student_subject_rate where id = new_rate_id) then
    raise exception 'Authenticated tutor could not delete their own rate';
  end if;

  insert into public.student_subject_rate (tutor_id, student_id, subject_id, hourly_rate, currency)
  values (own_id, own_student_id, own_subject_id, 1500, 'RUB');

  begin
    insert into public.student_subject_rate (tutor_id, student_id, subject_id, hourly_rate, currency)
    values (
      own_id,
      current_setting('tutordesk.other_student_id')::uuid,
      own_subject_id,
      1500,
      'RUB'
    );
    raise exception 'Authenticated tutor created a rate for a student they do not own';
  exception
    when insufficient_privilege then null;
  end;
end
$$;

reset role;

do $$
declare
  other_id uuid := current_setting('tutordesk.test_user_b')::uuid;
begin
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', other_id, 'role', 'authenticated')::text,
    true
  );
end
$$;
set local role authenticated;

do $$
declare
  owner_id uuid := current_setting('tutordesk.test_user_a')::uuid;
  affected_rows integer;
begin
  if exists (select from public.student_subject_rate where tutor_id = owner_id) then
    raise exception 'Another tutor can read a rate they do not own';
  end if;

  update public.student_subject_rate set hourly_rate = 1 where tutor_id = owner_id;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 0 then
    raise exception 'Another tutor updated a rate they do not own';
  end if;

  delete from public.student_subject_rate where tutor_id = owner_id;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 0 then
    raise exception 'Another tutor deleted a rate they do not own';
  end if;
end
$$;

reset role;
rollback;
