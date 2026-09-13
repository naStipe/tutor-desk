begin;

do $$
declare
  test_user_ids uuid[];
begin
  if to_regclass('public.student') is null then
    raise exception 'public.student does not exist';
  end if;

  if not exists (
    select from pg_class
    where oid = 'public.student'::regclass and relrowsecurity
  ) then
    raise exception 'RLS is not enabled on public.student';
  end if;

  if not exists (
    select from pg_constraint
    where conrelid = 'public.student'::regclass
      and contype = 'f'
      and confrelid = 'public.tutor_profile'::regclass
      and confdeltype = 'c'
  ) then
    raise exception 'tutor_profile foreign key with ON DELETE CASCADE is missing';
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
  new_student_id uuid;
  affected_rows integer;
begin
  insert into public.student (tutor_id, name, email)
  values (own_id, 'Test Student', 'student@example.com')
  returning id into new_student_id;

  if (select count(*) from public.student) <> 1 then
    raise exception 'Authenticated tutor did not see exactly their own student';
  end if;

  update public.student set name = 'Renamed Student' where id = new_student_id;
  if not exists (
    select from public.student where id = new_student_id and name = 'Renamed Student'
  ) then
    raise exception 'Authenticated tutor could not update their own student';
  end if;

  update public.student set archived_at = now() where id = new_student_id;
  if exists (select from public.student where id = new_student_id and archived_at is null) then
    raise exception 'Authenticated tutor could not archive their own student';
  end if;

  begin
    insert into public.student (tutor_id, name) values (other_id, 'Cross tenant insert');
    raise exception 'Authenticated tutor created a student owned by another tutor';
  exception
    when insufficient_privilege then null;
    when unique_violation then
      raise exception 'Cross-user insert reached uniqueness checking before RLS';
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
  other_id uuid := current_setting('tutordesk.test_user_b')::uuid;
  owner_id uuid := current_setting('tutordesk.test_user_a')::uuid;
  affected_rows integer;
begin
  if exists (select from public.student where tutor_id = owner_id) then
    raise exception 'Another tutor can read a student they do not own';
  end if;

  update public.student set name = 'Hijacked' where tutor_id = owner_id;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 0 then
    raise exception 'Another tutor updated a student they do not own';
  end if;
end
$$;

reset role;
rollback;
