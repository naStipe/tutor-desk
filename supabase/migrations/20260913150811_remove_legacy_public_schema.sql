-- The linked hosted project was an earlier test implementation. Its public
-- schema and global auth trigger are not part of TutorDesk's domain model.
-- Remove them explicitly so Git migrations define the hosted schema and
-- generated application types from this point onward.
drop trigger if exists on_auth_user_created on auth.users;

drop table if exists public.availability;
drop table if exists public.lessons;
drop table if exists public.lesson_packs;
drop table if exists public.tutor_student_connections;
drop table if exists public.students;
drop table if exists public.profiles;

drop function if exists public.decrement_pack(uuid);
drop function if exists public.increment_pack(uuid);
drop function if exists public.generate_invite_code();
drop function if exists public.handle_new_user();
