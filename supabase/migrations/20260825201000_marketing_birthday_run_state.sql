begin;

alter table public.marketing_campaigns
  add column if not exists birthday_last_run_date date;

create index if not exists marketing_campaigns_birthday_run_idx
  on public.marketing_campaigns(barbershop_id, birthday_last_run_date)
  where trigger_type = 'birthday';

commit;
