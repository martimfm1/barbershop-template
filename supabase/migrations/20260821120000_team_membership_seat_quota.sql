begin;

-- Team seats are the source of truth for paid-plan team limits.
-- The owner occupies one seat. Every non-client user linked to the barbershop
-- also consumes one seat, regardless of role.
create or replace function public.get_effective_team_limit(p_barbershop_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select case coalesce(public.get_effective_billing_plan_for_barbershop(p_barbershop_id), 'free')
    when 'free' then 1
    when 'pro' then 5
    when 'enterprise' then 2147483647
    else 1
  end;
$$;

create or replace function public.get_effective_team_member_count(p_barbershop_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.users
  where barbershop_id = p_barbershop_id
    and coalesce(lower(role), 'client') <> 'client';
$$;

revoke all on function public.get_effective_team_limit(uuid) from public, anon;
revoke all on function public.get_effective_team_member_count(uuid) from public, anon;
grant execute on function public.get_effective_team_limit(uuid) to authenticated;
grant execute on function public.get_effective_team_member_count(uuid) to authenticated;

-- A member can only enter a barbershop when a seat exists.
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
    'dashboard', true, 'agenda', true, 'clients', true, 'services', true,
    'team', false, 'messages', false, 'marketing', false, 'loyalty', false,
    'automations', false, 'analytics', false, 'qr', false, 'settings', false, 'billing', false
  );
  v_limit integer;
  v_member_count integer;
begin
  if v_user is null then raise exception 'not_authenticated' using errcode = '42501'; end if;
  if nullif(trim(p_code), '') is null then raise exception 'invalid_code' using errcode = '22023'; end if;
  if exists (select 1 from public.users where id = v_user and role = 'owner') then
    raise exception 'owner_cannot_join' using errcode = '42501';
  end if;

  v_hash := encode(digest(upper(trim(p_code)), 'sha256'), 'hex');
  select * into v_invite
  from public.barbershop_invite_codes
  where code_hash = v_hash and used_at is null and expires_at > now()
  order by created_at desc
  limit 1
  for update;

  if not found then raise exception 'invalid_or_expired_code' using errcode = '22023'; end if;

  if exists (
    select 1 from public.users
    where id = v_user and barbershop_id = v_invite.barbershop_id and coalesce(role, 'client') <> 'client'
  ) then
    raise exception 'already_team_member' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_invite.barbershop_id::text, 0));
  v_limit := public.get_effective_team_limit(v_invite.barbershop_id);
  v_member_count := public.get_effective_team_member_count(v_invite.barbershop_id);

  if v_member_count >= v_limit then
    raise exception using errcode = 'P0001', message = 'TEAM_MEMBER_LIMIT_REACHED';
  end if;

  perform set_config('app.silentra_invite_join', 'true', true);
  update public.users
  set barbershop_id = v_invite.barbershop_id,
      role = 'barber'
  where id = v_user;

  if not found then raise exception 'user_profile_not_found' using errcode = 'P0002'; end if;

  insert into public.barbershop_member_permissions(user_id, barbershop_id, permissions, updated_at)
  values (v_user, v_invite.barbershop_id, v_default_permissions, now())
  on conflict (user_id) do update
    set barbershop_id = excluded.barbershop_id,
        permissions = excluded.permissions,
        updated_at = now();

  perform public.sync_barber_professional(v_user, v_invite.barbershop_id, 'barber');

  update public.barbershop_invite_codes
  set used_at = now(), used_by = v_user
  where id = v_invite.id;

  return query select v_invite.barbershop_id, 'barber'::text;
end;
$$;

revoke all on function public.join_barbershop_with_invite(text) from public, anon, authenticated;
grant execute on function public.join_barbershop_with_invite(text) to authenticated;

commit;
