alter table public.student
  add column default_hourly_rate numeric(10, 2) null check (default_hourly_rate > 0),
  add column default_currency text null check (default_currency in ('RUB', 'EUR'));
