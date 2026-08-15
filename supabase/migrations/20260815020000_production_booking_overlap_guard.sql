begin;

-- Make the database the final authority for active appointment overlap.
-- A NULL professional_id means the booking is not tied to a specific barber;
-- treat those appointments as sharing one tenant-level scheduling lane so two
-- unassigned bookings can never occupy the same time window.
create extension if not exists btree_gist;

alter table public.appointments
  drop constraint if exists appointments_active_professional_overlap_excl;

alter table public.appointments
  add constraint appointments_active_professional_overlap_excl
  exclude using gist (
    barbershop_id with =,
    coalesce(professional_id, '00000000-0000-0000-0000-000000000000'::uuid) with =,
    tsrange(
      date_hour at time zone 'UTC',
      (date_hour at time zone 'UTC') + make_interval(mins => duration_minutes),
      '[)'
    ) with &&
  ) where (
    status in ('pending', 'scheduled')
  );

commit;
