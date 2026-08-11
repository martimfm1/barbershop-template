-- Directory visibility is a Pro/Enterprise entitlement.
-- The UI is only a convenience; this RPC is the server-side boundary.
create or replace function public.set_barbershop_directory_visibility(
  p_actor_user_id uuid,
  p_barbershop_id uuid,
  p_visible boolean
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_barbershop_id uuid;
  v_role text;
  v_plan text := 'free';
begin
  select u.barbershop_id, u.role
    into v_user_barbershop_id, v_role
  from public.users u
  where u.id = p_actor_user_id;

  if v_user_barbershop_id is null or v_user_barbershop_id <> p_barbershop_id then
    raise exception using errcode = '42501', message = 'BARBERSHOP_ACCESS_DENIED';
  end if;

  if coalesce(lower(v_role), '') not in ('admin', 'owner') then
    raise exception using errcode = '42501', message = 'DIRECTORY_VISIBILITY_DENIED';
  end if;

  select case
    when s.status in ('active', 'trialing') and s.plan in ('pro', 'enterprise') then s.plan::text
    else 'free'
  end
    into v_plan
  from public.subscriptions s
  join public.users u on u.id = s.user_id
  where u.barbershop_id = p_barbershop_id
  order by case when s.status in ('active', 'trialing') then 0 else 1 end,
           s.updated_at desc
  limit 1;

  if v_plan not in ('pro', 'enterprise') then
    raise exception using errcode = '42501', message = 'DIRECTORY_VISIBILITY_PRO_REQUIRED';
  end if;

  update public.barbershops
  set is_public_in_directory = coalesce(p_visible, true)
  where id = p_barbershop_id;

  return true;
end;
$$;

revoke all on function public.set_barbershop_directory_visibility(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.set_barbershop_directory_visibility(uuid, uuid, boolean) to service_role;
