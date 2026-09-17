-- Supabase grants EXECUTE on new public-schema functions to anon and authenticated by default
-- (ALTER DEFAULT PRIVILEGES set up on project creation). Each of these RPCs' migration only did
-- `revoke all ... from public` then `grant execute ... to authenticated`, which revokes the
-- implicit PUBLIC grant but leaves that separate default anon grant in place. Confirmed live via
-- information_schema.routine_privileges: anon had EXECUTE on all six. An unauthenticated request
-- could call them directly, e.g. probe accept_portal_invite for timing/existence signals even
-- though it errors without a session.
revoke execute on function public.accept_portal_invite(text) from anon;
revoke execute on function public.submit_homework(uuid, text) from anon;
revoke execute on function public.portal_list_students() from anon;
revoke execute on function public.portal_list_lessons(uuid, timestamptz, timestamptz, int, int) from anon;
revoke execute on function public.portal_count_lessons(uuid, timestamptz, timestamptz) from anon;
revoke execute on function public.portal_unpaid_summary(uuid) from anon;
