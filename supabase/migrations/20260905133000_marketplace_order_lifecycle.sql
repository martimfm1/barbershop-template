begin;

-- Expand the existing marketplace lifecycle without replacing existing rows.
alter table public.marketplace_orders
  drop constraint if exists marketplace_orders_status_check;

alter table public.marketplace_orders
  add constraint marketplace_orders_status_check
  check (
    status in (
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'shipped',
      'delivered',
      'completed',
      'cancelled'
    )
  );

create index if not exists marketplace_orders_lifecycle_idx
  on public.marketplace_orders(barbershop_id, status, updated_at desc);

create table if not exists public.marketplace_order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.marketplace_orders(id) on delete cascade,
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  previous_status text,
  new_status text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  source text not null default 'dashboard',
  customer_message text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  constraint marketplace_order_events_status_check
    check (
      new_status in (
        'pending',
        'confirmed',
        'preparing',
        'ready',
        'shipped',
        'delivered',
        'completed',
        'cancelled'
      )
    )
);

create index if not exists marketplace_order_events_order_idx
  on public.marketplace_order_events(order_id, created_at desc);

alter table public.marketplace_order_events enable row level security;

create policy "marketplace_order_events_staff_read"
  on public.marketplace_order_events
  for select to authenticated
  using (barbershop_id = get_my_barbershop_id()::uuid);

create or replace function public.marketplace_order_status_customer_message(p_status text)
returns text
language sql
immutable
as $$
  select case p_status
    when 'pending' then 'Recebemos a tua encomenda.'
    when 'confirmed' then 'A tua encomenda foi confirmada.'
    when 'preparing' then 'A tua encomenda está a ser preparada.'
    when 'ready' then 'A tua encomenda está pronta.'
    when 'shipped' then 'A tua encomenda foi enviada.'
    when 'delivered' then 'A tua encomenda foi entregue.'
    when 'completed' then 'A tua encomenda foi concluída.'
    when 'cancelled' then 'A tua encomenda foi cancelada.'
    else null
  end;
$$;

create or replace function public.record_marketplace_order_status_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source text := coalesce(nullif(current_setting('app.marketplace_event_source', true), ''), 'dashboard');
  v_actor uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    insert into public.marketplace_order_events (
      order_id,
      barbershop_id,
      previous_status,
      new_status,
      actor_user_id,
      source,
      customer_message
    ) values (
      new.id,
      new.barbershop_id,
      null,
      new.status,
      v_actor,
      v_source,
      public.marketplace_order_status_customer_message(new.status)
    );
    return new;
  end if;

  if old.status is distinct from new.status then
    insert into public.marketplace_order_events (
      order_id,
      barbershop_id,
      previous_status,
      new_status,
      actor_user_id,
      source,
      customer_message
    ) values (
      new.id,
      new.barbershop_id,
      old.status,
      new.status,
      v_actor,
      v_source,
      public.marketplace_order_status_customer_message(new.status)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_record_marketplace_order_status_event on public.marketplace_orders;
create trigger trg_record_marketplace_order_status_event
after insert or update of status on public.marketplace_orders
for each row execute function public.record_marketplace_order_status_event();

-- Seed history for existing orders without fabricating a detailed timeline.
insert into public.marketplace_order_events (
  order_id,
  barbershop_id,
  previous_status,
  new_status,
  source,
  customer_message,
  created_at
)
select
  o.id,
  o.barbershop_id,
  null,
  o.status,
  'migration',
  public.marketplace_order_status_customer_message(o.status),
  o.created_at
from public.marketplace_orders o
where not exists (
  select 1
  from public.marketplace_order_events e
  where e.order_id = o.id
);

create or replace function public.update_marketplace_order_status_atomic(
  p_order_id uuid,
  p_barbershop_id uuid,
  p_next_status text
) returns public.marketplace_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.marketplace_orders;
  v_current text;
  v_allowed boolean := false;
begin
  if p_next_status not in (
    'pending', 'confirmed', 'preparing', 'ready',
    'shipped', 'delivered', 'completed', 'cancelled'
  ) then
    raise exception 'invalid_order_status' using errcode = '22023';
  end if;

  select * into v_order
  from public.marketplace_orders
  where id = p_order_id
    and barbershop_id = p_barbershop_id
  for update;

  if not found then
    raise exception 'order_not_found' using errcode = 'P0002';
  end if;

  v_current := v_order.status;

  if v_current = p_next_status then
    return v_order;
  end if;

  v_allowed :=
    case v_current
      when 'pending' then p_next_status in ('confirmed', 'cancelled')
      when 'confirmed' then p_next_status in ('preparing', 'ready', 'cancelled')
      when 'preparing' then p_next_status in ('ready', 'cancelled')
      when 'ready' then p_next_status in ('shipped', 'completed', 'cancelled')
      when 'shipped' then p_next_status in ('delivered')
      when 'delivered' then p_next_status in ('completed')
      when 'completed' then false
      when 'cancelled' then false
      else false
    end;

  if not v_allowed then
    raise exception 'invalid_order_transition' using errcode = 'P0001';
  end if;

  perform set_config('app.marketplace_event_source', 'dashboard', true);

  update public.marketplace_orders
  set status = p_next_status,
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.update_marketplace_order_status_atomic(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.update_marketplace_order_status_atomic(uuid,uuid,text) to service_role;

comment on table public.marketplace_order_events is
  'Durable marketplace order status history used by order timelines and notification/email workflows.';

commit;
