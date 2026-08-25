begin;

alter table public.marketing_campaigns
  add column if not exists birthday_offset_days smallint not null default 0;

alter table public.marketing_campaigns
  drop constraint if exists marketing_campaigns_trigger_type_check;

alter table public.marketing_campaigns
  add constraint marketing_campaigns_trigger_type_check
  check (trigger_type in ('manual','interval','event','birthday'));

alter table public.marketing_campaigns
  drop constraint if exists marketing_campaigns_trigger_config_check;

alter table public.marketing_campaigns
  add constraint marketing_campaigns_trigger_config_check
  check (
    (trigger_type = 'manual'
      and interval_value is null
      and interval_unit is null
      and event_name is null)
    or
    (trigger_type = 'interval'
      and interval_value is not null
      and interval_unit is not null
      and event_name is null)
    or
    (trigger_type = 'event'
      and event_name is not null
      and length(trim(event_name)) between 1 and 80
      and interval_value is null
      and interval_unit is null)
    or
    (trigger_type = 'birthday'
      and interval_value is null
      and interval_unit is null
      and event_name is null
      and birthday_offset_days between -365 and 365)
  );

create index if not exists marketing_campaigns_birthday_idx
  on public.marketing_campaigns(barbershop_id, birthday_offset_days, active)
  where trigger_type = 'birthday' and active = true;

comment on column public.marketing_campaigns.birthday_offset_days is
  'Days relative to the client birthday. 0 = birthday day, -1 = day before, 1 = day after.';

commit;
