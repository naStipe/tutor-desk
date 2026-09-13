begin;

do $$
declare
  test_user_ids uuid[];
begin
  if to_regclass('public.tutor_profile') is null then
    raise exception 'public.tutor_profile does not exist';
  end if;

  if not exists (
    select from pg_class
    where oid = 'public.tutor_profile'::regclass and relrowsecurity
  ) then
    raise exception 'RLS is not enabled on public.tutor_profile';
  end if;

  if not exists (
    select from pg_constraint
    where conrelid = 'public.tutor_profile'::regclass and contype = 'p' and conkey = array[
      (select attnum from pg_attribute where attrelid = 'public.tutor_profile'::regclass and attname = 'user_id')
    ]::smallint[]
  ) then
    raise exception 'user_id is not the primary key';
  end if;

  if not exists (
    select from pg_constraint
    where conrelid = 'public.tutor_profile'::regclass
      and contype = 'f'
      and confrelid = 'auth.users'::regclass
      and confdeltype = 'c'
  ) then
    raise exception 'auth.users foreign key with ON DELETE CASCADE is missing';
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

set local role anon;
do $$
begin
  begin
    if exists (select from public.tutor_profile) then
      raise exception 'Anonymous role can read tutor profiles';
    end if;
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.tutor_profile (user_id)
    values (current_setting('tutordesk.test_user_a')::uuid);
    raise exception 'Anonymous role can create a tutor profile';
  exception when insufficient_privilege then null;
  end;

  begin
    update public.tutor_profile set updated_at = now();
    raise exception 'Anonymous role can update tutor profiles';
  exception when insufficient_privilege then null;
  end;

  begin
    delete from public.tutor_profile;
    raise exception 'Anonymous role can delete tutor profiles';
  exception when insufficient_privilege then null;
  end;
end
$$;

reset role;
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
  affected_rows integer;
begin
  if (select count(*) from public.tutor_profile) <> 1 then
    raise exception 'Authenticated tutor did not see exactly their own profile';
  end if;

  insert into public.tutor_profile (user_id) values (own_id)
  on conflict (user_id) do nothing;

  begin
    insert into public.tutor_profile (user_id) values (other_id);
    raise exception 'Authenticated tutor created another user''s profile';
  exception
    when insufficient_privilege then null;
    when unique_violation then
      raise exception 'Cross-user insert reached uniqueness checking before RLS';
  end;

  update public.tutor_profile set updated_at = now() where user_id = other_id;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 0 then
    raise exception 'Authenticated tutor updated another user''s profile';
  end if;

  delete from public.tutor_profile where user_id = other_id;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 0 then
    raise exception 'Authenticated tutor deleted another user''s profile';
  end if;
end
$$;

rollback;
