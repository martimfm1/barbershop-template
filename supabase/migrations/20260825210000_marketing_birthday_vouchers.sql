begin;

alter table public.marketing_campaigns
  add column if not exists birthday_last_run_date date,
  add column if not exists birthday_reward_type text not null default 'none',
  add column if not exists birthday_reward_service_id uuid references public.services(id) on delete set null;

alter table public.marketing_campaigns
  drop constraint if exists marketing_campaigns_birthday_reward_type_check;
alter table public.marketing_campaigns
  add constraint marketing_campaigns_birthday_reward_type_check
  check (birthday_reward_type in ('none','free_service'));

create table if not exists public.marketing_campaign_vouchers (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.marketing_campaigns(id) on delete cascade,
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  client_id uuid not null references public.users(id) on delete cascade,
  service_id uuid references public.services(id) on delete restrict,
  code text not null unique,
  reward_type text not null check (reward_type in ('free_service')),
  status text not null default 'issued' check (status in ('issued','redeemed','expired','cancelled')),
  birthday_date date not null,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  redeemed_by uuid references public.users(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, client_id, birthday_date),
  constraint marketing_birthday_voucher_service_check
    check (reward_type <> 'free_service' or service_id is not null)
);

alter table public.marketing_campaign_recipients
  add column if not exists voucher_id uuid;

alter table public.marketing_campaign_recipients
  drop constraint if exists marketing_campaign_recipients_voucher_fk;
alter table public.marketing_campaign_recipients
  add constraint marketing_campaign_recipients_voucher_fk
  foreign key (voucher_id) references public.marketing_campaign_vouchers(id) on delete set null;

create index if not exists marketing_campaign_vouchers_client_idx
  on public.marketing_campaign_vouchers(barbershop_id, client_id, status, expires_at);
create index if not exists marketing_campaign_vouchers_campaign_idx
  on public.marketing_campaign_vouchers(campaign_id, birthday_date);
create index if not exists marketing_campaign_recipients_voucher_idx
  on public.marketing_campaign_recipients(voucher_id)
  where voucher_id is not null;

alter table public.marketing_campaign_vouchers enable row level security;
revoke all on public.marketing_campaign_vouchers from anon, authenticated;

alter table public.marketing_campaigns
  drop constraint if exists marketing_campaigns_trigger_config_check;

alter table public.marketing_campaigns
  add constraint marketing_campaigns_trigger_config_check
  check (
    (trigger_type = 'manual'
      and interval_value is null and interval_unit is null and event_name is null)
    or
    (trigger_type = 'interval'
      and interval_value is not null and interval_unit is not null and event_name is null)
    or
    (trigger_type = 'event'
      and event_name is not null and length(trim(event_name)) between 1 and 80
      and interval_value is null and interval_unit is null)
    or
    (trigger_type = 'birthday'
      and interval_value is null and interval_unit is null and event_name is null
      and birthday_offset_days between -365 and 365
      and birthday_reward_type in ('none','free_service')
      and (birthday_reward_type = 'none' or birthday_reward_service_id is not null))
  );

insert into public.marketing_campaigns (
  barbershop_id, created_by, name, channel, subject, body, segment,
  status, trigger_type, birthday_offset_days, birthday_reward_type, active
)
select
  a.barbershop_id, b.created_by, 'Aniversários', 'email', a.subject, a.body, '{}'::jsonb,
  'scheduled', 'birthday', 0, 'none', a.enabled
from public.birthday_email_automations a
join public.barbershops b on b.id = a.barbershop_id
where a.enabled = true
  and not exists (
    select 1 from public.marketing_campaigns c
    where c.barbershop_id = a.barbershop_id
      and c.trigger_type = 'birthday'
      and c.name = 'Aniversários'
  );

commit;
