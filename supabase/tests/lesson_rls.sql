begin;

do $$
declare
  test_user_ids uuid[];
begin
  if to_regclass('public.lesson') is null then
    raise exception 'public.lesson does not exist';
  end if;

  if not exists (
    select from pg_class
    where oid = 'public.lesson'::regclass and relrowsecurity
  ) then
    raise exception 'RLS is not enabled on public.lesson';
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
  other_id uuid := current_setting('tutordesk.test_user_b')::uuid;
  own_student_id uuid;
  other_student_id uuid;
  new_lesson_id uuid;
  affected_rows integer;
begin
  insert into public.student (tutor_id, name) values (own_id, 'RLS Test Student')
  returning id into own_student_id;

  insert into public.lesson (tutor_id, student_id, start_time, end_time)
  values (own_id, own_student_id, now(), now() + interval '1 hour')
  returning id into new_lesson_id;

  if (select count(*) from public.lesson) <> 1 then
    raise exception 'Authenticated tutor did not see exactly their own lesson';
  end if;

  update public.lesson set status = 'completed' where id = new_lesson_id;
  if not exists (
    select from public.lesson where id = new_lesson_id and status = 'completed'
  ) then
    raise exception 'Authenticated tutor could not update their own lesson status';
  end if;

  begin
    insert into public.lesson (tutor_id, student_id, start_time, end_time)
    values (own_id, own_student_id, now(), now() - interval '1 hour');
    raise exception 'Lesson with end_time before start_time was accepted';
  exception when check_violation then null;
  end;

  begin
    insert into public.lesson (tutor_id, student_id, start_time, end_time)
    values (own_id, '00000000-0000-0000-0000-000000000000', now(), now() + interval '1 hour');
    raise exception 'Tutor created a lesson referencing a nonexistent student';
  exception
    when insufficient_privilege then null;
    when foreign_key_violation then null;
  end;
end
$$;

reset role;

do $$
declare
  other_id uuid := current_setting('tutordesk.test_user_b')::uuid;
begin
  insert into public.student (tutor_id, name) values (other_id, 'Other Tutor Student')
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
  other_student_id uuid;
begin
  select id into other_student_id from public.student where tutor_id = other_id limit 1;

  begin
    insert into public.lesson (tutor_id, student_id, start_time, end_time)
    values (own_id, other_student_id, now(), now() + interval '1 hour');
    raise exception 'Tutor created a lesson referencing another tutor''s student';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.lesson (tutor_id, student_id, start_time, end_time)
    values (other_id, other_student_id, now(), now() + interval '1 hour');
    raise exception 'Tutor created a lesson owned by another tutor';
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
  if exists (select from public.lesson where tutor_id = owner_id) then
    raise exception 'Another tutor can read a lesson they do not own';
  end if;

  update public.lesson set status = 'cancelled' where tutor_id = owner_id;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 0 then
    raise exception 'Another tutor updated a lesson they do not own';
  end if;
end
$$;

reset role;
rollback;
