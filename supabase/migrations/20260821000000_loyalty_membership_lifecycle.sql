begin;

create or replace function public.join_loyalty_program(
  p_barbershop_id uuid,
  p_email text,
  p_name text default null
)
returns public.loyalty_members
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.loyalty_members;
  v_settings public.loyalty_settings;
  v_existing_active public.loyalty_members;
  v_existing_inactive public.loyalty_members;
  v_user public.users;
  v_email text := lower(trim(p_email));
begin
  if v_email = '' or length(v_email) > 254 then raise exception 'LOYALTY_EMAIL_INVALID'; end if;

  select * into v_settings from public.loyalty_settings where barbershop_id = p_barbershop_id and enabled = true;
  if not found then raise exception 'LOYALTY_PROGRAM_UNAVAILABLE'; end if;

  select * into v_existing_active
  from public.loyalty_members
  where lower(email) = v_email and status = 'active'
  limit 1;

  if found then
    if v_existing_active.barbershop_id = p_barbershop_id then return v_existing_active; end if;
    raise exception 'LOYALTY_ALREADY_ENROLLED';
  end if;

  select * into v_existing_inactive
  from public.loyalty_members
  where barbershop_id = p_barbershop_id
    and lower(email) = v_email
    and status = 'inactive'
  order by updated_at desc
  limit 1
  for update;

  if found then
    update public.loyalty_members lm
    set status = 'active',
        name = coalesce(nullif(trim(p_name), ''), lm.name),
        updated_at = now()
    where lm.id = v_existing_inactive.id
    returning lm.* into v_member;
    return v_member;
  end if;

  insert into public.loyalty_members (barbershop_id, email, name, points_balance, status, joined_at, updated_at)
  values (p_barbershop_id, v_email, nullif(trim(p_name), ''), greatest(v_settings.welcome_points, 0), 'active', now(), now())
  returning * into v_member;

  if v_settings.welcome_points > 0 then
    insert into public.loyalty_member_transactions (barbershop_id, member_id, points, type, description)
    values (p_barbershop_id, v_member.id, v_settings.welcome_points, 'welcome', 'Pontos de boas-vindas');
  end if;

  select * into v_user from public.users where lower(email) = v_email limit 1;
  if found then
    insert into public.loyalty_accounts (barbershop_id, client_id, points_balance, lifetime_points)
    values (p_barbershop_id, v_user.id, v_member.points_balance, v_member.points_balance)
    on conflict (barbershop_id, client_id) do update
      set points_balance = excluded.points_balance,
          lifetime_points = greatest(public.loyalty_accounts.lifetime_points, excluded.lifetime_points),
          updated_at = now();
  end if;

  return v_member;
exception when unique_violation then
  raise exception 'LOYALTY_ALREADY_ENROLLED';
end;
$$;

create or replace function public.leave_loyalty_program(p_barbershop_id uuid, p_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_member_id uuid;
begin
  if v_email = '' or length(v_email) > 254 then raise exception 'LOYALTY_EMAIL_INVALID'; end if;

  select lm.id into v_member_id
  from public.loyalty_members lm
  where lm.barbershop_id = p_barbershop_id
    and lower(lm.email) = v_email
    and lm.status = 'active'
  for update;

  if v_member_id is null then return false; end if;

  update public.loyalty_members lm
  set status = 'inactive', updated_at = now()
  where lm.id = v_member_id;

  delete from public.loyalty_sessions
  where barbershop_id = p_barbershop_id and lower(email) = v_email;

  return true;
end;
$$;

create or replace function public.admin_find_loyalty_member_by_email(p_email text)
returns table (
  member_id uuid,
  member_email text,
  member_name text,
  points_balance integer,
  status text,
  barbershop_id uuid,
  barbershop_name text,
  barbershop_slug text
)
language plpgsql
security definer
set search_path = public
as $$
declare v_email text := lower(trim(p_email));
begin
  if v_email = '' or length(v_email) > 254 then raise exception 'LOYALTY_EMAIL_INVALID'; end if;
  return query
  select lm.id, lm.email, lm.name, lm.points_balance, lm.status, lm.barbershop_id, b.name, b.slug
  from public.loyalty_members lm
  join public.barbershops b on b.id = lm.barbershop_id
  where lower(lm.email) = v_email and lm.status = 'active'
  order by lm.updated_at desc
  limit 1;
end;
$$;

create or replace function public.admin_grant_loyalty_points_by_email(p_email text, p_points integer, p_reason text default null)
returns table (
  member_id uuid,
  member_email text,
  barbershop_id uuid,
  barbershop_name text,
  previous_balance integer,
  points_added integer,
  new_balance integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.loyalty_members;
  v_shop public.barbershops;
  v_email text := lower(trim(coalesce(p_email, '')));
  v_reason text := nullif(left(trim(coalesce(p_reason, '')), 500), '');
  v_previous integer;
  v_new integer;
begin
  if v_email = '' or length(v_email) > 254 then raise exception 'LOYALTY_EMAIL_INVALID'; end if;
  if p_points is null or p_points <= 0 or p_points > 1000000 then raise exception 'LOYALTY_POINTS_INVALID'; end if;
  if v_reason is null then raise exception 'LOYALTY_REASON_REQUIRED'; end if;

  select lm.* into v_member
  from public.loyalty_members lm
  where lower(lm.email) = v_email and lm.status = 'active'
  order by lm.updated_at desc
  limit 1
  for update;
  if not found then raise exception 'LOYALTY_MEMBER_NOT_FOUND'; end if;

  select b.* into v_shop from public.barbershops b where b.id = v_member.barbershop_id;
  if not found then raise exception 'LOYALTY_BARBERSHOP_NOT_FOUND'; end if;

  v_previous := v_member.points_balance;
  v_new := v_previous + p_points;

  update public.loyalty_members lm set points_balance = v_new, updated_at = now() where lm.id = v_member.id;
  insert into public.loyalty_member_transactions (barbershop_id, member_id, points, type, description)
  values (v_member.barbershop_id, v_member.id, p_points, 'adjustment', 'Admin: ' || v_reason);
  perform public.sync_loyalty_legacy_account(v_member.id);

  return query select v_member.id, v_member.email, v_member.barbershop_id, v_shop.name, v_previous, p_points, v_new;
end;
$$;

drop index if exists public.loyalty_members_one_active_email_idx;
create unique index loyalty_members_one_active_email_idx on public.loyalty_members (lower(email)) where status = 'active';

revoke all on function public.leave_loyalty_program(uuid, text) from public, anon, authenticated;
revoke all on function public.admin_find_loyalty_member_by_email(text) from public, anon, authenticated;
revoke all on function public.admin_grant_loyalty_points_by_email(text, integer, text) from public, anon, authenticated;
grant execute on function public.leave_loyalty_program(uuid, text) to service_role;
grant execute on function public.admin_find_loyalty_member_by_email(text) to service_role;
grant execute on function public.admin_grant_loyalty_points_by_email(text, integer, text) to service_role;

commit;
