begin;

create table if not exists public.loyalty_members (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  email text not null,
  name text,
  points_balance integer not null default 0 check (points_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (barbershop_id, email)
);

create index if not exists loyalty_members_barbershop_idx
  on public.loyalty_members (barbershop_id, lower(email));

create table if not exists public.loyalty_rewards (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  name text not null,
  description text,
  points_required integer not null check (points_required > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists loyalty_rewards_barbershop_idx
  on public.loyalty_rewards (barbershop_id, active);

create table if not exists public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  member_id uuid not null references public.loyalty_members(id) on delete cascade,
  points integer not null,
  type text not null check (type in ('earned', 'redeemed', 'adjustment')),
  description text,
  appointment_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists loyalty_transactions_member_idx
  on public.loyalty_transactions (member_id, created_at desc);

create table if not exists public.loyalty_verifications (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0 check (attempts >= 0 and attempts <= 8),
  requested_at timestamptz not null default now(),
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists loyalty_verifications_lookup_idx
  on public.loyalty_verifications (barbershop_id, lower(email), requested_at desc);

create table if not exists public.loyalty_sessions (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists loyalty_sessions_lookup_idx
  on public.loyalty_sessions (barbershop_id, lower(email), expires_at desc);

alter table public.loyalty_members enable row level security;
alter table public.loyalty_rewards enable row level security;
alter table public.loyalty_transactions enable row level security;
alter table public.loyalty_verifications enable row level security;
alter table public.loyalty_sessions enable row level security;

revoke all on public.loyalty_members from public, anon, authenticated;
revoke all on public.loyalty_rewards from public, anon, authenticated;
revoke all on public.loyalty_transactions from public, anon, authenticated;
revoke all on public.loyalty_verifications from public, anon, authenticated;
revoke all on public.loyalty_sessions from public, anon, authenticated;

commit;
