begin;

create or replace function public.redeem_loyalty_reward(
  p_member_id uuid,
  p_reward_id uuid,
  p_token_hash text,
  p_code_hash text,
  p_expires_at timestamptz
)
returns table (redemption_id uuid, points_balance integer, points_cost integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.loyalty_members;
  v_reward public.loyalty_rewards;
  v_redemption_id uuid;
  v_new_balance integer;
  v_expires_at timestamptz := p_expires_at;
begin
  if p_member_id is null or p_reward_id is null or nullif(trim(p_token_hash), '') is null or nullif(trim(p_code_hash), '') is null then
    raise exception 'LOYALTY_REDEMPTION_INVALID';
  end if;

  if v_expires_at is null or v_expires_at <= now() or v_expires_at > now() + interval '1 hour' then
    v_expires_at := now() + interval '1 hour';
  end if;

  perform public.expire_loyalty_redemptions();

  select * into v_member
  from public.loyalty_members
  where id = p_member_id and status = 'active'
  for update;

  if not found then raise exception 'LOYALTY_MEMBER_NOT_FOUND'; end if;

  select * into v_reward
  from public.loyalty_rewards
  where id = p_reward_id
    and barbershop_id = v_member.barbershop_id
    and active = true
  for update;

  if not found then raise exception 'LOYALTY_REWARD_NOT_FOUND'; end if;
  if v_member.points_balance < v_reward.points_cost then raise exception 'LOYALTY_INSUFFICIENT_POINTS'; end if;

  if exists (
    select 1
    from public.loyalty_redemptions
    where member_id = v_member.id
      and status = 'pending'
      and expires_at > now()
  ) then
    raise exception 'LOYALTY_ACTIVE_REDEMPTION_EXISTS';
  end if;

  update public.loyalty_members
  set points_balance = points_balance - v_reward.points_cost,
      updated_at = now()
  where id = v_member.id
  returning points_balance into v_new_balance;

  insert into public.loyalty_redemptions (
    barbershop_id,
    member_id,
    reward_id,
    points_spent,
    status,
    token_hash,
    code_hash,
    expires_at,
    created_at,
    updated_at
  )
  values (
    v_member.barbershop_id,
    v_member.id,
    v_reward.id,
    v_reward.points_cost,
    'pending',
    p_token_hash,
    p_code_hash,
    v_expires_at,
    now(),
    now()
  )
  returning id into v_redemption_id;

  insert into public.loyalty_member_transactions (
    barbershop_id,
    member_id,
    points,
    type,
    reference_id,
    description
  )
  values (
    v_member.barbershop_id,
    v_member.id,
    -v_reward.points_cost,
    'redemption',
    v_redemption_id,
    v_reward.name
  );

  return query
  select v_redemption_id, v_new_balance, v_reward.points_cost;
end;
$$;

create or replace function public.expire_loyalty_redemptions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
  v_row record;
begin
  for v_row in
    select id, member_id, barbershop_id, points_spent
    from public.loyalty_redemptions
    where status = 'pending'
      and expires_at is not null
      and expires_at <= now()
    for update
  loop
    update public.loyalty_redemptions
    set status = 'cancelled',
        updated_at = now()
    where id = v_row.id;

    if v_row.member_id is not null then
      update public.loyalty_members
      set points_balance = points_balance + v_row.points_spent,
          updated_at = now()
      where id = v_row.member_id;

      insert into public.loyalty_member_transactions (
        barbershop_id,
        member_id,
        points,
        type,
        reference_id,
        description
      )
      values (
        v_row.barbershop_id,
        v_row.member_id,
        v_row.points_spent,
        'refund',
        v_row.id,
        'Resgate expirado'
      );
    end if;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

do $$
begin
  if exists (
    select 1 from pg_proc
    where proname = 'redeem_loyalty_reward'
      and pg_get_function_identity_arguments(oid) = 'uuid, uuid, text, text, timestamp with time zone'
  ) then
    revoke all on function public.redeem_loyalty_reward(uuid, uuid, text, text, timestamptz) from public, anon, authenticated;
    grant execute on function public.redeem_loyalty_reward(uuid, uuid, text, text, timestamptz) to service_role;
  end if;
end;
$$;

do $$
begin
  if exists (
    select 1 from pg_proc
    where proname = 'expire_loyalty_redemptions'
      and pg_get_function_identity_arguments(oid) = ''
  ) then
    revoke all on function public.expire_loyalty_redemptions() from public, anon, authenticated;
    grant execute on function public.expire_loyalty_redemptions() to service_role;
  end if;
end;
$$;

commit;
