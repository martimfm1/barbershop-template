begin;

-- Allow delivery recipients to retain a cancellation state after a campaign is cancelled.
alter table public.marketing_campaign_recipients
  drop constraint if exists marketing_campaign_recipients_status_check;

alter table public.marketing_campaign_recipients
  add constraint marketing_campaign_recipients_status_check
  check (status in ('queued','sending','sent','delivered','failed','skipped','cancelled'));

create index if not exists marketing_campaign_recipients_cancelled_idx
  on public.marketing_campaign_recipients(campaign_id, status)
  where status = 'cancelled';

commit;
