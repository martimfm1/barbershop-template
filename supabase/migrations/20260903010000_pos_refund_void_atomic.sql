-- Silentra for Barbers — atomic POS refunds / voids
-- Restores inventory and changes transaction state in one PostgreSQL transaction.
-- Callable only by service_role; authorization stays in the application API.

create or replace function public.refund_pos_transaction_atomic(
  p_transaction_id uuid,
  p_barbershop_id uuid,
  p_user_id uuid,
  p_mode text default 'refund'
)
returns public.pos_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaction public.pos_transactions;
  v_item record;
  v_product public.inventory_products;
  v_target_status text;
begin
  if p_transaction_id is null or p_barbershop_id is null or p_user_id is null then
    raise exception using errcode = '22023', message = 'Transaction, barbershop and user are required';
  end if;

  if p_mode not in ('refund', 'void') then
    raise exception using errcode = '22023', message = 'Invalid POS reversal mode';
  end if;

  select * into v_transaction
  from public.pos_transactions
  where id = p_transaction_id
    and barbershop_id = p_barbershop_id
  for update;

  if not found then
    raise exception using errcode = '42501', message = 'Transaction does not belong to this barbershop';
  end if;

  if v_transaction.status <> 'completed' then
    raise exception using errcode = '40901', message = 'Only completed transactions can be refunded or voided';
  end if;

  for v_item in
    select i.*
    from public.pos_transaction_items i
    where i.transaction_id = v_transaction.id
      and i.product_id is not null
    order by i.product_id
  loop
    select * into v_product
    from public.inventory_products
    where id = v_item.product_id
      and barbershop_id = p_barbershop_id
    for update;

    if not found then
      raise exception using errcode = '42501', message = 'POS product does not belong to this barbershop';
    end if;

    update public.inventory_products
    set stock_quantity = stock_quantity + v_item.quantity,
        updated_at = now()
    where id = v_item.product_id
      and barbershop_id = p_barbershop_id;

    insert into public.inventory_movements (
      product_id, barbershop_id, quantity, reason, reference_id, created_by
    ) values (
      v_item.product_id, p_barbershop_id, v_item.quantity, 'return', v_transaction.id, p_user_id
    );
  end loop;

  v_target_status := case when p_mode = 'void' then 'void' else 'refunded' end;

  update public.pos_transactions
  set status = v_target_status
  where id = v_transaction.id
  returning * into v_transaction;

  return v_transaction;
end;
$$;

revoke all on function public.refund_pos_transaction_atomic(uuid, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.refund_pos_transaction_atomic(uuid, uuid, uuid, text) to service_role;
