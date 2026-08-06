-- Apply through the Supabase migration pipeline before deploying the refactored billing routes.
-- Stripe is the source of truth; these tables are a read model and customer mapping only.

create table if not exists public.customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text not null unique,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  stripe_customer_id text not null references public.customers(stripe_customer_id),
  stripe_subscription_id text unique,
  stripe_price_id text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'enterprise')),
  status text not null,
  trial_end timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_active_user_idx
  on public.subscriptions (user_id)
  where status in ('active', 'trialing', 'past_due');

create index if not exists subscriptions_customer_idx on public.subscriptions (stripe_customer_id);

-- The browser never writes billing state. Service-role routes and webhook handlers bypass RLS.
alter table public.customers enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "Users can read their billing customer" on public.customers;
create policy "Users can read their billing customer"
  on public.customers for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their subscription" on public.subscriptions;
create policy "Users can read their subscription"
  on public.subscriptions for select to authenticated using ((select auth.uid()) = user_id);
