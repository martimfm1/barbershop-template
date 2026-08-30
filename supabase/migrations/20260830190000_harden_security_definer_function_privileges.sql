begin;

-- P1 security hardening: make the privilege boundary of every known
-- SECURITY DEFINER RPC explicit. SECURITY DEFINER functions must never be
-- callable by an unauthenticated role unless that is an intentional API.
-- All functions below already enforce their own tenant/actor checks; this
-- migration makes the database-level grants explicit and stable.

-- Server-only booking creation. Public clients reach this through the
-- server-side /api/bookings route, never through PostgREST directly.
revoke all
on function public.create_booking_atomic(uuid, uuid, uuid, timestamptz, integer, text, text, text, date, text)
from public, anon, authenticated;
grant execute
on function public.create_booking_atomic(uuid, uuid, uuid, timestamptz, integer, text, text, text, date, text)
to service_role;

-- Server-only automatic completion worker.
revoke all
on function public.process_automatic_booking_completion()
from public, anon, authenticated;
grant execute
on function public.process_automatic_booking_completion()
to service_role;

-- Dashboard settings mutation: authenticated owners/admins only. The
-- function itself validates auth.uid(), tenant membership and role.
revoke all
on function public.update_barbershop_config(uuid, jsonb)
from public, anon;
grant execute
on function public.update_barbershop_config(uuid, jsonb)
to authenticated, service_role;

-- Public-directory visibility: authenticated owners/admins only. The
-- function validates actor identity, tenant membership and plan server-side.
revoke all
on function public.set_barbershop_directory_visibility(uuid, uuid, boolean)
from public, anon;
grant execute
on function public.set_barbershop_directory_visibility(uuid, uuid, boolean)
to authenticated, service_role;

-- Keep the function search path pinned. This prevents an attacker-controlled
-- schema from being searched ahead of public while these functions execute
-- with definer privileges.
alter function public.create_booking_atomic(uuid, uuid, uuid, timestamptz, integer, text, text, text, date, text)
  set search_path = public;
alter function public.process_automatic_booking_completion()
  set search_path = public;
alter function public.update_barbershop_config(uuid, jsonb)
  set search_path = public;
alter function public.set_barbershop_directory_visibility(uuid, uuid, boolean)
  set search_path = public;

commit;
