begin;

-- Fix directory visibility updates from the authenticated dashboard.
-- The previous migration restricted this RPC to service_role even though the
-- dashboard calls it through the authenticated Supabase client.
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
  if auth.uid() is null or p_actor_user_id is null or auth.uid() <> p_actor_user_id then
    raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED';
  end if;

  select u.barbershop_id, u.role
    into v_user_barbershop_id, v_role
  from public.users u
  where u.id = auth.uid();

  if v_user_barbershop_id is null or v_user_barbershop_id <> p_barbershop_id then
    raise exception using errcode = '42501', message = 'BARBERSHOP_ACCESS_DENIED';
  end if;

  if coalesce(lower(v_role), '') not in ('admin', 'owner') then
    raise exception using errcode = '42501', message = 'DIRECTORY_VISIBILITY_DENIED';
  end if;

  select case
    when s.plan_override in ('pro', 'enterprise') then s.plan_override::text
    when s.status in ('active', 'trialing') and s.plan in ('pro', 'enterprise') then s.plan::text
    else 'free'
  end
    into v_plan
  from public.subscriptions s
  join public.users u on u.id = s.user_id
  where u.barbershop_id = p_barbershop_id
  order by case
    when s.plan_override in ('pro', 'enterprise') then 0
    when s.status in ('active', 'trialing') then 1
    else 2
  end, s.updated_at desc
  limit 1;

  if v_plan not in ('pro', 'enterprise') then
    raise exception using errcode = '42501', message = 'DIRECTORY_VISIBILITY_PRO_REQUIRED';
  end if;

  update public.barbershops
  set is_public_in_directory = coalesce(p_visible, true),
      updated_at = now()
  where id = p_barbershop_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'BARBERSHOP_NOT_FOUND';
  end if;

  return true;
end;
$$;

revoke all on function public.set_barbershop_directory_visibility(uuid, uuid, boolean) from public, anon;
grant execute on function public.set_barbershop_directory_visibility(uuid, uuid, boolean) to authenticated, service_role;

commit;
