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
drop policy if exists "Owners can update their own barbershop" on public.barbershops;

create policy "Owners and admins can update their own barbershop"
  on public.barbershops
  for update to authenticated
  using (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.barbershop_id = barbershops.id
        and u.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.barbershop_id = barbershops.id
        and u.role in ('owner', 'admin')
    )
  );

-- -----------------------------------------------------------------------------
-- SHOPS: the creator of the barbershop may create its marketplace row before
-- the onboarding RPC attaches the user's profile to the tenant.
-- -----------------------------------------------------------------------------

drop policy if exists "Barbershop admins can insert marketplace shop" on public.shops;
drop policy if exists "Owners insert shop" on public.shops;

create policy "Barbershop creators can insert marketplace shop"
  on public.shops
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.barbershops b
      where b.id = shops.barbershop_id
        and b.created_by = auth.uid()
    )
    or exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.barbershop_id = shops.barbershop_id
        and u.role in ('owner', 'admin')
    )
  );

-- Keep marketplace updates tenant-scoped.
drop policy if exists "Barbershop admins can update marketplace shop" on public.shops;
drop policy if exists "Owners update shop" on public.shops;

drop policy if exists "Barbershop owners and admins can update marketplace shop" on public.shops;
create policy "Barbershop owners and admins can update marketplace shop"
  on public.shops
  for update to authenticated
  using (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.barbershop_id = shops.barbershop_id
        and u.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.barbershop_id = shops.barbershop_id
        and u.role in ('owner', 'admin')
    )
  );
