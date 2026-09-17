-- Supabase's default privileges grant EXECUTE on new public-schema functions to anon
-- automatically, which is how six SECURITY DEFINER RPCs ended up anon-reachable despite each
-- one's own migration granting only to authenticated (see
-- 20260917032000_revoke_anon_execute_portal_rpcs.sql). Change the default itself so a future
-- function needs an explicit `grant execute ... to anon` instead of silently inheriting it.
alter default privileges in schema public revoke execute on functions from anon;
