begin;

alter table public.professionals
  add column if not exists user_id uuid references public.users(id) on delete set null;

create index if not exists professionals_user_id_idx on public.professionals(user_id);
create unique index if not exists professionals_barbershop_user_unique on public.professionals(barbershop_id, user_id) where user_id is not null;

create or replace function public.sync_barber_professional(p_user_id uuid, p_barbershop_id uuid, p_role text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_professional_id uuid;
  v_name text;
begin
  select coalesce(nullif(trim(u.name_complete), ''), nullif(trim(u.email), ''), 'Barbeiro') into v_name
  from public.users u where u.id = p_user_id and u.barbershop_id = p_barbershop_id;
  if v_name is null then raise exception 'member_not_found' using errcode = '22023'; end if;

  if lower(coalesce(p_role, '')) = 'barber' then
    select p.id into v_professional_id from public.professionals p
    where p.barbershop_id = p_barbershop_id and p.user_id = p_user_id
    order by p.active desc, p.created_at asc limit 1 for update;

    if v_professional_id is null then
      select p.id into v_professional_id from public.professionals p
      where p.barbershop_id = p_barbershop_id and p.user_id is null
        and lower(trim(p.name)) = lower(trim(v_name))
      order by p.active desc, p.created_at asc
      limit 1
      for update;
      if v_professional_id is not null then
        update public.professionals set user_id = p_user_id, name = v_name, active = true where id = v_professional_id;
      else
        insert into public.professionals (barbershop_id, user_id, name, commission_percentage, active)
        values (p_barbershop_id, p_user_id, v_name, 50, true) returning id into v_professional_id;
      end if;
    else
      update public.professionals set name = v_name, active = true where id = v_professional_id;
    end if;
  else
    update public.professionals set active = false
    where barbershop_id = p_barbershop_id and user_id = p_user_id;
  end if;

  return v_professional_id;
end;
$$;

revoke all on function public.sync_barber_professional(uuid, uuid, text) from public, anon, authenticated;

-- Reconcile existing barber accounts into the professional list.
do $$
declare v_user record;
begin
  for v_user in select id, barbershop_id, role from public.users where barbershop_id is not null and role = 'barber' loop
    perform public.sync_barber_professional(v_user.id, v_user.barbershop_id, v_user.role);
  end loop;
end;
$$;

create or replace function public.get_effective_professional_count(p_barbershop_id uuid)
returns integer language sql stable security definer set search_path = public
as $$ select count(*)::integer from public.professionals where barbershop_id = p_barbershop_id and active = true; $$;

revoke all on function public.get_effective_professional_count(uuid) from public, anon, authenticated;
grant execute on function public.get_effective_professional_count(uuid) to authenticated;

-- Invite-code joins create the matching professional automatically.
create or replace function public.join_barbershop_with_invite(p_code text)
returns table (barbershop_id uuid, role text)
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_user uuid := auth.uid();
  v_hash text;
  v_invite public.barbershop_invite_codes%rowtype;
  v_default_permissions jsonb := jsonb_build_object('dashboard', true, 'agenda', true, 'clients', true, 'services', false, 'team', false, 'messages', false, 'settings', false, 'billing', false);
begin
  if v_user is null then raise exception 'not_authenticated' using errcode = '42501'; end if;
  if nullif(trim(p_code), '') is null then raise exception 'invalid_code' using errcode = '22023'; end if;
  if exists (select 1 from public.users where id = v_user and role = 'owner') then raise exception 'owner_cannot_join' using errcode = '42501'; end if;
  v_hash := encode(digest(upper(trim(p_code)), 'sha256'), 'hex');
  select * into v_invite from public.barbershop_invite_codes
  where code_hash = v_hash and used_at is null and expires_at > now()
  order by created_at desc limit 1 for update;
  if not found then raise exception 'invalid_or_expired_code' using errcode = '22023'; end if;

  perform set_config('app.silentra_invite_join', 'true', true);
  update public.users set barbershop_id = v_invite.barbershop_id, role = 'barber' where id = v_user;
  if not found then raise exception 'user_profile_not_found' using errcode = 'P0002'; end if;

  insert into public.barbershop_member_permissions(user_id, barbershop_id, permissions, updated_at)
  values (v_user, v_invite.barbershop_id, v_default_permissions, now())
  on conflict (user_id) do update set barbershop_id = excluded.barbershop_id, permissions = excluded.permissions, updated_at = now();

  perform public.sync_barber_professional(v_user, v_invite.barbershop_id, 'barber');
  update public.barbershop_invite_codes set used_at = now(), used_by = v_user where id = v_invite.id;
  return query select v_invite.barbershop_id, 'barber'::text;
end;
$$;

revoke all on function public.join_barbershop_with_invite(text) from public, anon, authenticated;
grant execute on function public.join_barbershop_with_invite(text) to authenticated;

-- Role changes are quota-aware and keep the professional state synchronized.
create or replace function public.update_barbershop_member(p_user_id uuid, p_role text, p_permissions jsonb)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_shop uuid;
  v_old_role text;
  v_plan text;
  v_limit integer;
  v_active_count integer;
begin
  select barbershop_id into v_shop from public.users where id = v_user and role = 'owner';
  if v_shop is null then raise exception 'only_owner_can_manage_members' using errcode = '42501'; end if;
  select role into v_old_role from public.users where id = p_user_id and barbershop_id = v_shop;
  if v_old_role is null then raise exception 'member_not_found' using errcode = '22023'; end if;
  if v_old_role = 'owner' then raise exception 'owner_role_is_immutable' using errcode = '42501'; end if;
  if p_role not in ('admin','manager','barber','receptionist','staff') then raise exception 'invalid_role' using errcode = '22023'; end if;

  if p_role = 'barber' and v_old_role <> 'barber' then
    lock table public.professionals in row exclusive mode;
    select coalesce(s.plan, 'free') into v_plan
    from public.barbershops b left join public.users owner_user on owner_user.id = b.created_by
    left join public.subscriptions s on s.user_id = owner_user.id
    where b.id = v_shop limit 1;
    v_plan := coalesce(v_plan, 'free');
    v_limit := case v_plan when 'free' then 1 when 'pro' then 5 when 'enterprise' then 999999 else 1 end;
    select count(*)::integer into v_active_count from public.professionals where barbershop_id = v_shop and active = true;
    if v_active_count >= v_limit then
      raise exception 'quota_exceeded|barbers|%s|%s|%s|%s', v_active_count, v_limit, v_plan,
        case v_plan when 'free' then 'pro' when 'pro' then 'enterprise' else 'enterprise' end using errcode = 'P0001';
    end if;
  end if;

  update public.users set role = p_role where id = p_user_id and barbershop_id = v_shop;
  insert into public.barbershop_member_permissions(user_id, barbershop_id, permissions, updated_at)
  values (p_user_id, v_shop, coalesce(p_permissions, '{}'::jsonb), now())
  on conflict (user_id) do update set permissions = excluded.permissions, updated_at = now();
  perform public.sync_barber_professional(p_user_id, v_shop, p_role);
end;
$$;

revoke all on function public.update_barbershop_member(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.update_barbershop_member(uuid, text, jsonb) to authenticated;

-- Removing a member deactivates the linked professional but preserves history.
create or replace function public.remove_barbershop_member(p_user_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
declare v_user uuid := auth.uid(); v_shop uuid;
begin
  select barbershop_id into v_shop from public.users where id = v_user and role = 'owner';
  if v_shop is null then raise exception 'only_owner_can_manage_members' using errcode = '42501'; end if;
  if exists (select 1 from public.users where id = p_user_id and role = 'owner') then raise exception 'owner_role_is_immutable' using errcode = '42501'; end if;
  update public.professionals set active = false where barbershop_id = v_shop and user_id = p_user_id;
  update public.users set barbershop_id = null, role = 'client' where id = p_user_id and barbershop_id = v_shop;
  delete from public.barbershop_member_permissions where user_id = p_user_id;
end;
$$;

revoke all on function public.remove_barbershop_member(uuid) from public, anon, authenticated;
grant execute on function public.remove_barbershop_member(uuid) to authenticated;

-- Quotas count active professionals, so removed members do not consume slots.
create or replace function public.create_professional_with_quota(p_barbershop_id uuid, p_user_id uuid, p_name text, p_commission_percentage numeric default 50, p_active boolean default true)
returns public.professionals as $$
declare v_plan text; v_count int; v_limit int; v_new public.professionals%rowtype;
begin
  if not exists (select 1 from public.users where id = p_user_id and barbershop_id = p_barbershop_id) then raise exception 'forbidden: user is not a member of this barbershop' using errcode = 'P08001'; end if;
  select coalesce(s.plan, 'free') into v_plan from public.users u left join public.subscriptions s on s.user_id = u.id where u.id = p_user_id limit 1;
  v_limit := case coalesce(v_plan,'free') when 'free' then 1 when 'pro' then 5 when 'enterprise' then 999999 else 1 end;
  lock table public.professionals in row exclusive mode;
  select count(*)::int into v_count from public.professionals where barbershop_id = p_barbershop_id and active = true;
  if p_active and v_count >= v_limit then raise exception 'quota_exceeded|barbers|%s|%s|%s|%s', v_count, v_limit, coalesce(v_plan,'free'), case coalesce(v_plan,'free') when 'free' then 'pro' when 'pro' then 'enterprise' else 'enterprise' end using errcode = 'P0001'; end if;
  insert into public.professionals(barbershop_id,name,commission_percentage,active) values(p_barbershop_id,p_name,p_commission_percentage,p_active) returning * into v_new;
  return v_new;
end;
$$ language plpgsql security definer;

commit;
