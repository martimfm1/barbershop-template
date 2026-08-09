-- Silentra for Barbers — atomic Enterprise POS transactions
-- Creates a single database transaction for POS sale + items + inventory decrement.
-- The RPC is callable only by the service role; the application API remains the authorization boundary.

create or replace function public.create_pos_transaction_atomic(
  p_barbershop_id uuid,
  p_location_id uuid,
  p_client_id uuid,
  p_appointment_id uuid,
  p_payment_method text,
  p_discount numeric,
  p_created_by uuid,
  p_items jsonb
)
returns public.pos_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaction public.pos_transactions;
  v_item jsonb;
  v_product public.inventory_products;
  v_service public.services;
  v_product_id uuid;
  v_service_id uuid;
  v_quantity numeric;
  v_unit_price numeric;
  v_expected_price numeric;
  v_description text;
  v_subtotal numeric := 0;
  v_discount numeric := greatest(coalesce(p_discount, 0), 0);
  v_total numeric;
begin
  if p_payment_method not in ('cash', 'card', 'transfer', 'other') then
    raise exception using errcode = '22023', message = 'Invalid payment method';
  end if;

  if p_created_by is null then
    raise exception using errcode = '22023', message = 'Created by is required';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 100 then
    raise exception using errcode = '22023', message = 'At least one POS item is required';
  end if;

  if p_location_id is not null and not exists (
    select 1 from public.locations l
    where l.id = p_location_id and l.parent_barbershop_id = p_barbershop_id
  ) then
    raise exception using errcode = '42501', message = 'Location does not belong to this barbershop';
  end if;

  if p_client_id is not null and not exists (
    select 1 from public.users u
    where u.id = p_client_id and u.barbershop_id = p_barbershop_id
  ) then
    raise exception using errcode = '42501', message = 'Client does not belong to this barbershop';
  end if;

  if p_appointment_id is not null and not exists (
    select 1 from public.appointments a
    where a.id = p_appointment_id and a.barbershop_id = p_barbershop_id
  ) then
    raise exception using errcode = '42501', message = 'Appointment does not belong to this barbershop';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := nullif(v_item->>'productId', '')::uuid;
    v_service_id := nullif(v_item->>'serviceId', '')::uuid;
    v_quantity := (v_item->>'quantity')::numeric;
    v_unit_price := (v_item->>'unitPrice')::numeric;
    v_description := left(trim(coalesce(v_item->>'description', '')), 200);

    if (v_product_id is null and v_service_id is null) or (v_product_id is not null and v_service_id is not null) then
      raise exception using errcode = '22023', message = 'Each POS item must reference exactly one product or service';
    end if;

    if v_quantity is null or v_quantity <= 0 or v_quantity > 100000 then
      raise exception using errcode = '22023', message = 'Invalid item quantity';
    end if;

    if v_unit_price is null or v_unit_price < 0 then
      raise exception using errcode = '22023', message = 'Invalid item price';
    end if;

    if v_description = '' then
      raise exception using errcode = '22023', message = 'Item description is required';
    end if;

    if v_product_id is not null then
      select * into v_product
      from public.inventory_products
      where id = v_product_id and barbershop_id = p_barbershop_id and active = true
      for update;

      if not found then
        raise exception using errcode = '42501', message = 'Product does not belong to this barbershop';
      end if;

      v_expected_price := v_product.unit_price;

      if round(v_unit_price, 2) <> round(v_expected_price, 2) then
        raise exception using errcode = '22023', message = 'Product price changed; refresh the POS';
      end if;

      if v_product.stock_quantity < v_quantity then
        raise exception using errcode = 'P0001', message = format('Insufficient stock for product %s', v_product.name);
      end if;
    else
      select s.* into v_service
      from public.services s
      where s.id = v_service_id and s.barbershop_id = p_barbershop_id;

      if not found then
        raise exception using errcode = '42501', message = 'Service does not belong to this barbershop';
      end if;

      v_expected_price := v_service.price;

      if round(v_unit_price, 2) <> round(v_expected_price, 2) then
        raise exception using errcode = '22023', message = 'Service price changed; refresh the POS';
      end if;
    end if;

    v_subtotal := v_subtotal + round(v_quantity * v_expected_price, 2);
  end loop;

  v_subtotal := round(v_subtotal, 2);
  v_discount := least(v_discount, v_subtotal);
  v_total := round(v_subtotal - v_discount, 2);

  insert into public.pos_transactions (
    barbershop_id, location_id, client_id, appointment_id,
    subtotal, discount, total, payment_method, status, created_by
  ) values (
    p_barbershop_id, p_location_id, p_client_id, p_appointment_id,
    v_subtotal, v_discount, v_total, p_payment_method, 'completed', p_created_by
  ) returning * into v_transaction;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := nullif(v_item->>'productId', '')::uuid;
    v_service_id := nullif(v_item->>'serviceId', '')::uuid;
    v_quantity := (v_item->>'quantity')::numeric;
    v_unit_price := (v_item->>'unitPrice')::numeric;
    v_description := left(trim(coalesce(v_item->>'description', '')), 200);

    insert into public.pos_transaction_items (
      transaction_id, product_id, service_id, description, quantity, unit_price
    ) values (
      v_transaction.id, v_product_id, v_service_id, v_description, v_quantity, v_unit_price
    );

    if v_product_id is not null then
      update public.inventory_products
      set stock_quantity = stock_quantity - v_quantity,
          updated_at = now()
      where id = v_product_id and barbershop_id = p_barbershop_id;

      insert into public.inventory_movements (
        product_id, barbershop_id, quantity, reason, reference_id, created_by
      ) values (
        v_product_id, p_barbershop_id, -v_quantity, 'sale', v_transaction.id, p_created_by
      );
    end if;
  end loop;

  return v_transaction;
end;
$$;

revoke all on function public.create_pos_transaction_atomic(uuid, uuid, uuid, uuid, text, numeric, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.create_pos_transaction_atomic(uuid, uuid, uuid, uuid, text, numeric, uuid, jsonb) to service_role;
