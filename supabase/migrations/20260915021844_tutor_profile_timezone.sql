alter table public.tutor_profile
  add column timezone text not null default 'UTC';
