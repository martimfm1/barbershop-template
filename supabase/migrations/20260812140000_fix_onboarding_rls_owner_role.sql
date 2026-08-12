-- Harden onboarding owner association.
--
-- The users RLS policy already restricts normal profile updates to auth.uid(),
-- but an onboarding RPC needs a narrowly-scoped exception to change the new
-- owner's tenant and role. We keep the client policy restrictive and gate the
-- exception through a transaction-local flag set only by the trusted RPC.

-- 1. The application explicitly models the creator of a barbershop.
alter table public.barbershops
  add column if not exists created_by uuid references auth.users(id) on delete set null;

create index if not exists barbershops_created_by_idx
  on public.barbershops (created_by);

-- 2. Keep the role constraint aligned with the authorization model.
alter table public.users
  drop constraint if exists chk_user_role;

alter table public.users
  add constraint chk_user_role
  check (role in ('user', 'admin', 'owner'));

-- 3. Harden the users UPDATE trigger. Normal authenticated clients can never
-- change tenant/role. The only exception is the transaction-local onboarding
-- context established by complete_barbershop_onboarding().
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

-- 4. The RPC is the only authenticated path allowed to perform the owner link.
-- It requires that the target barbershop was created by the same account.
create or replace function public.complete_barbershop_onboarding(
  p_barbershop_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if p_barbershop_id is null then
    raise exception 'barbershop id is required';
  end if;

  if not exists (
    select 1
    from public.barbershops b
    where b.id = p_barbershop_id
      and b.created_by = auth.uid()
  ) then
    raise exception 'barbershop ownership validation failed';
  end if;

  if exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.barbershop_id is not null
  ) then
    raise exception 'user already belongs to a barbershop';
  end if;

  perform set_config('app.silentra_onboarding_owner_link', 'true', true);

  update public.users
  set barbershop_id = p_barbershop_id,
      role = 'owner'
  where id = auth.uid();

  if not found then
    raise exception 'user profile not found';
  end if;

  perform set_config('app.silentra_onboarding_owner_link', 'false', true);
end;
$$;

revoke all on function public.complete_barbershop_onboarding(uuid) from public;
grant execute on function public.complete_barbershop_onboarding(uuid) to authenticated;

-- 5. RLS remains intentionally restrictive: authenticated users can update only
-- their own profile row. The RPC is SECURITY DEFINER, so it is not necessary to
-- weaken this policy or grant broad tenant writes.
drop policy if exists "Users can update their own profile" on public.users;
create policy "Users can update their own profile"
  on public.users for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
