-- Team members: invite-code joins are always barbers; owners can manage roles and permissions.

create table if not exists public.barbershop_member_permissions (
  user_id uuid primary key references public.users(id) on delete cascade,
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  permissions jsonb not null default jsonb_build_object(
    'dashboard', true,
    'agenda', true,
    'clients', true,
    'services', false,
    'team', false,
    'messages', false,
    'settings', false,
    'billing', false
  ),
  updated_at timestamptz not null default now()
);

create index if not exists barbershop_member_permissions_shop_idx
  on public.barbershop_member_permissions(barbershop_id);

alter table public.barbershop_member_permissions enable row level security;

revoke all on table public.barbershop_member_permissions from anon, authenticated;

create or replace function public.join_barbershop_with_invite(p_code text)
returns table (barbershop_id uuid, role text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user uuid := auth.uid();
  v_hash text;
  v_invite public.barbershop_invite_codes%rowtype;
  v_default_permissions jsonb := jsonb_build_object(
    'dashboard', true,
    'agenda', true,
    'clients', true,
    'services', false,
    'team', false,
    'messages', false,
    'settings', false,
    'billing', false
  );
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if nullif(trim(p_code), '') is null then
    raise exception 'invalid_code' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.users u
    where u.id = v_user
      and u.role = 'owner'
  ) then
    raise exception 'owner_cannot_join' using errcode = '42501';
  end if;

  v_hash := encode(digest(upper(trim(p_code)), 'sha256'), 'hex');

  select * into v_invite
  from public.barbershop_invite_codes
  where code_hash = v_hash
    and used_at is null
    and expires_at > now()
  order by created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'invalid_or_expired_code' using errcode = '22023';
  end if;

  perform set_config('app.silentra_invite_join', 'true', true);

  update public.users
  set barbershop_id = v_invite.barbershop_id,
      role = 'barber'
  where id = v_user;

  if not found then
    raise exception 'user_profile_not_found' using errcode = 'P0002';
  end if;

  insert into public.barbershop_member_permissions(user_id, barbershop_id, permissions, updated_at)
  values (v_user, v_invite.barbershop_id, v_default_permissions, now())
  on conflict (user_id) do update
    set barbershop_id = excluded.barbershop_id,
        permissions = excluded.permissions,
        updated_at = now();

  update public.barbershop_invite_codes
  set used_at = now(), used_by = v_user
  where id = v_invite.id;

  return query select v_invite.barbershop_id, 'barber'::text;
end;
$$;

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
    if old.barbershop_id is not null then raise exception 'user already belongs to a barbershop'; end if;
    if new.barbershop_id is null or new.role <> 'owner' then raise exception 'invalid onboarding owner association'; end if;
    return new;
  end if;

  if coalesce(current_setting('app.silentra_invite_join', true), 'false') = 'true' then
    if old.barbershop_id is not null then raise exception 'user already belongs to a barbershop'; end if;
    if new.barbershop_id is null or new.role <> 'barber' then raise exception 'invalid invite association'; end if;
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

create or replace function public.list_barbershop_members()
returns table (
  user_id uuid,
  name_complete text,
  email text,
  num_phone text,
  role text,
  joined_via_code boolean,
  joined_at timestamptz,
  permissions jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_shop uuid;
begin
  select u.barbershop_id into v_shop from public.users u where u.id = v_user;
  if v_user is null or v_shop is null then raise exception 'not_allowed' using errcode = '42501'; end if;
  if not exists (select 1 from public.users u where u.id = v_user and u.role = 'owner') then
    raise exception 'only_owner_can_manage_members' using errcode = '42501';
  end if;

  return query
  select
    u.id,
    u.name_complete,
    u.email,
    u.num_phone,
    u.role,
    exists (
      select 1 from public.barbershop_invite_codes ic
      where ic.used_by = u.id and ic.barbershop_id = v_shop
    ) as joined_via_code,
    (
      select min(ic.used_at) from public.barbershop_invite_codes ic
      where ic.used_by = u.id and ic.barbershop_id = v_shop
    ) as joined_at,
    coalesce(mp.permissions, jsonb_build_object(
      'dashboard', true,
      'agenda', true,
      'clients', true,
      'services', false,
      'team', false,
      'messages', false,
      'settings', false,
      'billing', false
    ))
  from public.users u
  left join public.barbershop_member_permissions mp on mp.user_id = u.id
  where u.barbershop_id = v_shop
  order by case when u.role = 'owner' then 0 else 1 end, lower(coalesce(u.name_complete, u.email));
end;
$$;

create or replace function public.update_barbershop_member(
  p_user_id uuid,
  p_role text,
  p_permissions jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_shop uuid;
  v_target_shop uuid;
begin
  select u.barbershop_id into v_shop from public.users u where u.id = v_user and u.role = 'owner';
  if v_shop is null then raise exception 'only_owner_can_manage_members' using errcode = '42501'; end if;

  select u.barbershop_id into v_target_shop from public.users u where u.id = p_user_id;
  if v_target_shop is distinct from v_shop then raise exception 'member_not_found' using errcode = '22023'; end if;
  if exists (select 1 from public.users u where u.id = p_user_id and u.role = 'owner') then
    raise exception 'owner_role_is_immutable' using errcode = '42501';
  end if;
  if p_role not in ('admin','manager','barber','receptionist','staff') then raise exception 'invalid_role' using errcode = '22023'; end if;

  update public.users set role = p_role where id = p_user_id and barbershop_id = v_shop;

  insert into public.barbershop_member_permissions(user_id, barbershop_id, permissions, updated_at)
  values (p_user_id, v_shop, coalesce(p_permissions, '{}'::jsonb), now())
  on conflict (user_id) do update set permissions = excluded.permissions, updated_at = now();
end;
$$;

create or replace function public.remove_barbershop_member(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_shop uuid;
begin
  select u.barbershop_id into v_shop from public.users u where u.id = v_user and u.role = 'owner';
  if v_shop is null then raise exception 'only_owner_can_manage_members' using errcode = '42501'; end if;
  if exists (select 1 from public.users u where u.id = p_user_id and u.role = 'owner') then
    raise exception 'owner_role_is_immutable' using errcode = '42501';
  end if;
  update public.users set barbershop_id = null, role = 'client' where id = p_user_id and barbershop_id = v_shop;
  delete from public.barbershop_member_permissions where user_id = p_user_id;
end;
$$;

revoke all on function public.list_barbershop_members() from public, anon, authenticated;
grant execute on function public.list_barbershop_members() to authenticated;
revoke all on function public.update_barbershop_member(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.update_barbershop_member(uuid, text, jsonb) to authenticated;
revoke all on function public.remove_barbershop_member(uuid) from public, anon, authenticated;
grant execute on function public.remove_barbershop_member(uuid) to authenticated;
revoke all on function public.join_barbershop_with_invite(text) from public, anon, authenticated;
grant execute on function public.join_barbershop_with_invite(text) to authenticated;
