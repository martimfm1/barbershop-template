begin;

-- Client profiles are CRM records, not team members.
-- Prevent future team-role mutations from accidentally assigning a client role
-- through the team-management update RPCs while keeping the shared users table.
create or replace function public.update_barbershop_member(
  p_user_id uuid,
  p_role text,
  p_permissions jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor public.users%rowtype;
  v_target public.users%rowtype;
begin
  select * into v_actor from public.users where id = auth.uid() limit 1;
  if v_actor.id is null or v_actor.role <> 'owner' then
    raise exception 'owner_only' using errcode = '42501';
  end if;

  select * into v_target
  from public.users
  where id = p_user_id
    and barbershop_id = v_actor.barbershop_id
  for update;

  if v_target.id is null then
    raise exception 'team_member_not_found' using errcode = 'P0002';
  end if;

  if lower(v_target.role) = 'client' then
    raise exception 'clients_are_not_team_members' using errcode = '22023';
  end if;

  if p_role not in ('admin','manager','barber','receptionist','staff') then
    raise exception 'invalid_team_role' using errcode = '22023';
  end if;

  update public.users
  set role = p_role
  where id = p_user_id;

  insert into public.barbershop_member_permissions(user_id, barbershop_id, permissions, updated_at)
  values (p_user_id, v_actor.barbershop_id, coalesce(p_permissions, '{}'::jsonb), now())
  on conflict (user_id) do update
    set permissions = excluded.permissions,
        updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.update_barbershop_member(uuid, text, jsonb) from public, anon;
grant execute on function public.update_barbershop_member(uuid, text, jsonb) to authenticated;

commit;
