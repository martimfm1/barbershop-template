-- Marketplace sales channels and lightweight fulfillment preferences.
-- Silentra handles discovery, catalog, order capture and stock integrity.
-- The barber remains responsible for physical pickup and any shipping.

alter table public.barbershops
  add column if not exists marketplace_sales_mode text not null default 'physical_only';

alter table public.barbershops
  drop constraint if exists barbershops_marketplace_sales_mode_check;

alter table public.barbershops
  add constraint barbershops_marketplace_sales_mode_check
  check (marketplace_sales_mode in ('physical_only', 'physical_and_online'));

alter table public.marketplace_orders
  drop constraint if exists marketplace_orders_fulfillment_method_check;

alter table public.marketplace_orders
  add constraint marketplace_orders_fulfillment_method_check
  check (fulfillment_method in ('pickup', 'delivery'));

alter table public.marketplace_orders
  add column if not exists shipping_address text,
  add column if not exists shipping_city text,
  add column if not exists shipping_postal_code text,
  add column if not exists shipping_country text default 'PT';

create index if not exists barbershops_marketplace_sales_mode_idx
  on public.barbershops(marketplace_sales_mode);

-- Remove the previous service-role-only signature so there is one canonical order RPC.
drop function if exists public.create_marketplace_order_atomic(uuid,text,text,text,text,jsonb);

create or replace function public.create_marketplace_order_atomic(
  p_barbershop_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_notes text,
  p_items jsonb,
  p_fulfillment_method text default 'pickup',
  p_shipping_address text default null,
  p_shipping_city text default null,
  p_shipping_postal_code text default null,
  p_shipping_country text default 'PT'
) returns public.marketplace_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.marketplace_orders;
  v_item jsonb;
  v_product public.inventory_products;
  v_product_id uuid;
  v_quantity numeric;
  v_subtotal numeric(12,2) := 0;
  v_item_total numeric(12,2);
  v_created_by uuid;
  v_sales_mode text;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'At least one product is required';
  end if;

  select marketplace_sales_mode, created_by
    into v_sales_mode, v_created_by
  from public.barbershops
  where id = p_barbershop_id
    and is_public_in_directory is not false;

  if not found then
    raise exception 'Marketplace unavailable';
  end if;

  if v_sales_mode <> 'physical_and_online' then
    raise exception 'Online marketplace sales are disabled for this barbershop';
  end if;

  if p_fulfillment_method not in ('pickup', 'delivery') then
    raise exception 'Invalid fulfillment method';
  end if;

  if p_fulfillment_method = 'delivery' then
    if nullif(trim(coalesce(p_shipping_address, '')), '') is null
      or nullif(trim(coalesce(p_shipping_city, '')), '') is null
      or nullif(trim(coalesce(p_shipping_postal_code, '')), '') is null then
      raise exception 'Shipping address is required';
    end if;
  end if;

  insert into public.marketplace_orders (
    barbershop_id,
    customer_name,
    customer_email,
    customer_phone,
    notes,
    fulfillment_method,
    shipping_address,
    shipping_city,
    shipping_postal_code,
    shipping_country
  ) values (
    p_barbershop_id,
    left(trim(p_customer_name), 160),
    lower(left(trim(p_customer_email), 320)),
    left(trim(p_customer_phone), 40),
    nullif(left(trim(coalesce(p_notes, '')), 1000), ''),
    p_fulfillment_method,
    case when p_fulfillment_method = 'delivery' then nullif(left(trim(coalesce(p_shipping_address, '')), 300), '') else null end,
    case when p_fulfillment_method = 'delivery' then nullif(left(trim(coalesce(p_shipping_city, '')), 120), '') else null end,
    case when p_fulfillment_method = 'delivery' then nullif(left(trim(coalesce(p_shipping_postal_code, '')), 30), '') else null end,
    case when p_fulfillment_method = 'delivery' then left(trim(coalesce(p_shipping_country, 'PT')), 80) else null end
  ) returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_product_id := (v_item->>'productId')::uuid;
    v_quantity := (v_item->>'quantity')::numeric;

    if v_quantity is null or v_quantity <= 0 or v_quantity > 50 then
      raise exception 'Invalid product quantity';
    end if;

    select * into v_product
    from public.inventory_products
    where id = v_product_id
      and barbershop_id = p_barbershop_id
      and active = true
      and marketplace_visible = true
      and stock_quantity >= v_quantity
    for update;

    if not found then
      raise exception 'Product unavailable or insufficient stock';
    end if;

    v_item_total := round(v_product.unit_price * v_quantity, 2);
    v_subtotal := v_subtotal + v_item_total;

    insert into public.marketplace_order_items (
      order_id, product_id, product_name, unit_price, quantity
    ) values (
      v_order.id, v_product.id, v_product.name, v_product.unit_price, v_quantity
    );

    update public.inventory_products
    set stock_quantity = stock_quantity - v_quantity,
        updated_at = now()
    where id = v_product.id;

    if v_created_by is not null then
      insert into public.inventory_movements (
        product_id, barbershop_id, quantity, reason, reference_id, created_by
      ) values (
        v_product.id, p_barbershop_id, -v_quantity, 'sale', v_order.id, v_created_by
      );
    end if;
  end loop;

  update public.marketplace_orders
  set subtotal = v_subtotal,
      total = v_subtotal,
      updated_at = now()
  where id = v_order.id
  returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.create_marketplace_order_atomic(uuid,text,text,text,text,jsonb,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.create_marketplace_order_atomic(uuid,text,text,text,text,jsonb,text,text,text,text,text) to service_role;
