-- Normalize conflicting role constraints and align onboarding RLS with the
-- actual application role model.
--
-- This migration is intentionally additive/non-destructive. It does not drop
-- business data and does not weaken tenant isolation.

-- -----------------------------------------------------------------------------
-- USERS: one canonical role constraint
-- -----------------------------------------------------------------------------

alter table public.users
  drop constraint if exists chk_user_role;

alter table public.users
  drop constraint if exists users_role_check;

alter table public.users
  add constraint users_role_check
  check (role in (
    'owner',
    'admin',
    'manager',
    'barber',
    'receptionist',
    'staff',
    'client'
  ));

-- Keep the role used by new team members deterministic.
alter table public.users
  alter column role set default 'barber';

-- -----------------------------------------------------------------------------
-- BARBERSHOPS: creator can create/link the row during onboarding.
-- Existing authenticated tenant updates remain restricted to owners/admins.
-- -----------------------------------------------------------------------------

alter table public.barbershops
  add column if not exists created_by uuid references auth.users(id) on delete set null;

create index if not exists barbershops_created_by_idx
  on public.barbershops(created_by);

drop policy if exists "Users can create their own barbershop profile" on public.barbershops;
drop policy if exists "Permitir inserção a utilizadores autenticados" on public.barbershops;

create policy "Authenticated users can create their own barbershop"
  on public.barbershops
  for insert to authenticated
  with check (created_by = auth.uid());

drop policy if exists "Admins can update their own barbershop" on public.barbershops;

authorization_role_guard_placeholder;
