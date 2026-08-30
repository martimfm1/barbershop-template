-- Marketplace catalog + order flow
-- Products remain tenant-owned and reuse inventory_products for POS/marketplace stock.

alter table public.inventory_products
  add column if not exists description text,
  add column if not exists category text,
  add column if not exists image_url text,
  add column if not exists compare_at_price numeric(12,2),
  add column if not exists marketplace_visible boolean not null default false,
  add column if not exists marketplace_featured boolean not null default false;

create index if not exists inventory_products_marketplace_idx
  on public.inventory_products(marketplace_visible, active, category, updated_at desc);

create table if not exists public.marketplace_orders (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  customer_name text not null check (char_length(customer_name) between 2 and 160),
  customer_email text not null check (char_length(customer_email) between 5 and 320),
  customer_phone text not null check (char_length(customer_phone) between 6 and 40),
  notes text,
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  fulfillment_method text not null default 'pickup' check (fulfillment_method = 'pickup'),
  status text not null default 'pending' check (status in ('pending','confirmed','ready','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.marketplace_orders(id) on delete cascade,
  product_id uuid not null references public.inventory_products(id) on delete restrict,
  product_name text not null,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity numeric(12,3) not null check (quantity > 0),
  total numeric(12,2) generated always as (round(unit_price * quantity, 2)) stored
);

create index if not exists marketplace_orders_shop_idx
  on public.marketplace_orders(barbershop_id, status, created_at desc);
create index if not exists marketplace_order_items_order_idx
  on public.marketplace_order_items(order_id);

alter table public.marketplace_orders enable row level security;
alter table public.marketplace_order_items enable row level security;

create policy "marketplace_orders_staff_read" on public.marketplace_orders
  for select to authenticated
  using (barbershop_id = get_my_barbershop_id()::uuid);
create policy "marketplace_order_items_staff_read" on public.marketplace_order_items
  for select to authenticated
  using (exists (
    select 1 from public.marketplace_orders o
    where o.id = order_id
      and o.barbershop_id = get_my_barbershop_id()::uuid
  ));

create or replace function public.create_marketplace_order_atomic(
  p_barbershop_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_notes text,
  p_items jsonb
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
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'At least one product is required';
  end if;

  if not exists (
    select 1 from public.barbershops
    where id = p_barbershop_id
      and is_public_in_directory is not false
  ) then
    raise exception 'Marketplace unavailable';
  end if;

  select created_by into v_created_by
  from public.barbershops
  where id = p_barbershop_id;

  insert into public.marketplace_orders (
    barbershop_id, customer_name, customer_email, customer_phone, notes
  ) values (
    p_barbershop_id,
    left(trim(p_customer_name), 160),
    lower(left(trim(p_customer_email), 320)),
    left(trim(p_customer_phone), 40),
    nullif(left(trim(coalesce(p_notes, '')), 1000), '')
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
  set subtotal = v_subtotal, total = v_subtotal, updated_at = now()
  where id = v_order.id
  returning * into v_order;

  return v_order;
end;
$$;

create or replace function public.cancel_marketplace_order_atomic(
  p_order_id uuid,
  p_barbershop_id uuid
) returns public.marketplace_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.marketplace_orders;
  v_item record;
  v_created_by uuid;
begin
  select * into v_order
  from public.marketplace_orders
  where id = p_order_id and barbershop_id = p_barbershop_id
  for update;

  if not found then raise exception 'Order not found'; end if;
  if v_order.status = 'cancelled' then return v_order; end if;
  if v_order.status = 'completed' then raise exception 'Completed order cannot be cancelled'; end if;

  select created_by into v_created_by from public.barbershops where id = p_barbershop_id;

  for v_item in
    select product_id, quantity from public.marketplace_order_items where order_id = p_order_id
  loop
    update public.inventory_products
    set stock_quantity = stock_quantity + v_item.quantity,
        updated_at = now()
    where id = v_item.product_id and barbershop_id = p_barbershop_id;

    if v_created_by is not null then
      insert into public.inventory_movements (
        product_id, barbershop_id, quantity, reason, reference_id, created_by
      ) values (
        v_item.product_id, p_barbershop_id, v_item.quantity, 'return', p_order_id, v_created_by
      );
    end if;
  end loop;

  update public.marketplace_orders
  set status = 'cancelled', updated_at = now()
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.create_marketplace_order_atomic(uuid,text,text,text,text,jsonb) from public, anon, authenticated;
revoke all on function public.cancel_marketplace_order_atomic(uuid,uuid) from public, anon, authenticated;
grant execute on function public.create_marketplace_order_atomic(uuid,text,text,text,text,jsonb) to service_role;
grant execute on function public.cancel_marketplace_order_atomic(uuid,uuid) to service_role;
