begin;

create extension if not exists btree_gist;

alter table public.appointments
  add column if not exists duration_minutes integer not null default 30;

update public.appointments a
set duration_minutes = greatest(coalesce(s.duration, 30), 1)
from public.services s
where s.id = a.service_id
  and (a.duration_minutes is null or a.duration_minutes = 30);

alter table public.appointments
  drop constraint if exists appointments_duration_minutes_check;

alter table public.appointments
  add constraint appointments_duration_minutes_check
  check (duration_minutes > 0 and duration_minutes <= 1440);

alter table public.appointments
  drop constraint if exists appointments_active_professional_overlap_excl;

alter table public.appointments
  add constraint appointments_active_professional_overlap_excl
  exclude using gist (
    barbershop_id with =,
    professional_id with =,
    tsrange(
      date_hour at time zone 'UTC',
      (date_hour at time zone 'UTC') + make_interval(mins => duration_minutes),
      '[)'
    ) with &&
  ) where (
    status in ('pending', 'scheduled')
    and professional_id is not null
  );

commit;