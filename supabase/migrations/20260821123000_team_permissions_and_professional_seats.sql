begin;

create or replace function public.get_effective_team_seat_count(p_barbershop_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select
    (
      select count(*)
      from public.users u
      where u.barbershop_id = p_barbershop_id
        and coalesce(lower(u.role), 'client') <> 'client'
    )
    +
    (
      select count(*)
      from public.professionals p
      where p.barbershop_id = p_barbershop_id
        and p.active = true
        and p.user_id is null
    );
$$;

revoke all on function public.get_effective_team_seat_count(uuid) from public, anon;
grant execute on function public.get_effective_team_seat_count(uuid) to authenticated;

create or replace function public.create_professional_with_plan_quota(
  p_actor_user_id uuid,
  p_barbershop_id uuid,
  p_name varchar,
  p_commission_percentage integer default null,
  p_active boolean default true
)
returns public.professionals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_barbershop_id uuid;
  v_role text;
  v_limit integer;
  v_seat_count integer;
  v_user_professional_id uuid;
  v_link_user_id uuid := null;
  v_professional public.professionals;
begin
  if p_name is null or length(btrim(p_name)) = 0 or length(p_name) > 120 then
    raise exception using errcode = '22023', message = 'INVALID_NAME';
  end if;
  if p_commission_percentage is not null and (p_commission_percentage < 0 or p_commission_percentage > 100) then
    raise exception using errcode = '22023', message = 'INVALID_COMMISSION';
  end if;

  select u.barbershop_id, lower(coalesce(u.role, ''))
    into v_user_barbershop_id, v_role
  from public.users u
  where u.id = p_actor_user_id;

  if v_user_barbershop_id is null or v_user_barbershop_id <> p_barbershop_id then
    raise exception using errcode = '42501', message = 'BARBERSHOP_ACCESS_DENIED';
  end if;
  if v_role not in ('admin', 'owner') then
    raise exception using errcode = '42501', message = 'PROFESSIONAL_MANAGEMENT_DENIED';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_barbershop_id::text, 0));
  v_limit := public.get_effective_team_limit(p_barbershop_id);
  v_seat_count := public.get_effective_team_seat_count(p_barbershop_id);

  -- The owner can create their own barber profile without consuming a second
  -- seat. The same applies if a barber is allowed to create the profile from
  -- a future role-aware UI. Additional profiles are unlinked and consume a seat.
  if v_role in ('owner', 'barber') then
    select p.id into v_user_professional_id
    from public.professionals p
    where p.barbershop_id = p_barbershop_id
      and p.user_id = p_actor_user_id
    limit 1;

    if v_user_professional_id is null and v_role = 'owner' then
      v_link_user_id := p_actor_user_id;
    end if;
  end if;

  if v_link_user_id is null and v_seat_count >= v_limit then
    raise exception using errcode = 'P0001', message = 'TEAM_MEMBER_LIMIT_REACHED';
  end if;

  insert into public.professionals (
    barbershop_id,
    user_id,
    name,
    commission_percentage,
    active
  )
  values (
    p_barbershop_id,
    v_link_user_id,
    btrim(p_name),
    p_commission_percentage,
    coalesce(p_active, true)
  )
  returning * into v_professional;

  insert into public.audit_logs (action, entity_type, entity_id, metadata, created_at)
  values (
    'professional.created',
    'professional',
    v_professional.id::text,
    jsonb_build_object(
      'barbershop_id', p_barbershop_id,
      'actor_user_id', p_actor_user_id,
      'linked_user_id', v_link_user_id
    ),
    now()
  );

  return v_professional;
end;
$$;

revoke all on function public.create_professional_with_plan_quota(uuid, uuid, varchar, integer, boolean) from public, anon, authenticated;
grant execute on function public.create_professional_with_plan_quota(uuid, uuid, varchar, integer, boolean) to service_role;

create or replace function public.update_barbershop_member(p_user_id uuid, p_role text, p_permissions jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_shop uuid;
  v_actor_role text;
  v_old_role text;
  v_permissions jsonb;
  v_limit integer;
  v_seat_count integer;
begin
  select u.barbershop_id, lower(coalesce(u.role, ''))
    into v_shop, v_actor_role
  from public.users u
  where u.id = v_actor;

  if v_shop is null then
    raise exception 'only_team_member_can_manage_members' using errcode = '42501';
  end if;

  if v_actor_role in ('admin', 'manager') then
    if not exists (
      select 1
      from public.barbershop_member_permissions mp
      where mp.barbershop_id = v_shop
        and mp.user_id = v_actor
        and coalesce(mp.permissions ->> 'team', 'false') = 'true'
    ) then
      raise exception 'team_permission_required' using errcode = '42501';
    end if;
  elsif v_actor_role <> 'owner' then
    raise exception 'team_permission_required' using errcode = '42501';
  end if;

  select lower(coalesce(role, ''))
    into v_old_role
  from public.users
  where id = p_user_id and barbershop_id = v_shop;

  if v_old_role is null then raise exception 'member_not_found' using errcode = '22023'; end if;
  if v_old_role = 'owner' then raise exception 'owner_role_is_immutable' using errcode = '42501'; end if;
  if p_role not in ('admin','manager','barber','receptionist','staff') then raise exception 'invalid_role' using errcode = '22023'; end if;

  if p_role = 'barber' and v_old_role <> 'barber' then
    v_limit := public.get_effective_team_limit(v_shop);
    v_seat_count := public.get_effective_team_seat_count(v_shop);
    -- Existing member already owns the team seat, so changing their role to
    -- barber never consumes another seat. The professional sync only activates
    -- or creates the profile for this same member.
  end if;

  v_permissions := coalesce(p_permissions, '{}'::jsonb);

  update public.users
  set role = p_role
  where id = p_user_id and barbershop_id = v_shop;

  insert into public.barbershop_member_permissions(user_id, barbershop_id, permissions, updated_at)
  values (p_user_id, v_shop, v_permissions, now())
  on conflict (user_id) do update
    set barbershop_id = excluded.barbershop_id,
        permissions = excluded.permissions,
        updated_at = excluded.updated_at;

  perform public.sync_barber_professional(p_user_id, v_shop, p_role);
end;
$$;

revoke all on function public.update_barbershop_member(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.update_barbershop_member(uuid, text, jsonb) to authenticated;

create or replace function public.remove_barbershop_member(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_shop uuid;
  v_actor_role text;
begin
  select u.barbershop_id, lower(coalesce(u.role, ''))
    into v_shop, v_actor_role
  from public.users u
  where u.id = v_actor;

  if v_shop is null then raise exception 'only_team_member_can_manage_members' using errcode = '42501'; end if;

  if v_actor_role in ('admin', 'manager') then
    if not exists (
      select 1
      from public.barbershop_member_permissions mp
      where mp.barbershop_id = v_shop
        and mp.user_id = v_actor
        and coalesce(mp.permissions ->> 'team', 'false') = 'true'
    ) then
      raise exception 'team_permission_required' using errcode = '42501';
    end if;
  elsif v_actor_role <> 'owner' then
    raise exception 'team_permission_required' using errcode = '42501';
  end if;

  if exists (select 1 from public.users where id = p_user_id and role = 'owner') then
    raise exception 'owner_role_is_immutable' using errcode = '42501';
  end if;

  update public.professionals
  set active = false
  where barbershop_id = v_shop and user_id = p_user_id;

  update public.users
  set barbershop_id = null, role = 'client'
  where id = p_user_id and barbershop_id = v_shop;

  delete from public.barbershop_member_permissions where user_id = p_user_id;
end;
$$;

revoke all on function public.remove_barbershop_member(uuid) from public, anon, authenticated;
grant execute on function public.remove_barbershop_member(uuid) to authenticated;

commit;
