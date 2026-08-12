-- Allow barbershop owners to be represented explicitly in users.role.
-- This keeps the database constraint aligned with the onboarding and
-- authorization model used by the application.

alter table public.users
  drop constraint if exists chk_user_role;

alter table public.users
  add constraint chk_user_role
  check (role in ('user', 'admin', 'owner'));
