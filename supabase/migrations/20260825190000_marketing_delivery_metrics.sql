begin;

alter table public.marketing_campaigns
  add column if not exists delivered_count integer not null default 0,
  add column if not exists opened_count integer not null default 0,
  add column if not exists clicked_count integer not null default 0;

commit;
