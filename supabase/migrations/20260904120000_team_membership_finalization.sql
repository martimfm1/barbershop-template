begin;

create or replace function public.get_effective_team_limit(p_barbershop_id uuid)
returns integer language sql stable security definer set search_path = public as $$
  select case coalesce(public.get_effective_billing_plan_for_barbershop(p_barbershop_id), 'free')
    when 'free' then 1 when 'pro' then 5 when 'enterprise' then 2147483647 else 1 end;
$$;

create or replace function public.get_effective_team_member_count(p_barbershop_id uuid)
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::integer from public.users
  where barbershop_id = p_barbershop_id and coalesce(lower(role), 'client') <> 'client';
$$;

create or replace function public.get_effective_team_seat_count(p_barbershop_id uuid)
returns integer language sql stable security definer set search_path = public as $$
  select
    (select count(*) from public.users where barbershop_id = p_barbershop_id and coalesce(lower(role), 'client') <> 'client')
    +
    (select count(*) from public.professionals where barbershop_id = p_barbershop_id and active = true and user_id is null);
$$;

revoke all on function public.get_effective_team_limit(uuid) from public, anon;
revoke all on function public.get_effective_team_member_count(uuid) from public, anon;
revoke all on function public.get_effective_team_seat_count(uuid) from public, anon;
grant execute on function public.get_effective_team_limit(uuid) to authenticated;
grant execute on function public.get_effective_team_member_count(uuid) to authenticated;
grant execute on function public.get_effective_team_seat_count(uuid) to authenticated;

create or replace function public.create_professional_with_plan_quota(
  p_actor_user_id uuid, p_barbershop_id uuid, p_name varchar,
  p_commission_percentage integer default null, p_active boolean default true
)
returns public.professionals language plpgsql security definer set search_path = public as $$
declare
  v_user_shop uuid; v_role text; v_limit integer; v_seats integer; v_link uuid := null; v_new public.professionals;
begin
  select barbershop_id, lower(coalesce(role, '')) into v_user_shop, v_role from public.users where id = p_actor_user_id;
  if v_user_shop is null or v_user_shop <> p_barbershop_id then raise exception 'BARBERSHOP_ACCESS_DENIED' using errcode='42501'; end if;
  if v_role <> 'owner' then raise exception 'PROFESSIONAL_MANAGEMENT_DENIED' using errcode='42501'; end if;
  if p_name is null or length(btrim(p_name)) = 0 or length(p_name) > 120 then raise exception 'INVALID_NAME' using errcode='22023'; end if;
  if p_commission_percentage is not null and (p_commission_percentage < 0 or p_commission_percentage > 100) then raise exception 'INVALID_COMMISSION' using errcode='22023'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_barbershop_id::text, 0));
  v_limit := public.get_effective_team_limit(p_barbershop_id);
  v_seats := public.get_effective_team_seat_count(p_barbershop_id);

  if not exists (select 1 from public.professionals where barbershop_id = p_barbershop_id and user_id = p_actor_user_id) then
    v_link := p_actor_user_id;
  elsif v_seats >= v_limit then
    raise exception 'TEAM_MEMBER_LIMIT_REACHED' using errcode='P0001';
  end if;

  insert into public.professionals(barbershop_id, user_id, name, commission_percentage, active)
  values(p_barbershop_id, v_link, btrim(p_name), p_commission_percentage, coalesce(p_active, true))
  returning * into v_new;
  return v_new;
end;
$$;

revoke all on function public.create_professional_with_plan_quota(uuid, uuid, varchar, integer, boolean) from public, anon, authenticated;
grant execute on function public.create_professional_with_plan_quota(uuid, uuid, varchar, integer, boolean) to service_role;

create or replace function public.update_barbershop_member(p_user_id uuid, p_role text, p_permissions jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_shop uuid; v_actor_role text; v_old_role text;
begin
  select barbershop_id, lower(coalesce(role,'')) into v_shop, v_actor_role from public.users where id=v_actor;
  if v_shop is null then raise exception 'team_permission_required' using errcode='42501'; end if;
  if v_actor_role in ('admin','manager') and not exists (select 1 from public.barbershop_member_permissions where barbershop_id=v_shop and user_id=v_actor and coalesce(permissions->>'team','false')='true') then raise exception 'team_permission_required' using errcode='42501'; end if;
  if v_actor_role not in ('owner','admin','manager') then raise exception 'team_permission_required' using errcode='42501'; end if;
  select lower(coalesce(role,'')) into v_old_role from public.users where id=p_user_id and barbershop_id=v_shop;
  if v_old_role is null then raise exception 'member_not_found' using errcode='22023'; end if;
  if v_old_role='owner' then raise exception 'owner_role_is_immutable' using errcode='42501'; end if;
  if p_role not in ('admin','manager','barber','receptionist','staff') then raise exception 'invalid_role' using errcode='22023'; end if;

  update public.users set role=p_role where id=p_user_id and barbershop_id=v_shop;
  insert into public.barbershop_member_permissions(user_id, barbershop_id, permissions, updated_at)
  values(p_user_id, v_shop, coalesce(p_permissions,'{}'::jsonb), now())
  on conflict(user_id) do update set barbershop_id=excluded.barbershop_id, permissions=excluded.permissions, updated_at=excluded.updated_at;
  perform public.sync_barber_professional(p_user_id, v_shop, p_role);
end;
$$;

revoke all on function public.update_barbershop_member(uuid,text,jsonb) from public, anon, authenticated;
grant execute on function public.update_barbershop_member(uuid,text,jsonb) to authenticated;

create or replace function public.remove_barbershop_member(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_shop uuid; v_actor_role text;
begin
  select barbershop_id, lower(coalesce(role,'')) into v_shop, v_actor_role from public.users where id=v_actor;
  if v_shop is null then raise exception 'team_permission_required' using errcode='42501'; end if;
  if v_actor_role in ('admin','manager') and not exists (select 1 from public.barbershop_member_permissions where barbershop_id=v_shop and user_id=v_actor and coalesce(permissions->>'team','false')='true') then raise exception 'team_permission_required' using errcode='42501'; end if;
  if v_actor_role not in ('owner','admin','manager') then raise exception 'team_permission_required' using errcode='42501'; end if;
  if exists(select 1 from public.users where id=p_user_id and role='owner') then raise exception 'owner_role_is_immutable' using errcode='42501'; end if;
  update public.professionals set active=false where barbershop_id=v_shop and user_id=p_user_id;
  update public.users set barbershop_id=null, role='client' where id=p_user_id and barbershop_id=v_shop;
  delete from public.barbershop_member_permissions where user_id=p_user_id;
end;
$$;

revoke all on function public.remove_barbershop_member(uuid) from public, anon, authenticated;
grant execute on function public.remove_barbershop_member(uuid) to authenticated;

commit;
