begin;

-- Idempotent repair migration for environments where marketing automation
-- migrations were created but not fully applied in the target database.
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
  add column if not exists failed_count integer not null default 0,
  add column if not exists birthday_offset_days smallint not null default 0,
  add column if not exists birthday_reward_type text not null default 'none',
  add column if not exists birthday_reward_service_id uuid;

alter table public.marketing_campaigns
  drop constraint if exists marketing_campaigns_interval_value_repair_check,
  drop constraint if exists marketing_campaigns_interval_unit_repair_check,
  drop constraint if exists marketing_campaigns_trigger_type_repair_check,
  drop constraint if exists marketing_campaigns_birthday_offset_repair_check,
  drop constraint if exists marketing_campaigns_birthday_reward_type_repair_check;

alter table public.marketing_campaigns
  add constraint marketing_campaigns_interval_value_repair_check
  check (interval_value is null or interval_value between 1 and 3650),
  add constraint marketing_campaigns_interval_unit_repair_check
  check (interval_unit is null or interval_unit in ('hours', 'days')),
  add constraint marketing_campaigns_trigger_type_repair_check
  check (trigger_type in ('manual', 'interval', 'event', 'birthday')),
  add constraint marketing_campaigns_birthday_offset_repair_check
  check (birthday_offset_days between -365 and 365),
  add constraint marketing_campaigns_birthday_reward_type_repair_check
  check (birthday_reward_type in ('none', 'free_service'));

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'marketing_campaigns_birthday_reward_service_fkey'
      and conrelid = 'public.marketing_campaigns'::regclass
  ) then
    alter table public.marketing_campaigns
      add constraint marketing_campaigns_birthday_reward_service_fkey
      foreign key (birthday_reward_service_id)
      references public.services(id)
      on delete set null;
  end if;
end $$;

create index if not exists marketing_campaigns_automation_idx
  on public.marketing_campaigns(barbershop_id, active, trigger_type, status, next_run_at);

create index if not exists marketing_campaigns_birthday_repair_idx
  on public.marketing_campaigns(barbershop_id, birthday_offset_days, active)
  where trigger_type = 'birthday' and active = true;

commit;
