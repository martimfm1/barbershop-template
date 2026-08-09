-- Silentra security hardening: tenant isolation and protected user/shop fields.
-- This migration intentionally tightens existing policies without changing the product model.

-- -----------------------------------------------------------------------------
-- Helpers
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

-- Prevent normal users from changing their tenant or elevating their role.
-- Service-role operations remain allowed for trusted backend workflows.
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
-- USERS
-- -----------------------------------------------------------------------------

-- Remove broad policies which allowed a member to write another user's tenant
-- or role through a client-side Supabase mutation.
drop policy if exists "Permitir que barbeiros atualizem utilizadores da sua barbearia" on public.users;
drop policy if exists "Permitir que barbeiros apaguem utilizadores da sua barbearia" on public.users;

create policy "Users can read own profile or same barbershop users"
  on public.users for select to authenticated
  using (
    id = auth.uid()
    or barbershop_id = public.current_barbershop_id()
  );

create policy "Users can update their own profile"
  on public.users for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Barbershop staff can create clients"
  on public.users for insert to authenticated
  with check (
    barbershop_id = public.current_barbershop_id()
    and coalesce(role, 'client') = 'client'
  );

create policy "Barbershop staff can delete clients"
  on public.users for delete to authenticated
  using (
    barbershop_id = public.current_barbershop_id()
    and coalesce(role, 'client') = 'client'
  );

-- -----------------------------------------------------------------------------
-- APPOINTMENTS
-- -----------------------------------------------------------------------------

-- Appointment details are private business data. Public booking only needs INSERT.
drop policy if exists "Permitir leitura pública de agendamentos" on public.appointments;

create policy "Staff can read appointments for their barbershop"
  on public.appointments for select to authenticated
  using (barbershop_id = public.current_barbershop_id());

-- Public booking creation must reference an existing barbershop. Service and
-- professional ownership are also validated when supplied.
drop policy if exists "Permitir inserção pública de agendamentos" on public.appointments;
create policy "Public can create valid booking requests"
  on public.appointments for insert to anon, authenticated
  with check (
    exists (
      select 1
      from public.barbershops b
      where b.id = barbershop_id
    )
    and (
      service_id is null
      or exists (
        select 1 from public.services s
        where s.id = service_id and s.barbershop_id = barbershop_id
      )
    )
    and (
      professional_id is null
      or exists (
        select 1 from public.professionals p
        where p.id = professional_id and p.barbershop_id = barbershop_id
      )
    )
  );

-- -----------------------------------------------------------------------------
-- BARBERSHOPS
-- -----------------------------------------------------------------------------

-- Public marketplace reads remain public, but authenticated writes must belong
-- to the caller's own tenant. Remove the old authenticated=true write policies.
drop policy if exists "Permitir inserção a utilizadores autenticados" on public.barbershops;
drop policy if exists "Allow service/authenticated updates" on public.barbershops;

create policy "Users can create their own barbershop profile"
  on public.barbershops for insert to authenticated
  with check (id = auth.uid());

create policy "Admins can update their own barbershop"
  on public.barbershops for update to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.barbershop_id = barbershops.id
        and u.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.barbershop_id = barbershops.id
        and u.role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- SHOPS / MARKETPLACE
-- -----------------------------------------------------------------------------

drop policy if exists "Owners insert shop" on public.shops;
drop policy if exists "Owners update shop" on public.shops;

create policy "Barbershop admins can insert marketplace shop"
  on public.shops for insert to authenticated
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.barbershop_id = shops.barbershop_id
        and u.role = 'admin'
    )
  );

create policy "Barbershop admins can update marketplace shop"
  on public.shops for update to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.barbershop_id = shops.barbershop_id
        and u.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.barbershop_id = shops.barbershop_id
        and u.role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- AUDIT LOGS
-- -----------------------------------------------------------------------------

alter table public.audit_logs enable row level security;

-- Audit records are server-generated. There is intentionally no client INSERT,
-- UPDATE or DELETE policy.
drop policy if exists "Users can read audit logs" on public.audit_logs;

create index if not exists audit_logs_entity_idx
  on public.audit_logs (entity_type, entity_id, created_at desc);

create index if not exists users_barbershop_idx
  on public.users (barbershop_id);

create index if not exists appointments_barbershop_date_idx
  on public.appointments (barbershop_id, date_hour desc);
