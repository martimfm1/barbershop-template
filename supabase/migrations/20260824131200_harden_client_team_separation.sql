begin;

-- CRM clients share public.users with team members, but a CRM client can never
-- be converted into a team member through the team-management RPC.
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
  if v_old_role = 'client' then raise exception 'clients_are_not_team_members' using errcode = '22023'; end if;
  if p_role not in ('admin','manager','barber','receptionist','staff') then raise exception 'invalid_role' using errcode = '22023'; end if;

  if p_role = 'barber' and v_old_role <> 'barber' then
    v_limit := public.get_effective_team_limit(v_shop);
    v_seat_count := public.get_effective_team_seat_count(v_shop);
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

commit;
