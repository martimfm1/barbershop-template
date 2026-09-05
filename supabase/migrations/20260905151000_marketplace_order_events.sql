begin;

create table if not exists public.marketplace_order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.marketplace_orders(id) on delete cascade,
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  event_type text not null default 'status_changed',
  previous_status text,
  new_status text,
  message text,
  actor_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint marketplace_order_events_type_check
    check (event_type in ('created', 'status_changed', 'note', 'email_sent'))
);

create index if not exists marketplace_order_events_order_idx
  on public.marketplace_order_events(order_id, created_at desc);
create index if not exists marketplace_order_events_shop_idx
  on public.marketplace_order_events(barbershop_id, created_at desc);

alter table public.marketplace_order_events enable row level security;

create policy "marketplace_order_events_staff_read"
on public.marketplace_order_events
for select to authenticated
using (barbershop_id = get_my_barbershop_id()::uuid);

create or replace function public.marketplace_order_status_message(p_status text)
returns text
language sql
immutable
as $$
  select case p_status
    when 'pending' then 'Recebemos a encomenda.'
    when 'confirmed' then 'A encomenda foi confirmada.'
    when 'ready' then 'A encomenda está pronta para levantamento.'
    when 'completed' then 'A encomenda foi concluída.'
    when 'cancelled' then 'A encomenda foi cancelada.'
    else 'A encomenda foi atualizada.'
  end;
$$;

create or replace function public.log_marketplace_order_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_message text;
begin
  if tg_op = 'INSERT' then
    v_message := marketplace_order_status_message(new.status);
    insert into public.marketplace_order_events (
      order_id,
      barbershop_id,
      event_type,
      previous_status,
      new_status,
      message,
      actor_user_id
    ) values (
      new.id,
      new.barbershop_id,
      'created',
      null,
      new.status,
      v_message,
      v_actor
    );
    return new;
  end if;

  if old.status is distinct from new.status then
    v_message := marketplace_order_status_message(new.status);
    insert into public.marketplace_order_events (
      order_id,
      barbershop_id,
      event_type,
      previous_status,
      new_status,
      message,
      actor_user_id
    ) values (
      new.id,
      new.barbershop_id,
      'status_changed',
      old.status,
      new.status,
      v_message,
      v_actor
    );
  end if;

  return new;
end;
$$;

drop trigger if exists marketplace_orders_event_trigger on public.marketplace_orders;
create trigger marketplace_orders_event_trigger
after insert or update of status on public.marketplace_orders
for each row
execute function public.log_marketplace_order_event();

revoke all on function public.marketplace_order_status_message(text) from public, anon, authenticated;
revoke all on function public.log_marketplace_order_event() from public, anon, authenticated;

grant execute on function public.marketplace_order_status_message(text) to service_role;
grant execute on function public.log_marketplace_order_event() to service_role;

commit;
