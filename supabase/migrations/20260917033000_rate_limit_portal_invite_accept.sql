-- accept_portal_invite had no attempt limit: a signed-in account (anon can no longer call it,
-- see 20260917032000) could still guess tokens indefinitely. Add a simple per-user sliding
-- window: 10 attempts per 15 minutes, tracked in a table only this SECURITY DEFINER function
-- touches.
create table public.portal_invite_attempt (
  user_id uuid primary key references auth.users (id) on delete cascade,
  window_start timestamptz not null default now(),
  attempt_count int not null default 0
);

alter table public.portal_invite_attempt enable row level security;

revoke all on table public.portal_invite_attempt from anon, authenticated;

create or replace function public.accept_portal_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text := encode(digest(p_token, 'sha256'), 'hex');
  v_invite public.portal_invite%rowtype;
  v_uid uuid := auth.uid();
  v_window_start timestamptz;
  v_attempt_count int;
begin
  if v_uid is null then
    raise exception 'Must be signed in to accept an invite';
  end if;

  insert into public.portal_invite_attempt (user_id, window_start, attempt_count)
  values (v_uid, now(), 0)
  on conflict (user_id) do nothing;

  select window_start, attempt_count into v_window_start, v_attempt_count
  from public.portal_invite_attempt
  where user_id = v_uid
  for update;

  if v_window_start < now() - interval '15 minutes' then
    v_window_start := now();
    v_attempt_count := 0;
  end if;

  if v_attempt_count >= 10 then
    raise exception 'Too many invite attempts. Try again later.';
  end if;

  update public.portal_invite_attempt
  set window_start = v_window_start, attempt_count = v_attempt_count + 1
  where user_id = v_uid;

  select * into v_invite
  from public.portal_invite
  where token_hash = v_hash
    and expires_at > now()
    and revoked_at is null
    and accepted_at is null;

  if v_invite.id is null then
    raise exception 'This invite link is invalid or has expired.';
  end if;

  insert into public.portal_membership (user_id, student_id, role)
  values (v_uid, v_invite.student_id, v_invite.role)
  on conflict (user_id, student_id, role) do nothing;

  update public.portal_invite
  set accepted_at = now(), accepted_by = v_uid
  where id = v_invite.id;

  update public.portal_invite_attempt
  set attempt_count = 0
  where user_id = v_uid;

  return v_invite.student_id;
end;
$$;

revoke all on function public.accept_portal_invite(text) from public;
grant execute on function public.accept_portal_invite(text) to authenticated;
