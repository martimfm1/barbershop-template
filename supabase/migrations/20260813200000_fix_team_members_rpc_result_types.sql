begin;

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
    u.name_complete::text,
    u.email::text,
    u.num_phone::text,
    u.role::text,
    exists (
      select 1 from public.barbershop_invite_codes ic
      where ic.used_by = u.id and ic.barbershop_id = v_shop
    ),
    (
      select min(ic.used_at) from public.barbershop_invite_codes ic
      where ic.used_by = u.id and ic.barbershop_id = v_shop
    ),
    coalesce(mp.permissions, jsonb_build_object(
      'dashboard', true, 'agenda', true, 'clients', true, 'services', false,
      'team', false, 'messages', false, 'settings', false, 'billing', false
    ))
  from public.users u
  left join public.barbershop_member_permissions mp on mp.user_id = u.id
  where u.barbershop_id = v_shop
  order by case when u.role = 'owner' then 0 else 1 end, lower(coalesce(u.name_complete::text, u.email::text));
end;
$$;

revoke all on function public.list_barbershop_members() from public, anon, authenticated;
grant execute on function public.list_barbershop_members() to authenticated;

commit;
