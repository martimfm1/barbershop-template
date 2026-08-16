begin;

create extension if not exists pgcrypto;

alter table public.loyalty_members
  add column if not exists status text not null default 'active',
  add column if not exists joined_at timestamptz not null default now();

create index if not exists loyalty_members_barbershop_status_idx on public.loyalty_members (barbershop_id, status);
create index if not exists loyalty_members_email_idx on public.loyalty_members (lower(email));
create unique index if not exists loyalty_members_one_active_email_idx on public.loyalty_members (lower(email)) where status = 'active';

alter table public.loyalty_rewards add column if not exists updated_at timestamptz not null default now();

create table if not exists public.loyalty_earning_rules (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 120),
  service_id uuid references public.services(id) on delete set null,
  points integer not null check (points > 0 and points <= 100000),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists loyalty_earning_rules_shop_idx on public.loyalty_earning_rules (barbershop_id, active, created_at desc);

create table if not exists public.loyalty_member_transactions (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  member_id uuid not null references public.loyalty_members(id) on delete cascade,
  points integer not null check (points <> 0),
  type text not null check (type in ('booking','product','welcome','referral','adjustment','redemption','refund')),
  reference_id uuid,
  description text,
  created_at timestamptz not null default now()
);
create unique index if not exists loyalty_member_transactions_booking_once_idx
  on public.loyalty_member_transactions (member_id, reference_id) where type = 'booking' and reference_id is not null;
create index if not exists loyalty_member_transactions_member_idx on public.loyalty_member_transactions (member_id, created_at desc);

alter table public.loyalty_redemptions
  alter column client_id drop not null,
  add column if not exists member_id uuid references public.loyalty_members(id) on delete cascade,
  add column if not exists token_hash text,
  add column if not exists code_hash text,
  add column if not exists expires_at timestamptz,
  add column if not exists validated_at timestamptz,
  add column if not exists validated_by_user_id uuid,
  add column if not exists updated_at timestamptz not null default now();
create unique index if not exists loyalty_redemptions_token_hash_idx on public.loyalty_redemptions (token_hash) where token_hash is not null;
create unique index if not exists loyalty_redemptions_code_hash_idx on public.loyalty_redemptions (code_hash) where code_hash is not null;
create index if not exists loyalty_redemptions_member_idx on public.loyalty_redemptions (member_id, created_at desc);
create index if not exists loyalty_redemptions_shop_pending_idx on public.loyalty_redemptions (barbershop_id, status, expires_at);

alter table public.loyalty_earning_rules enable row level security;
alter table public.loyalty_member_transactions enable row level security;
revoke all on public.loyalty_earning_rules from public, anon, authenticated;
revoke all on public.loyalty_member_transactions from public, anon, authenticated;

create or replace function public.join_loyalty_program(p_barbershop_id uuid, p_email text, p_name text default null)
returns public.loyalty_members
language plpgsql security definer set search_path = public
as $$
declare v_member public.loyalty_members; v_settings public.loyalty_settings; v_existing public.loyalty_members; v_user public.users; v_email text := lower(trim(p_email));
begin
  if v_email = '' or length(v_email) > 254 then raise exception 'LOYALTY_EMAIL_INVALID'; end if;
  select * into v_settings from public.loyalty_settings where barbershop_id = p_barbershop_id and enabled = true;
  if not found then raise exception 'LOYALTY_PROGRAM_UNAVAILABLE'; end if;
  select * into v_existing from public.loyalty_members where lower(email) = v_email and status = 'active' limit 1;
  if found then
    if v_existing.barbershop_id = p_barbershop_id then return v_existing; end if;
    raise exception 'LOYALTY_ALREADY_ENROLLED';
  end if;
  insert into public.loyalty_members (barbershop_id, email, name, points_balance, status, joined_at, updated_at)
  values (p_barbershop_id, v_email, nullif(trim(p_name), ''), greatest(v_settings.welcome_points, 0), 'active', now(), now()) returning * into v_member;
  insert into public.loyalty_member_transactions (barbershop_id, member_id, points, type, description)
  select p_barbershop_id, v_member.id, v_settings.welcome_points, 'welcome', 'Pontos de boas-vindas' where v_settings.welcome_points > 0;
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
exception when unique_violation then raise exception 'LOYALTY_ALREADY_ENROLLED';
end;
$$;

create or replace function public.expire_loyalty_redemptions()
returns integer language plpgsql security definer set search_path = public
as $$
declare v_count integer := 0; v_row record;
begin
  for v_row in select id, member_id, points_spent from public.loyalty_redemptions where status = 'pending' and expires_at is not null and expires_at <= now() for update loop
    update public.loyalty_redemptions set status = 'cancelled', updated_at = now() where id = v_row.id;
    if v_row.member_id is not null then
      update public.loyalty_members set points_balance = points_balance + v_row.points_spent, updated_at = now() where id = v_row.member_id;
      insert into public.loyalty_member_transactions (barbershop_id, member_id, points, type, reference_id, description)
      select r.barbershop_id, r.member_id, r.points_spent, 'refund', r.id, 'Resgate expirado' from public.loyalty_redemptions r where r.id = v_row.id;
    end if;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

create or replace function public.redeem_loyalty_reward(p_member_id uuid, p_reward_id uuid, p_token_hash text, p_code_hash text, p_expires_at timestamptz)
returns table (redemption_id uuid, points_balance integer, points_cost integer)
language plpgsql security definer set search_path = public
as $$
declare v_member public.loyalty_members; v_reward public.loyalty_rewards; v_redemption_id uuid; v_new_balance integer;
begin
  perform public.expire_loyalty_redemptions();
  select * into v_member from public.loyalty_members where id = p_member_id and status = 'active' for update;
  if not found then raise exception 'LOYALTY_MEMBER_NOT_FOUND'; end if;
  select * into v_reward from public.loyalty_rewards where id = p_reward_id and barbershop_id = v_member.barbershop_id and active = true for update;
  if not found then raise exception 'LOYALTY_REWARD_NOT_FOUND'; end if;
  if v_member.points_balance < v_reward.points_cost then raise exception 'LOYALTY_INSUFFICIENT_POINTS'; end if;
  update public.loyalty_members set points_balance = points_balance - v_reward.points_cost, updated_at = now() where id = v_member.id returning points_balance into v_new_balance;
  insert into public.loyalty_redemptions (barbershop_id, member_id, reward_id, points_spent, status, token_hash, code_hash, expires_at, created_at, updated_at)
  values (v_member.barbershop_id, v_member.id, v_reward.id, v_reward.points_cost, 'pending', p_token_hash, p_code_hash, p_expires_at, now(), now()) returning id into v_redemption_id;
  insert into public.loyalty_member_transactions (barbershop_id, member_id, points, type, reference_id, description)
  values (v_member.barbershop_id, v_member.id, -v_reward.points_cost, 'redemption', v_redemption_id, v_reward.name);
  redemption_id := v_redemption_id; points_balance := v_new_balance; points_cost := v_reward.points_cost; return next;
end;
$$;

create or replace function public.validate_loyalty_redemption(p_barbershop_id uuid, p_identifier_hash text, p_staff_user_id uuid)
returns table (redemption_id uuid, reward_name text, points_cost integer, member_email text)
language plpgsql security definer set search_path = public
as $$
declare v_redemption public.loyalty_redemptions; v_reward public.loyalty_rewards; v_user public.users;
begin
  perform public.expire_loyalty_redemptions();
  select * into v_user from public.users where id = p_staff_user_id;
  if not found or lower(coalesce(v_user.role, '')) not in ('owner','barber','staff','admin') then raise exception 'LOYALTY_STAFF_UNAUTHORIZED'; end if;
  if v_user.barbershop_id is distinct from p_barbershop_id then raise exception 'LOYALTY_STAFF_UNAUTHORIZED'; end if;
  select * into v_redemption from public.loyalty_redemptions where barbershop_id = p_barbershop_id and (token_hash = p_identifier_hash or code_hash = p_identifier_hash) and status = 'pending' for update;
  if not found then raise exception 'LOYALTY_REDEMPTION_INVALID'; end if;
  if v_redemption.expires_at is null or v_redemption.expires_at <= now() then
    update public.loyalty_redemptions set status = 'cancelled', updated_at = now() where id = v_redemption.id;
    if v_redemption.member_id is not null then
      update public.loyalty_members set points_balance = points_balance + v_redemption.points_spent, updated_at = now() where id = v_redemption.member_id;
      insert into public.loyalty_member_transactions (barbershop_id, member_id, points, type, reference_id, description) values (v_redemption.barbershop_id, v_redemption.member_id, v_redemption.points_spent, 'refund', v_redemption.id, 'Resgate expirado');
    end if;
    raise exception 'LOYALTY_REDEMPTION_EXPIRED';
  end if;
  select * into v_reward from public.loyalty_rewards where id = v_redemption.reward_id and barbershop_id = p_barbershop_id;
  if not found then raise exception 'LOYALTY_REWARD_NOT_FOUND'; end if;
  update public.loyalty_redemptions set status = 'fulfilled', validated_at = now(), validated_by_user_id = p_staff_user_id, fulfilled_at = now(), updated_at = now() where id = v_redemption.id;
  redemption_id := v_redemption.id; reward_name := v_reward.name; points_cost := v_redemption.points_spent;
  select email into member_email from public.loyalty_members where id = v_redemption.member_id;
  return next;
end;
$$;

create or replace function public.award_loyalty_points_for_appointment()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare v_rule public.loyalty_earning_rules; v_member public.loyalty_members; v_inserted uuid;
begin
  if new.status <> 'completed' or old.status = 'completed' or new.manual_email is null or trim(new.manual_email) = '' then return new; end if;
  select * into v_member from public.loyalty_members where barbershop_id = new.barbershop_id and lower(email) = lower(trim(new.manual_email)) and status = 'active' for update;
  if not found then return new; end if;
  select * into v_rule from public.loyalty_earning_rules where barbershop_id = new.barbershop_id and service_id = new.service_id and active = true order by updated_at desc limit 1;
  if not found then return new; end if;
  insert into public.loyalty_member_transactions (barbershop_id, member_id, points, type, reference_id, description)
  values (new.barbershop_id, v_member.id, v_rule.points, 'booking', new.id, v_rule.name) on conflict (member_id, reference_id) where type = 'booking' do nothing returning id into v_inserted;
  if v_inserted is not null then
    update public.loyalty_members set points_balance = points_balance + v_rule.points, updated_at = now() where id = v_member.id;
    begin
      update public.loyalty_accounts set points_balance = points_balance + v_rule.points, lifetime_points = lifetime_points + v_rule.points, updated_at = now() where barbershop_id = new.barbershop_id and client_id = (select id from public.users where lower(email) = lower(trim(new.manual_email)) limit 1);
    exception when undefined_table then null;
    end;
  end if;
  return new;
end;
$$;

drop trigger if exists loyalty_award_points_on_appointment on public.appointments;
create trigger loyalty_award_points_on_appointment
after update of status on public.appointments
for each row execute function public.award_loyalty_points_for_appointment();

revoke all on function public.join_loyalty_program(uuid,text,text) from public, anon, authenticated;
revoke all on function public.expire_loyalty_redemptions() from public, anon, authenticated;
revoke all on function public.redeem_loyalty_reward(uuid,uuid,text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.validate_loyalty_redemption(uuid,text,uuid) from public, anon, authenticated;
revoke all on function public.award_loyalty_points_for_appointment() from public, anon, authenticated;
grant execute on function public.join_loyalty_program(uuid,text,text) to service_role;
grant execute on function public.expire_loyalty_redemptions() to service_role;
grant execute on function public.redeem_loyalty_reward(uuid,uuid,text,text,timestamptz) to service_role;
grant execute on function public.validate_loyalty_redemption(uuid,text,uuid) to service_role;
commit;
