-- Silentra database consistency refactor
-- Finalizes the canonical application schema rules without destructive data changes.
-- The migration history remains replayable; this migration consolidates conflicting
-- role constraints, tenant helpers, and user/onboarding RLS behaviour.

begin;

-- -----------------------------------------------------------------------------
-- Canonical user roles
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
-- Canonical tenant helper
-- -----------------------------------------------------------------------------

create or replace function public.get_my_barbershop_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.barbershop_id
  from public.users u
  where u.id = auth.uid()
  limit 1;
$$;

revoke all on function public.get_my_barbershop_id() from public, anon;
grant execute on function public.get_my_barbershop_id() to authenticated;

-- Backwards-compatible alias for policies created by earlier migrations.
create or replace function public.current_barbershop_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select public.get_my_barbershop_id();
$$;

revoke all on function public.current_barbershop_id() from public, anon;
grant execute on function public.current_barbershop_id() to authenticated;

-- -----------------------------------------------------------------------------
-- User tenant/role protection
-- -----------------------------------------------------------------------------

create or replace function public.protect_user_tenant_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if old.id <> auth.uid() then
    raise exception 'users may only modify their own profile';
  end if;

  if coalesce(current_setting('app.silentra_onboarding_owner_link', true), 'false') = 'true' then
    if old.barbershop_id is not null then
      raise exception 'user already belongs to a barbershop';
    end if;

    if new.barbershop_id is null or new.role <> 'owner' then
      raise exception 'invalid onboarding owner association';
    end if;

    return new;
  end if;

  if new.id <> old.id
     or new.barbershop_id is distinct from old.barbershop_id
     or new.role is distinct from old.role then
    raise exception 'protected account fields cannot be changed by the client';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_user_tenant_fields on public.users;
create trigger protect_user_tenant_fields
before update on public.users
for each row execute function public.protect_user_tenant_fields();

-- -----------------------------------------------------------------------------
-- Canonical users RLS
-- -----------------------------------------------------------------------------

alter table public.users enable row level security;

drop policy if exists "Users can read own profile or same barbershop users" on public.users;
drop policy if exists "Users can update their own profile" on public.users;

create policy "users_select_own_or_same_tenant"
  on public.users
  for select to authenticated
  using (
    id = auth.uid()
    or barbershop_id = public.get_my_barbershop_id()
  );

create policy "users_update_own_profile"
  on public.users
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Client CRM rows remain tenant-scoped and cannot create elevated staff roles.
drop policy if exists "Barbershop staff can create clients" on public.users;
create policy "users_insert_client_only"
  on public.users
  for insert to authenticated
  with check (
    barbershop_id = public.get_my_barbershop_id()
    and coalesce(role, 'client') = 'client'
  );

drop policy if exists "Barbershop staff can delete clients" on public.users;
create policy "users_delete_client_only"
  on public.users
  for delete to authenticated
  using (
    barbershop_id = public.get_my_barbershop_id()
    and coalesce(role, 'client') = 'client'
  );

-- -----------------------------------------------------------------------------
-- Onboarding ownership invariant
-- -----------------------------------------------------------------------------

alter table public.barbershops
  add column if not exists created_by uuid references auth.users(id) on delete set null;

create index if not exists barbershops_created_by_idx
  on public.barbershops(created_by);

-- Keep creation tenant-safe. The onboarding API writes created_by explicitly.
drop policy if exists "Users can create their own barbershop profile" on public.barbershops;
drop policy if exists "Authenticated users can create their own barbershop" on public.barbershops;
drop policy if exists "Permitir inserção a utilizadores autenticados" on public.barbershops;

create policy "barbershops_insert_by_creator"
  on public.barbershops
  for insert to authenticated
  with check (created_by = auth.uid());

-- Owner/admin writes only to their own tenant.
drop policy if exists "Admins can update their own barbershop" on public.barbershops;
drop policy if exists "Owners and admins can update their own barbershop" on public.barbershops;

create policy "barbershops_update_by_owner_or_admin"
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
-- Marketplace tenant write rules
-- -----------------------------------------------------------------------------

drop policy if exists "Barbershop admins can insert marketplace shop" on public.shops;
drop policy if exists "Barbershop creators can insert marketplace shop" on public.shops;
drop policy if exists "Owners insert shop" on public.shops;

create policy "shops_insert_by_creator_or_owner"
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

drop policy if exists "Barbershop admins can update marketplace shop" on public.shops;
drop policy if exists "Barbershop owners and admins can update marketplace shop" on public.shops;

drop policy if exists "Owners update shop" on public.shops;

create policy "shops_update_by_owner_or_admin"
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

-- -----------------------------------------------------------------------------
-- Indexes for tenant lookups
-- -----------------------------------------------------------------------------

create index if not exists users_barbershop_id_idx
  on public.users(barbershop_id);

create index if not exists shops_barbershop_id_idx
  on public.shops(barbershop_id);

commit;
