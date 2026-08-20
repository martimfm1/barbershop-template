begin;

create or replace function public.redeem_loyalty_reward(
  p_member_id uuid,
  p_reward_id uuid,
  p_token_hash text,
  p_code_hash text,
  p_expires_at timestamptz
)
returns table (
  redemption_id uuid,
  points_balance integer,
  points_cost integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.loyalty_members;
  v_reward public.loyalty_rewards;
  v_redemption_id uuid;
  v_new_balance integer;
begin
  perform public.expire_loyalty_redemptions();

  select lm.*
  into v_member
  from public.loyalty_members as lm
  where lm.id = p_member_id
    and lm.status = 'active'
  for update;

  if not found then
    raise exception 'LOYALTY_MEMBER_NOT_FOUND';
  end if;

  select lr.*
  into v_reward
  from public.loyalty_rewards as lr
  where lr.id = p_reward_id
    and lr.barbershop_id = v_member.barbershop_id
    and lr.active = true
  for update;

  if not found then
    raise exception 'LOYALTY_REWARD_NOT_FOUND';
  end if;

  if v_member.points_balance < v_reward.points_cost then
    raise exception 'LOYALTY_INSUFFICIENT_POINTS';
  end if;

  update public.loyalty_members as lm
  set points_balance = lm.points_balance - v_reward.points_cost,
      updated_at = now()
  where lm.id = v_member.id
  returning lm.points_balance into v_new_balance;

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
    p_expires_at,
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

  redemption_id := v_redemption_id;
  points_balance := v_new_balance;
  points_cost := v_reward.points_cost;
  return next;
end;
$$;

revoke all on function public.redeem_loyalty_reward(uuid, uuid, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.redeem_loyalty_reward(uuid, uuid, text, text, timestamptz) to service_role;

notify pgrst, 'reload schema';

commit;
