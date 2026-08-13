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

create index if not exists appointments_active_professional_time_gist_idx
on public.appointments
using gist (
  barbershop_id,
  coalesce(professional_id, '00000000-0000-0000-0000-000000000000'::uuid),
  tstzrange(date_hour, date_hour + make_interval(mins => duration_minutes), '[)')
)
where status in ('pending', 'scheduled');

commit;
