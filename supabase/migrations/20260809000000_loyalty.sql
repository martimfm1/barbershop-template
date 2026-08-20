create table if not exists public.loyalty_settings (
  barbershop_id uuid primary key references public.barbershops(id) on delete cascade,
  enabled boolean not null default false,
  points_per_euro numeric(10,2) not null default 1 check (points_per_euro > 0 and points_per_euro <= 100),
  welcome_points integer not null default 0 check (welcome_points >= 0 and welcome_points <= 100000),
  referral_points integer not null default 0 check (referral_points >= 0 and referral_points <= 100000),
  updated_at timestamptz not null default now()
);

create table if not exists public.loyalty_rewards (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 120),
  description text,
  points_cost integer not null check (points_cost > 0 and points_cost <= 10000000),
  reward_type text not null default 'discount' check (reward_type in ('discount','free_service','custom')),
  reward_value numeric(10,2),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.loyalty_accounts (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  client_id uuid not null references public.users(id) on delete cascade,
  points_balance integer not null default 0 check (points_balance >= 0),
  lifetime_points integer not null default 0 check (lifetime_points >= 0),
  tier text not null default 'bronze' check (tier in ('bronze','silver','gold')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (barbershop_id, client_id)
);

create table if not exists public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  client_id uuid not null references public.users(id) on delete cascade,
  points integer not null check (points <> 0),
  type text not null check (type in ('booking','welcome','referral','adjustment','redemption')),
  reference_id uuid,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.loyalty_redemptions (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  client_id uuid not null references public.users(id) on delete cascade,
  reward_id uuid not null references public.loyalty_rewards(id) on delete restrict,
  points_spent integer not null check (points_spent > 0),
  status text not null default 'pending' check (status in ('pending','fulfilled','cancelled')),
  created_at timestamptz not null default now(),
  fulfilled_at timestamptz
);

create index if not exists loyalty_accounts_client_idx on public.loyalty_accounts (barbershop_id, client_id);
create index if not exists loyalty_transactions_client_idx on public.loyalty_transactions (barbershop_id, client_id, created_at desc);
create index if not exists loyalty_rewards_shop_idx on public.loyalty_rewards (barbershop_id, active);

alter table public.loyalty_settings enable row level security;
alter table public.loyalty_rewards enable row level security;
alter table public.loyalty_accounts enable row level security;
alter table public.loyalty_transactions enable row level security;
alter table public.loyalty_redemptions enable row level security;

create policy loyalty_settings_owner_read on public.loyalty_settings for select to authenticated using (barbershop_id = get_my_barbershop_id()::uuid);
create policy loyalty_rewards_owner_read on public.loyalty_rewards for select to authenticated using (barbershop_id = get_my_barbershop_id()::uuid);
create policy loyalty_accounts_owner_read on public.loyalty_accounts for select to authenticated using (barbershop_id = get_my_barbershop_id()::uuid);
create policy loyalty_transactions_owner_read on public.loyalty_transactions for select to authenticated using (barbershop_id = get_my_barbershop_id()::uuid);
create policy loyalty_redemptions_owner_read on public.loyalty_redemptions for select to authenticated using (barbershop_id = get_my_barbershop_id()::uuid);

revoke insert, update, delete on public.loyalty_settings from authenticated;
revoke insert, update, delete on public.loyalty_rewards from authenticated;
revoke insert, update, delete on public.loyalty_accounts from authenticated;
revoke insert, update, delete on public.loyalty_transactions from authenticated;
revoke insert, update, delete on public.loyalty_redemptions from authenticated;
