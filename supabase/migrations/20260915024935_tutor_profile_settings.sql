alter table public.tutor_profile
  add column name text null,
  add column currency text not null default 'RUB' check (currency in ('RUB', 'EUR')),
  add column default_hourly_rate numeric(10, 2) null check (default_hourly_rate > 0),
  add column payment_instructions text null;
