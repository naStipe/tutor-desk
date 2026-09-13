alter table public.lesson
  add column subject_id uuid null references public.subject (id) on delete set null,
  add column series_id uuid null references public.lesson_series (id) on delete set null,
  add column price numeric(10, 2) null check (price is null or price >= 0),
  add column currency text null check (currency is null or currency in ('RUB', 'EUR')),
  add column payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid')),
  add column payment_method text null check (payment_method is null or payment_method in ('online', 'invoice', 'sbp')),
  add column paid_at timestamptz null;

create index lesson_subject_id_idx on public.lesson (subject_id);
create index lesson_series_id_idx on public.lesson (series_id);

drop policy "Tutors can create lessons for their own students" on public.lesson;
drop policy "Tutors can update their own lessons" on public.lesson;

create policy "Tutors can create lessons for their own students"
on public.lesson for insert to authenticated
with check (
  (select auth.uid()) = tutor_id
  and exists (select 1 from public.student s where s.id = student_id and s.tutor_id = tutor_id)
  and (
    subject_id is null
    or exists (select 1 from public.subject sub where sub.id = subject_id and sub.tutor_id = tutor_id)
  )
  and (
    series_id is null
    or exists (select 1 from public.lesson_series ls where ls.id = series_id and ls.tutor_id = tutor_id)
  )
);

create policy "Tutors can update their own lessons"
on public.lesson for update to authenticated
using ((select auth.uid()) = tutor_id)
with check (
  (select auth.uid()) = tutor_id
  and exists (select 1 from public.student s where s.id = student_id and s.tutor_id = tutor_id)
  and (
    subject_id is null
    or exists (select 1 from public.subject sub where sub.id = subject_id and sub.tutor_id = tutor_id)
  )
  and (
    series_id is null
    or exists (select 1 from public.lesson_series ls where ls.id = series_id and ls.tutor_id = tutor_id)
  )
);
