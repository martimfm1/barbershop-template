-- Stripe webhook deduplication ledger.
-- Service-role only: no client should be able to read or mutate this table.
create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;

revoke all on table public.stripe_webhook_events from anon, authenticated;

grant all on table public.stripe_webhook_events to service_role;

create index if not exists stripe_webhook_events_processed_at_idx
  on public.stripe_webhook_events(processed_at desc);
