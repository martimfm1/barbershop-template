begin;

alter table public.marketing_campaign_recipients
  add column if not exists provider_status text,
  add column if not exists provider_event_at timestamptz,
  add column if not exists opened_at timestamptz,
  add column if not exists clicked_at timestamptz,
  add column if not exists unsubscribed_at timestamptz;

create table if not exists public.marketing_delivery_events (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references public.marketing_campaign_recipients(id) on delete cascade,
  campaign_id uuid references public.marketing_campaigns(id) on delete cascade,
  provider_message_id text,
  provider text not null default 'brevo',
  channel text not null check (channel in ('email','sms')),
  event_type text not null,
  occurred_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (provider, channel, provider_message_id, event_type, occurred_at)
);

create index if not exists marketing_delivery_events_recipient_idx
  on public.marketing_delivery_events(recipient_id, created_at desc);

create index if not exists marketing_delivery_events_message_idx
  on public.marketing_delivery_events(provider_message_id, created_at desc);

create index if not exists marketing_recipients_provider_message_idx
  on public.marketing_campaign_recipients(provider_message_id)
  where provider_message_id is not null;

alter table public.marketing_delivery_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'marketing_delivery_events'
      and policyname = 'marketing_delivery_events_staff_read'
  ) then
    create policy "marketing_delivery_events_staff_read"
      on public.marketing_delivery_events
      for select to authenticated
      using (exists (
        select 1
        from public.marketing_campaigns c
        where c.id = campaign_id
          and c.barbershop_id = get_my_barbershop_id()::uuid
      ));
  end if;
end $$;

commit;
