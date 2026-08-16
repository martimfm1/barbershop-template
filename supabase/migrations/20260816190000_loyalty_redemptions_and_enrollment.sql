begin;

create extension if not exists pgcrypto;

create table if not exists public.loyalty_programs (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null unique,
  enabled boolean not null default false,
  name text not null default 'Programa de Fidelização',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.loyalty_members
  add column if not exists barbershop_id uuid,
  add column if not exists program_id uuid,
  add column if not exists status text not null default 'active',
  add column if not exists joined_at timestamptz not null default now();

create index if not exists loyalty_members_barbershop_idx on public.loyalty_members (barbershop_id, status);
create index if not exists loyalty_members_email_idx on public.loyalty_members (lower(email));
create unique index if not exists loyalty_members_one_active_email_idx
  on public.loyalty_members (lower(email)) where status = 'active';

alter table public.loyalty_rewards
  add column if not exists barbershop_id uuid,
  add column if not exists active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists loyalty_rewards_barbershop_active_idx
  on public.loyalty_rewards (barbershop_id, active, points_required);

create table if not exists public.loyalty_earning_rules (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null,
  name text not null,
  service_id uuid,
  points integer not null check (points > 0 and points <= 100000),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists loyalty_earning_rules_shop_idx
  on public.loyalty_earning_rules (barbershop_id, active);

create table if not exists public.loyalty_redemptions (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null,
  member_id uuid not null,
  reward_id uuid not null,
  points_cost integer not null check (points_cost > 0),
  status text not null default 'pending' check (status in ('pending','validated','expired','voided')),
  token_hash text not null unique,
  code_hash text not null unique,
  expires_at timestamptz not null,
  validated_at timestamptz,
  validated_by_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists loyalty_redemptions_shop_status_idx
  on public.loyalty_redemptions (barbershop_id, status, created_at desc);
create index if not exists loyalty_redemptions_member_idx
  on public.loyalty_redemptions (member_id, created_at desc);
create index if not exists loyalty_redemptions_expires_idx
  on public.loyalty_redemptions (status, expires_at);

alter table public.loyalty_programs enable row level security;
alter table public.loyalty_members enable row level security;
alter table public.loyalty_rewards enable row level security;
alter table public.loyalty_earning_rules enable row level security;
alter table public.loyalty_redemptions enable row level security;

revoke all on public.loyalty_programs from public, anon, authenticated;
revoke all on public.loyalty_members from public, anon, authenticated;
revoke all on public.loyalty_rewards from public, anon, authenticated;
revoke all on public.loyalty_earning_rules from public, anon, authenticated;
revoke all on public.loyalty_redemptions from public, anon, authenticated;

create or replace function public.join_loyalty_program(
  p_barbershop_id uuid,
  p_program_id uuid,
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
  v_program public.loyalty_programs;
  v_existing public.loyalty_members;
  v_email text := lower(trim(p_email));
begin
  if v_email = '' or length(v_email) > 254 then
    raise exception 'LOYALTY_EMAIL_INVALID';
  end if;

  select * into v_program
  from public.loyalty_programs
  where id = p_program_id and barbershop_id = p_barbershop_id and enabled = true;

  if not found then
    raise exception 'LOYALTY_PROGRAM_UNAVAILABLE';
  end if;

  select * into v_existing
  from public.loyalty_members
  where lower(email) = v_email and status = 'active'
  limit 1;

  if found then
    if v_existing.barbershop_id = p_barbershop_id then
      return v_existing;
    end if;
    raise exception 'LOYALTY_ALREADY_ENROLLED';
  end if;

  insert into public.loyalty_members (barbershop_id, program_id, email, name, points_balance, status, joined_at)
  values (p_barbershop_id, p_program_id, v_email, nullif(trim(p_name), ''), 0, 'active', now())
  returning * into v_member;

  return v_member;
exception
  when unique_violation then
    raise exception 'LOYALTY_ALREADY_ENROLLED';
end;
$$;

create or replace function public.expire_loyalty_redemptions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with expired as (
    update public.loyalty_redemptions r
    set status = 'expired', updated_at = now()
    where r.status = 'pending'
      and r.expires_at <= now()
    returning r.member_id, r.points_cost
  )
  update public.loyalty_members m
  set points_balance = m.points_balance + expired.points_cost
  from expired
  where m.id = expired.member_id;

  get diagnostics v_count = row_count;
  return coalesce(v_count, 0);
end;
$$;

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
  v_program public.loyalty_programs;
  v_redemption_id uuid;
begin
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
  if v_member.points_balance < v_reward.points_required then raise exception 'LOYALTY_INSUFFICIENT_POINTS'; end if;

  update public.loyalty_members
  set points_balance = points_balance - v_reward.points_required, updated_at = now()
  where id = v_member.id
  returning points_balance into points_balance;

  insert into public.loyalty_redemptions (
    barbershop_id, member_id, reward_id, points_cost, status, token_hash, code_hash, expires_at
  )
  values (
    v_member.barbershop_id, v_member.id, v_reward.id, v_reward.points_required, 'pending', p_token_hash, p_code_hash, p_expires_at
  )
  returning id into v_redemption_id;

  redemption_id := v_redemption_id;
  points_cost := v_reward.points_required;
  return next;
end;
$$;

create or replace function public.validate_loyalty_redemption(
  p_barbershop_id uuid,
  p_identifier_hash text,
  p_staff_user_id uuid
)
returns table (
  redemption_id uuid,
  reward_name text,
  points_cost integer,
  member_email text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_redemption public.loyalty_redemptions;
  v_reward public.loyalty_rewards;
  v_user public.users;
begin
  perform public.expire_loyalty_redemptions();

  select * into v_user from public.users where id = p_staff_user_id;
  if not found or lower(coalesce(v_user.role, '')) not in ('owner','barber','staff','admin') then
    raise exception 'LOYALTY_STAFF_UNAUTHORIZED';
  end if;

  select * into v_redemption
  from public.loyalty_redemptions
  where barbershop_id = p_barbershop_id
    and (token_hash = p_identifier_hash or code_hash = p_identifier_hash)
    and status = 'pending'
  for update;

  if not found then raise exception 'LOYALTY_REDEMPTION_INVALID'; end if;
  if v_redemption.expires_at <= now() then
    update public.loyalty_redemptions set status = 'expired', updated_at = now() where id = v_redemption.id;
    update public.loyalty_members set points_balance = points_balance + v_redemption.points_cost, updated_at = now() where id = v_redemption.member_id;
    raise exception 'LOYALTY_REDEMPTION_EXPIRED';
  end if;

  select * into v_reward from public.loyalty_rewards where id = v_redemption.reward_id and barbershop_id = p_barbershop_id;
  if not found then raise exception 'LOYALTY_REWARD_NOT_FOUND'; end if;

  update public.loyalty_redemptions
  set status = 'validated', validated_at = now(), validated_by_user_id = p_staff_user_id, updated_at = now()
  where id = v_redemption.id;

  redemption_id := v_redemption.id;
  reward_name := v_reward.name;
  points_cost := v_redemption.points_cost;
  select email into member_email from public.loyalty_members where id = v_redemption.member_id;
  return next;
end;
$$;

revoke all on function public.join_loyalty_program(uuid,uuid,text,text) from public, anon, authenticated;
revoke all on function public.expire_loyalty_redemptions() from public, anon, authenticated;
revoke all on function public.redeem_loyalty_reward(uuid,uuid,text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.validate_loyalty_redemption(uuid,text,uuid) from public, anon, authenticated;

grant execute on function public.join_loyalty_program(uuid,uuid,text,text) to service_role;
grant execute on function public.expire_loyalty_redemptions() to service_role;
grant execute on function public.redeem_loyalty_reward(uuid,uuid,text,text,timestamptz) to service_role;
grant execute on function public.validate_loyalty_redemption(uuid,text,uuid) to service_role;

commit;
