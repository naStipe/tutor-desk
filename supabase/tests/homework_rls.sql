begin;

do $$
declare
  test_user_ids uuid[];
begin
  if to_regclass('public.homework') is null then
    raise exception 'public.homework does not exist';
  end if;

  if not exists (
    select from pg_class
    where oid = 'public.homework'::regclass and relrowsecurity
  ) then
    raise exception 'RLS is not enabled on public.homework';
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
  own_lesson_id uuid;
  new_homework_id uuid;
begin
  insert into public.student (tutor_id, name) values (own_id, 'Homework RLS Student')
  returning id into own_student_id;

  insert into public.lesson (tutor_id, student_id, start_time, end_time)
  values (own_id, own_student_id, now(), now() + interval '1 hour')
  returning id into own_lesson_id;

  insert into public.homework (tutor_id, student_id, lesson_id, title)
  values (own_id, own_student_id, own_lesson_id, 'Read chapter 3')
  returning id into new_homework_id;

  if (select count(*) from public.homework) <> 1 then
    raise exception 'Authenticated tutor did not see exactly their own homework';
  end if;

  update public.homework
  set status = 'submitted', submission_text = 'Done', submitted_at = now()
  where id = new_homework_id;

  if not exists (
    select from public.homework where id = new_homework_id and status = 'submitted'
  ) then
    raise exception 'Authenticated tutor could not record a submission on their own homework';
  end if;
end
$$;

reset role;

do $$
declare
  other_id uuid := current_setting('tutordesk.test_user_b')::uuid;
begin
  insert into public.student (tutor_id, name) values (other_id, 'Other Tutor Homework Student')
  on conflict do nothing;
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
  other_id uuid := current_setting('tutordesk.test_user_b')::uuid;
  own_student_id uuid;
  other_student_id uuid;
begin
  select id into own_student_id from public.student where tutor_id = own_id limit 1;
  select id into other_student_id from public.student where tutor_id = other_id limit 1;

  begin
    insert into public.homework (tutor_id, student_id, title)
    values (own_id, other_student_id, 'Cross tenant student link');
    raise exception 'Tutor created homework referencing another tutor''s student';
  exception when insufficient_privilege then null;
  end;
end
$$;

reset role;

do $$
begin
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', current_setting('tutordesk.test_user_b'), 'role', 'authenticated')::text,
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
  if exists (select from public.homework where tutor_id = owner_id) then
    raise exception 'Another tutor can read homework they do not own';
  end if;

  update public.homework set status = 'reviewed' where tutor_id = owner_id;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 0 then
    raise exception 'Another tutor updated homework they do not own';
  end if;
end
$$;

reset role;
rollback;
