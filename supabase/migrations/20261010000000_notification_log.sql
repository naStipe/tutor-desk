-- TD-020: sent-log for outbound email (lesson reminders, unpaid-balance reminders). Additive only.
--
-- The log is written exclusively by server code running with the service-role key (the cron route
-- and the manual "send balance reminder" action). Tutors may read their own rows; there are no
-- insert/update/delete policies and no table privileges for anon/authenticated beyond select.
-- Only a masked recipient (e.g. "s***@example.com") is stored, never the full address or the body.
create table public.notification_log (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.tutor_profile (user_id) on delete cascade,
  kind text not null,
  lesson_id uuid null references public.lesson (id) on delete set null,
  student_id uuid null references public.student (id) on delete set null,
  to_email_masked text null,
  status text not null default 'pending',
  error_code text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_log_kind_check check (kind in ('lesson_reminder', 'balance_reminder')),
  constraint notification_log_status_check check (status in ('pending', 'sent', 'skipped', 'failed')),
  -- At most one lesson reminder per lesson, ever (also the idempotency guard for the cron job).
  -- lesson_id is null for balance reminders, and nulls are distinct, so they are unaffected.
  constraint notification_log_kind_lesson_unique unique (kind, lesson_id)
);

create index notification_log_tutor_student_kind_idx
  on public.notification_log (tutor_id, student_id, kind, created_at desc);
create index notification_log_student_id_idx on public.notification_log (student_id);
create index notification_log_lesson_id_idx on public.notification_log (lesson_id);

alter table public.notification_log enable row level security;

revoke all on table public.notification_log from anon, authenticated;
grant select on table public.notification_log to authenticated;

create policy "Tutors can read their own notification log"
on public.notification_log for select to authenticated
using ((select auth.uid()) = tutor_id);

-- Scheduled lessons starting in (p_from, p_to] that have no reminder log row yet, with everything
-- the reminder email needs. Cross-tenant by design: callable ONLY by the service role (the cron
-- route); anon/authenticated cannot execute it.
create or replace function public.due_lesson_reminders(
  p_from timestamptz,
  p_to timestamptz,
  p_limit integer
)
returns table (
  lesson_id uuid,
  tutor_id uuid,
  student_id uuid,
  start_time timestamptz,
  end_time timestamptz,
  meeting_url text,
  subject_name text,
  student_name text,
  student_email text,
  guardian_email text,
  tutor_name text,
  tutor_timezone text,
  tutor_locale text,
  tutor_contact_email text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    l.id, l.tutor_id, l.student_id, l.start_time, l.end_time, l.meeting_url,
    sub.name, s.name, s.email, s.guardian_email,
    tp.name, tp.timezone, tp.locale, tp.contact_email
  from public.lesson l
  join public.student s on s.id = l.student_id and s.tutor_id = l.tutor_id
  join public.tutor_profile tp on tp.user_id = l.tutor_id
  left join public.subject sub on sub.id = l.subject_id
  where l.status = 'scheduled'
    and l.start_time > p_from
    and l.start_time <= p_to
    and s.archived_at is null
    and not exists (
      select 1 from public.notification_log n
      where n.kind = 'lesson_reminder' and n.lesson_id = l.id
    )
  order by l.start_time
  limit least(greatest(p_limit, 1), 200);
$$;

revoke all on function public.due_lesson_reminders(timestamptz, timestamptz, integer) from public;
revoke all on function public.due_lesson_reminders(timestamptz, timestamptz, integer) from anon, authenticated;
grant execute on function public.due_lesson_reminders(timestamptz, timestamptz, integer) to service_role;

-- Atomically claims a balance-reminder send for one student: returns the new log id, or null when
-- the student does not belong to the tutor or a reminder was already claimed within the cooldown.
-- The advisory lock serializes concurrent clicks for the same student. Service role only.
create or replace function public.claim_balance_reminder(
  p_tutor_id uuid,
  p_student_id uuid,
  p_to_masked text,
  p_cooldown interval default interval '1 hour'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not exists (
    select 1 from public.student s where s.id = p_student_id and s.tutor_id = p_tutor_id
  ) then
    return null;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_student_id::text, 0));

  if exists (
    select 1 from public.notification_log n
    where n.kind = 'balance_reminder'
      and n.tutor_id = p_tutor_id
      and n.student_id = p_student_id
      and n.status in ('pending', 'sent')
      and n.created_at > now() - p_cooldown
  ) then
    return null;
  end if;

  insert into public.notification_log (tutor_id, kind, student_id, to_email_masked, status)
  values (p_tutor_id, 'balance_reminder', p_student_id, p_to_masked, 'pending')
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.claim_balance_reminder(uuid, uuid, text, interval) from public;
revoke all on function public.claim_balance_reminder(uuid, uuid, text, interval) from anon, authenticated;
grant execute on function public.claim_balance_reminder(uuid, uuid, text, interval) to service_role;
