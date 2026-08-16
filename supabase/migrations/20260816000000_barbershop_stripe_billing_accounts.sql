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
-- Prefer the customer already attached to a subscription, then the owner's legacy customer.
insert into public.barbershop_billing_accounts (
  barbershop_id,
  billing_owner_user_id,
  stripe_customer_id,
  billing_email
)
select distinct on (u.barbershop_id)
  u.barbershop_id,
  first_value(case when s.stripe_customer_id is not null then u.id else u.id end) over (partition by u.barbershop_id order by case when s.stripe_subscription_id is not null then 0 else 1 end, case when lower(coalesce(u.role, '')) = 'owner' then 0 else 1 end, s.updated_at desc nulls last, c.updated_at desc nulls last),
  coalesce(s.stripe_customer_id, c.stripe_customer_id),
  coalesce(c.email, (select au.email from auth.users au where au.id = u.id))
from public.users u
left join public.subscriptions s on s.user_id = u.id
left join public.customers c on c.user_id = u.id
where u.barbershop_id is not null
  and coalesce(s.stripe_customer_id, c.stripe_customer_id) is not null
order by
  u.barbershop_id,
  case when s.stripe_subscription_id is not null then 0 else 1 end,
  case when lower(coalesce(u.role, '')) = 'owner' then 0 else 1 end,
  s.updated_at desc nulls last,
  c.updated_at desc nulls last
on conflict (barbershop_id) do nothing;

-- A tenant has exactly one canonical subscription record. Historical invoice history
-- remains in Stripe, while the local table acts as a current-state read model.
with ranked as (
  select
    id,
    row_number() over (
      partition by barbershop_id
      order by updated_at desc, created_at desc, id desc
    ) as rn
  from public.subscriptions
  where barbershop_id is not null
)
delete from public.subscriptions s
using ranked r
where s.id = r.id
  and r.rn > 1;

create unique index if not exists subscriptions_one_per_barbershop_idx
  on public.subscriptions (barbershop_id);

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
