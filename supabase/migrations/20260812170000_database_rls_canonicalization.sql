-- Silentra database canonicalization
-- Non-destructive: consolidates core RLS/policies and role constraints without deleting business data.
-- This migration is designed to run after the existing migration history.

-- -----------------------------------------------------------------------------
-- Canonical tenant helpers
-- -----------------------------------------------------------------------------

create or replace function public.current_barbershop_id()
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

revoke all on function public.current_barbershop_id() from public;
grant execute on function public.current_barbershop_id() to authenticated;

create or replace function public.get_my_barbershop_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_barbershop_id()::text, '');
$$;

revoke all on function public.get_my_barbershop_id() from public;
grant execute on function public.get_my_barbershop_id() to authenticated;

-- -----------------------------------------------------------------------------
-- USERS: one canonical role constraint and strict self-update policy
-- -----------------------------------------------------------------------------

alter table public.users
  drop constraint if exists chk_user_role;

alter table public.users
  drop constraint if exists users_role_check;

alter table public.users
  add constraint users_role_check
  check (role in ('owner','admin','manager','barber','receptionist','staff','client','user'));

-- Normal client updates may edit profile fields, but never tenant or role.
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

drop policy if exists "Permitir que barbeiros atualizem utilizadores da sua barbearia" on public.users;
drop policy if exists "Users can update their own profile" on public.users;
drop policy if exists "Permitir que barbeiros leiam utilizadores da sua barbearia" on public.users;
drop policy if exists "Permitir que barbeiros criem clientes para a sua barbearia" on public.users;
drop policy if exists "Barbershop staff can create clients" on public.users;
drop policy if exists "Barbershop staff can delete clients" on public.users;
drop policy if exists "Permitir que barbeiros apaguem utilizadores da sua barbearia" on public.users;

create policy "users_select_own_or_tenant"
  on public.users for select to authenticated
  using (id = auth.uid() or barbershop_id = public.current_barbershop_id());

create policy "users_update_own_profile"
  on public.users for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "users_insert_client_in_tenant"
  on public.users for insert to authenticated
  with check (
    barbershop_id = public.current_barbershop_id()
    and coalesce(role, 'client') = 'client'
  );

create policy "users_delete_client_in_tenant"
  on public.users for delete to authenticated
  using (
    barbershop_id = public.current_barbershop_id()
    and coalesce(role, 'client') = 'client'
  );

-- -----------------------------------------------------------------------------
-- BARBERSHOPS: public read, creator insert, owner/admin update
-- -----------------------------------------------------------------------------

alter table public.barbershops
  add column if not exists created_by uuid references auth.users(id) on delete set null;

create index if not exists barbershops_created_by_idx on public.barbershops(created_by);

drop policy if exists "Users can create their own profile" on public.barbershops;
drop policy if exists "Users can create their own barbershop profile" on public.barbershops;
drop policy if exists "Permitir inserção a utilizadores autenticados" on public.barbershops;
drop policy if exists "Allow service/authenticated updates" on public.barbershops;
drop policy if exists "Allow admins to update their own barbershop" on public.barbershops;
drop policy if exists "Admins can update their own barbershop" on public.barbershops;
drop policy if exists "Owners and admins can update their own barbershop" on public.barbershops;

create policy "barbershops_public_read"
  on public.barbershops for select to anon, authenticated
  using (true);

create policy "barbershops_creator_insert"
  on public.barbershops for insert to authenticated
  with check (created_by = auth.uid());

create policy "barbershops_owner_admin_update"
  on public.barbershops for update to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.barbershop_id = barbershops.id
        and u.role in ('owner','admin')
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.barbershop_id = barbershops.id
        and u.role in ('owner','admin')
    )
  );

-- -----------------------------------------------------------------------------
-- SHOPS: public marketplace read, tenant-scoped writes
-- -----------------------------------------------------------------------------

drop policy if exists "Owners insert shop" on public.shops;
drop policy if exists "Owners update shop" on public.shops;
drop policy if exists "Barbershop admins can insert marketplace shop" on public.shops;
drop policy if exists "Barbershop admins can update marketplace shop" on public.shops;
drop policy if exists "Barbershop creators can insert marketplace shop" on public.shops;
drop policy if exists "Barbershop owners and admins can update marketplace shop" on public.shops;

create policy "shops_public_read"
  on public.shops for select to anon, authenticated
  using (true);

create policy "shops_creator_or_admin_insert"
  on public.shops for insert to authenticated
  with check (
    exists (
      select 1 from public.barbershops b
      where b.id = shops.barbershop_id
        and b.created_by = auth.uid()
    )
    or exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.barbershop_id = shops.barbershop_id
        and u.role in ('owner','admin')
    )
  );

create policy "shops_owner_admin_update"
  on public.shops for update to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.barbershop_id = shops.barbershop_id
        and u.role in ('owner','admin')
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.barbershop_id = shops.barbershop_id
        and u.role in ('owner','admin')
    )
  );

-- -----------------------------------------------------------------------------
-- CORE TENANT TABLES: replace overlapping policies with canonical tenant scope
-- -----------------------------------------------------------------------------

-- SERVICES

drop policy if exists "Permitir update de serviços da barbearia" on public.services;
drop policy if exists "Permitir delete de serviços da barbearia" on public.services;
drop policy if exists "Permitir leitura de serviços da barbearia" on public.services;
drop policy if exists "Permitir escrita de serviços da barbearia" on public.services;

create policy "services_public_read"
  on public.services for select to anon, authenticated
  using (true);
create policy "services_tenant_insert"
  on public.services for insert to authenticated
  with check (barbershop_id = public.current_barbershop_id());
create policy "services_tenant_update"
  on public.services for update to authenticated
  using (barbershop_id = public.current_barbershop_id())
  with check (barbershop_id = public.current_barbershop_id());
create policy "services_tenant_delete"
  on public.services for delete to authenticated
  using (barbershop_id = public.current_barbershop_id());

-- PROFESSIONALS

drop policy if exists "Permitir leitura de profissionais da barbearia" on public.professionals;
drop policy if exists "Permitir escrita de profissionais da barbearia" on public.professionals;
drop policy if exists "Permitir update de profissionais da barbearia" on public.professionals;
drop policy if exists "Permitir delete de profissionais da barbearia" on public.professionals;

create policy "professionals_tenant_select"
  on public.professionals for select to authenticated
  using (barbershop_id = public.current_barbershop_id());
create policy "professionals_tenant_insert"
  on public.professionals for insert to authenticated
  with check (barbershop_id = public.current_barbershop_id());
create policy "professionals_tenant_update"
  on public.professionals for update to authenticated
  using (barbershop_id = public.current_barbershop_id())
  with check (barbershop_id = public.current_barbershop_id());
create policy "professionals_tenant_delete"
  on public.professionals for delete to authenticated
  using (barbershop_id = public.current_barbershop_id());

-- SCHEDULE BLOCKS

drop policy if exists "Permitir leitura de bloqueios da barbearia" on public.schedule_blocks;
drop policy if exists "Permitir escrita de bloqueios da barbearia" on public.schedule_blocks;
drop policy if exists "Permitir update de bloqueios da barbearia" on public.schedule_blocks;
drop policy if exists "Permitir delete de bloqueios da barbearia" on public.schedule_blocks;

create policy "schedule_blocks_tenant_select"
  on public.schedule_blocks for select to authenticated
  using (barbershop_id = public.current_barbershop_id());
create policy "schedule_blocks_tenant_insert"
  on public.schedule_blocks for insert to authenticated
  with check (barbershop_id = public.current_barbershop_id());
create policy "schedule_blocks_tenant_update"
  on public.schedule_blocks for update to authenticated
  using (barbershop_id = public.current_barbershop_id())
  with check (barbershop_id = public.current_barbershop_id());
create policy "schedule_blocks_tenant_delete"
  on public.schedule_blocks for delete to authenticated
  using (barbershop_id = public.current_barbershop_id());

-- APPOINTMENTS: remove unrestricted authenticated/public reads; booking creation remains public.
drop policy if exists "Permitir inserção pública de agendamentos" on public.appointments;
drop policy if exists "Permitir leitura pública de agendamentos" on public.appointments;
drop policy if exists "Permitir update para staff da barbearia" on public.appointments;
drop policy if exists "Permitir delete de agendamentos da barbearia" on public.appointments;
drop policy if exists "Public can create valid booking requests" on public.appointments;
drop policy if exists "Staff can read appointments for their barbershop" on public.appointments;

create policy "appointments_public_insert"
  on public.appointments for insert to anon, authenticated
  with check (
    exists (select 1 from public.barbershops b where b.id = appointments.barbershop_id)
    and (
      service_id is null
      or exists (
        select 1 from public.services s
        where s.id = appointments.service_id
          and s.barbershop_id = appointments.barbershop_id
      )
    )
    and (
      professional_id is null
      or exists (
        select 1 from public.professionals p
        where p.id = appointments.professional_id
          and p.barbershop_id = appointments.barbershop_id
      )
    )
  );

create policy "appointments_tenant_select"
  on public.appointments for select to authenticated
  using (barbershop_id = public.current_barbershop_id());
create policy "appointments_tenant_update"
  on public.appointments for update to authenticated
  using (barbershop_id = public.current_barbershop_id())
  with check (barbershop_id = public.current_barbershop_id());
create policy "appointments_tenant_delete"
  on public.appointments for delete to authenticated
  using (barbershop_id = public.current_barbershop_id());

-- REVIEWS: retain public read/write behavior for marketplace review flow.
drop policy if exists "Leitura pública de avaliações" on public.reviews;
drop policy if exists "Criar avaliações publicamente" on public.reviews;
create policy "reviews_public_read" on public.reviews for select to anon, authenticated using (true);
create policy "reviews_public_insert" on public.reviews for insert to anon, authenticated with check (true);

-- -----------------------------------------------------------------------------
-- BILLING: one read policy per table
-- -----------------------------------------------------------------------------

drop policy if exists "Users can read their billing customer" on public.customers;
create policy "customers_select_own"
  on public.customers for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can read their subscription" on public.subscriptions;
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
  on public.subscriptions for select to authenticated
  using (user_id = auth.uid());

-- RLS must be enabled on core tenant/billing tables.
alter table public.users enable row level security;
alter table public.barbershops enable row level security;
alter table public.shops enable row level security;
alter table public.services enable row level security;
alter table public.professionals enable row level security;
alter table public.schedule_blocks enable row level security;
alter table public.appointments enable row level security;
alter table public.reviews enable row level security;
alter table public.customers enable row level security;
alter table public.subscriptions enable row level security;

-- Useful tenant indexes.
create index if not exists users_barbershop_id_idx on public.users(barbershop_id);
create index if not exists services_barbershop_id_idx on public.services(barbershop_id);
create index if not exists professionals_barbershop_id_idx on public.professionals(barbershop_id);
create index if not exists appointments_barbershop_date_idx on public.appointments(barbershop_id, date_hour desc);
create index if not exists schedule_blocks_barbershop_date_idx on public.schedule_blocks(barbershop_id, date desc);
