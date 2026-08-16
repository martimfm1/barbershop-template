-- Canonical Stripe billing identity is the SaaS tenant (barbershop), not an individual member.
-- Existing user-level customer/subscription records remain for backwards compatibility.

create table if not exists public.barbershop_billing_accounts (
  barbershop_id uuid primary key references public.barbershops(id) on delete cascade,
  billing_owner_user_id uuid references auth.users(id) on delete set null,
  stripe_customer_id text not null unique,
  billing_email text,
  trial_started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists barbershop_billing_accounts_owner_idx
  on public.barbershop_billing_accounts (billing_owner_user_id);

alter table public.subscriptions
  add column if not exists barbershop_id uuid references public.barbershops(id) on delete cascade;

update public.subscriptions s
set barbershop_id = u.barbershop_id
from public.users u
where s.user_id = u.id
  and s.barbershop_id is null
  and u.barbershop_id is not null;

-- Migrate the best-known legacy Stripe customer for each tenant.
insert into public.barbershop_billing_accounts (
  barbershop_id,
  billing_owner_user_id,
  stripe_customer_id,
  billing_email
)
select distinct on (u.barbershop_id)
  u.barbershop_id,
  u.id,
  c.stripe_customer_id,
  c.email
from public.users u
join public.customers c on c.user_id = u.id
where u.barbershop_id is not null
order by
  u.barbershop_id,
  case when lower(coalesce(u.role, '')) = 'owner' then 0 else 1 end,
  c.updated_at desc
on conflict (barbershop_id) do nothing;

create index if not exists subscriptions_barbershop_idx
  on public.subscriptions (barbershop_id);

-- Keep one active/trialing subscription per tenant. Historical canceled rows may coexist.
create unique index if not exists subscriptions_one_live_per_barbershop_idx
  on public.subscriptions (barbershop_id)
  where barbershop_id is not null
    and stripe_subscription_id is not null
    and status in ('active', 'trialing', 'past_due', 'incomplete', 'unpaid');

alter table public.barbershop_billing_accounts enable row level security;

drop policy if exists "Users can read their barbershop billing account" on public.barbershop_billing_accounts;
create policy "Users can read their barbershop billing account"
  on public.barbershop_billing_accounts
  for select to authenticated
  using (
    exists (
      select 1
      from public.users u
      where u.id = (select auth.uid())
        and u.barbershop_id = barbershop_billing_accounts.barbershop_id
    )
  );

create or replace function public.touch_barbershop_billing_accounts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_barbershop_billing_accounts_updated_at on public.barbershop_billing_accounts;
create trigger trg_barbershop_billing_accounts_updated_at
before update on public.barbershop_billing_accounts
for each row execute function public.touch_barbershop_billing_accounts_updated_at();
