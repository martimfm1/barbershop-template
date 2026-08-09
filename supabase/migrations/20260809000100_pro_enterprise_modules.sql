-- Silentra for Barbers — Pro / Enterprise module foundation
-- All tenant-owned records are scoped by barbershop_id and protected by RLS.

create table if not exists public.customer_tags (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  color text,
  created_at timestamptz not null default now(),
  unique (barbershop_id, name)
);

create table if not exists public.customer_tag_assignments (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  client_id uuid not null references public.users(id) on delete cascade,
  tag_id uuid not null references public.customer_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (client_id, tag_id)
);

create table if not exists public.customer_segments (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  name text not null check (char_length(name) between 1 and 120),
  description text,
  rules jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  name text not null check (char_length(name) between 1 and 120),
  trigger_type text not null check (trigger_type in ('booking_created','booking_completed','booking_cancelled','client_inactive','birthday')),
  conditions jsonb not null default '{}'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.automation_rules(id) on delete cascade,
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  entity_id uuid,
  status text not null default 'queued' check (status in ('queued','running','completed','failed','skipped')),
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  parent_barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  slug text not null,
  phone text,
  address text,
  opening_time time,
  closing_time time,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (parent_barbershop_id, slug)
);

create table if not exists public.location_members (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'staff' check (role in ('owner','manager','staff')),
  created_at timestamptz not null default now(),
  unique (location_id, user_id)
);

create table if not exists public.staff_permissions (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  permission text not null check (permission in ('appointments','clients','services','analytics','marketing','loyalty','inventory','pos','commissions','billing','team')),
  allowed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, permission)
);

create table if not exists public.inventory_products (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  sku text,
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  stock_quantity numeric(12,3) not null default 0 check (stock_quantity >= 0),
  low_stock_threshold numeric(12,3) not null default 0 check (low_stock_threshold >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.inventory_products(id) on delete cascade,
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  quantity numeric(12,3) not null check (quantity <> 0),
  reason text not null check (reason in ('purchase','sale','adjustment','return','waste')),
  reference_id uuid,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.commissions (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  professional_id uuid not null references public.professionals(id) on delete restrict,
  appointment_id uuid references public.appointments(id) on delete set null,
  gross_amount numeric(12,2) not null check (gross_amount >= 0),
  commission_percentage numeric(5,2) not null check (commission_percentage between 0 and 100),
  commission_amount numeric(12,2) generated always as (round(gross_amount * commission_percentage / 100, 2)) stored,
  status text not null default 'pending' check (status in ('pending','approved','paid','void')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pos_transactions (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  client_id uuid references public.users(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  payment_method text not null check (payment_method in ('cash','card','transfer','other')),
  status text not null default 'completed' check (status in ('completed','refunded','void')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.pos_transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.pos_transactions(id) on delete cascade,
  product_id uuid references public.inventory_products(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  description text not null,
  quantity numeric(12,3) not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  total numeric(12,2) generated always as (round(quantity * unit_price, 2)) stored
);

create table if not exists public.advanced_report_configs (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  name text not null check (char_length(name) between 1 and 120),
  report_type text not null check (report_type in ('revenue','appointments','clients','services','professionals','inventory','commissions')),
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_tags_tenant_idx on public.customer_tags(barbershop_id);
create index if not exists customer_tag_assignments_client_idx on public.customer_tag_assignments(barbershop_id, client_id);
create index if not exists customer_segments_tenant_idx on public.customer_segments(barbershop_id, created_at desc);
create index if not exists automation_rules_tenant_idx on public.automation_rules(barbershop_id, active);
create index if not exists automation_runs_rule_idx on public.automation_runs(rule_id, status);
create index if not exists locations_parent_idx on public.locations(parent_barbershop_id);
create index if not exists location_members_user_idx on public.location_members(user_id);
create index if not exists staff_permissions_tenant_user_idx on public.staff_permissions(barbershop_id, user_id);
create index if not exists inventory_products_tenant_idx on public.inventory_products(barbershop_id, location_id);
create index if not exists inventory_movements_product_idx on public.inventory_movements(product_id, created_at desc);
create index if not exists commissions_tenant_idx on public.commissions(barbershop_id, status, created_at desc);
create index if not exists pos_transactions_tenant_idx on public.pos_transactions(barbershop_id, created_at desc);
create index if not exists pos_transaction_items_transaction_idx on public.pos_transaction_items(transaction_id);
create index if not exists advanced_report_configs_tenant_idx on public.advanced_report_configs(barbershop_id);

alter table public.customer_tags enable row level security;
alter table public.customer_tag_assignments enable row level security;
alter table public.customer_segments enable row level security;
alter table public.automation_rules enable row level security;
alter table public.automation_runs enable row level security;
alter table public.locations enable row level security;
alter table public.location_members enable row level security;
alter table public.staff_permissions enable row level security;
alter table public.inventory_products enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.commissions enable row level security;
alter table public.pos_transactions enable row level security;
alter table public.pos_transaction_items enable row level security;
alter table public.advanced_report_configs enable row level security;

-- Staff can read/write tenant configuration through authenticated server/UI flows.
-- Sensitive mutations such as inventory movements and POS creation remain server-guarded by plan + role.
create policy "customer_tags_staff_all" on public.customer_tags for all to authenticated
  using (barbershop_id = get_my_barbershop_id()::uuid)
  with check (barbershop_id = get_my_barbershop_id()::uuid);
create policy "customer_tag_assignments_staff_all" on public.customer_tag_assignments for all to authenticated
  using (barbershop_id = get_my_barbershop_id()::uuid)
  with check (barbershop_id = get_my_barbershop_id()::uuid);
create policy "customer_segments_staff_all" on public.customer_segments for all to authenticated
  using (barbershop_id = get_my_barbershop_id()::uuid)
  with check (barbershop_id = get_my_barbershop_id()::uuid and created_by = auth.uid());
create policy "automation_rules_staff_all" on public.automation_rules for all to authenticated
  using (barbershop_id = get_my_barbershop_id()::uuid)
  with check (barbershop_id = get_my_barbershop_id()::uuid and created_by = auth.uid());
create policy "automation_runs_staff_read" on public.automation_runs for select to authenticated
  using (barbershop_id = get_my_barbershop_id()::uuid);
create policy "locations_staff_all" on public.locations for all to authenticated
  using (parent_barbershop_id = get_my_barbershop_id()::uuid)
  with check (parent_barbershop_id = get_my_barbershop_id()::uuid);
create policy "location_members_staff_all" on public.location_members for all to authenticated
  using (exists (select 1 from public.locations l where l.id = location_id and l.parent_barbershop_id = get_my_barbershop_id()::uuid))
  with check (exists (select 1 from public.locations l where l.id = location_id and l.parent_barbershop_id = get_my_barbershop_id()::uuid));
create policy "staff_permissions_staff_all" on public.staff_permissions for all to authenticated
  using (barbershop_id = get_my_barbershop_id()::uuid)
  with check (barbershop_id = get_my_barbershop_id()::uuid);
create policy "inventory_products_staff_all" on public.inventory_products for all to authenticated
  using (barbershop_id = get_my_barbershop_id()::uuid)
  with check (barbershop_id = get_my_barbershop_id()::uuid);
create policy "inventory_movements_staff_read" on public.inventory_movements for select to authenticated
  using (barbershop_id = get_my_barbershop_id()::uuid);
create policy "commissions_staff_all" on public.commissions for all to authenticated
  using (barbershop_id = get_my_barbershop_id()::uuid)
  with check (barbershop_id = get_my_barbershop_id()::uuid);
create policy "pos_transactions_staff_all" on public.pos_transactions for all to authenticated
  using (barbershop_id = get_my_barbershop_id()::uuid)
  with check (barbershop_id = get_my_barbershop_id()::uuid);
create policy "pos_transaction_items_staff_all" on public.pos_transaction_items for all to authenticated
  using (exists (select 1 from public.pos_transactions t where t.id = transaction_id and t.barbershop_id = get_my_barbershop_id()::uuid))
  with check (exists (select 1 from public.pos_transactions t where t.id = transaction_id and t.barbershop_id = get_my_barbershop_id()::uuid));
create policy "advanced_report_configs_staff_all" on public.advanced_report_configs for all to authenticated
  using (barbershop_id = get_my_barbershop_id()::uuid)
  with check (barbershop_id = get_my_barbershop_id()::uuid and created_by = auth.uid());
