begin;

-- Atomic webhook claim state machine. A short lease prevents concurrent workers
-- from processing the same Stripe event while still allowing recovery after a
-- crashed worker.
alter table public.stripe_webhook_events
  add column if not exists status text not null default 'processed'
    check (status in ('processing', 'processed', 'failed')),
  add column if not exists processing_started_at timestamptz,
  add column if not exists last_error text;

create index if not exists stripe_webhook_events_processing_idx
  on public.stripe_webhook_events(status, processing_started_at);

create or replace function public.claim_stripe_webhook_event(
  p_event_id text,
  p_event_type text,
  p_lease_seconds integer default 300
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.stripe_webhook_events%rowtype;
  v_lease interval := make_interval(secs => greatest(30, least(coalesce(p_lease_seconds, 300), 3600)));
begin
  select *
    into v_row
  from public.stripe_webhook_events
  where event_id = p_event_id
  for update;

  if not found then
    insert into public.stripe_webhook_events(
      event_id,
      event_type,
      status,
      processing_started_at,
      last_error,
      processed_at
    )
    values (
      p_event_id,
      p_event_type,
      'processing',
      now(),
      null,
      now()
    );
    return 'claimed';
  end if;

  if v_row.status = 'processed' then
    return 'processed';
  end if;

  if v_row.status = 'processing'
     and coalesce(v_row.processing_started_at, now()) > now() - v_lease then
    return 'processing';
  end if;

  update public.stripe_webhook_events
  set status = 'processing',
      event_type = p_event_type,
      processing_started_at = now(),
      last_error = null
  where event_id = p_event_id;

  return 'claimed';
end;
$$;

create or replace function public.complete_stripe_webhook_event(p_event_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.stripe_webhook_events
  set status = 'processed',
      processed_at = now(),
      processing_started_at = null,
      last_error = null
  where event_id = p_event_id;
$$;

create or replace function public.fail_stripe_webhook_event(p_event_id text, p_error text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.stripe_webhook_events
  set status = 'failed',
      processed_at = now(),
      processing_started_at = null,
      last_error = left(coalesce(p_error, 'UNKNOWN'), 1000)
  where event_id = p_event_id;
$$;

revoke all on function public.claim_stripe_webhook_event(text, text, integer) from public, anon, authenticated;
revoke all on function public.complete_stripe_webhook_event(text) from public, anon, authenticated;
revoke all on function public.fail_stripe_webhook_event(text, text) from public, anon, authenticated;
grant execute on function public.claim_stripe_webhook_event(text, text, integer) to service_role;
grant execute on function public.complete_stripe_webhook_event(text) to service_role;
grant execute on function public.fail_stripe_webhook_event(text, text) to service_role;

commit;
