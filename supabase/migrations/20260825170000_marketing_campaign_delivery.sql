begin;

alter table public.marketing_campaigns
  add column if not exists trigger_type text not null default 'manual',
  add column if not exists interval_value integer,
  add column if not exists interval_unit text,
  add column if not exists next_run_at timestamptz,
  add column if not exists last_run_at timestamptz,
  add column if not exists event_name text,
  add column if not exists active boolean not null default true,
  add column if not exists total_recipients integer not null default 0,
  add column if not exists sent_count integer not null default 0,
  add column if not exists failed_count integer not null default 0;

alter table public.marketing_campaign_recipients
  add column if not exists run_key text not null default 'legacy',
  add column if not exists attempts integer not null default 0,
  add column if not exists next_attempt_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists failed_at timestamptz;

alter table public.marketing_campaigns drop constraint if exists marketing_campaigns_trigger_type_check;
alter table public.marketing_campaigns
  add constraint marketing_campaigns_trigger_type_check
  check (trigger_type in ('manual','interval','event'));

alter table public.marketing_campaigns drop constraint if exists marketing_campaigns_interval_value_check;
alter table public.marketing_campaigns
  add constraint marketing_campaigns_interval_value_check
  check (interval_value is null or interval_value between 1 and 3650);

alter table public.marketing_campaigns drop constraint if exists marketing_campaigns_interval_unit_check;
alter table public.marketing_campaigns
  add constraint marketing_campaigns_interval_unit_check
  check (interval_unit is null or interval_unit in ('hours','days'));

alter table public.marketing_campaigns drop constraint if exists marketing_campaigns_trigger_config_check;
alter table public.marketing_campaigns
  add constraint marketing_campaigns_trigger_config_check
  check (
    (trigger_type = 'manual' and interval_value is null and interval_unit is null and event_name is null)
    or (trigger_type = 'interval' and interval_value is not null and interval_unit is not null and event_name is null)
    or (trigger_type = 'event' and event_name is not null and length(trim(event_name)) between 1 and 80 and interval_value is null and interval_unit is null)
  );

create unique index if not exists marketing_campaign_recipient_run_unique_idx
  on public.marketing_campaign_recipients(campaign_id, client_id, run_key);

create index if not exists marketing_campaigns_scheduler_idx
  on public.marketing_campaigns(active, trigger_type, next_run_at)
  where active = true;

create index if not exists marketing_campaign_recipients_retry_idx
  on public.marketing_campaign_recipients(status, next_attempt_at);

commit;
