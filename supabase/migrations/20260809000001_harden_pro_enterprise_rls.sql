-- Harden Pro/Enterprise module tables: browser clients are read-only.
-- All mutations must pass through authenticated server APIs that enforce
-- plan entitlements and staff permissions before using the admin client.

drop policy if exists "customer_tags_staff_all" on public.customer_tags;
drop policy if exists "customer_tag_assignments_staff_all" on public.customer_tag_assignments;
drop policy if exists "customer_segments_staff_all" on public.customer_segments;
drop policy if exists "automation_rules_staff_all" on public.automation_rules;
drop policy if exists "locations_staff_all" on public.locations;
drop policy if exists "location_members_staff_all" on public.location_members;
drop policy if exists "staff_permissions_staff_all" on public.staff_permissions;
drop policy if exists "inventory_products_staff_all" on public.inventory_products;
drop policy if exists "commissions_staff_all" on public.commissions;
drop policy if exists "pos_transactions_staff_all" on public.pos_transactions;
drop policy if exists "pos_transaction_items_staff_all" on public.pos_transaction_items;
drop policy if exists "advanced_report_configs_staff_all" on public.advanced_report_configs;

create policy "customer_tags_staff_read" on public.customer_tags for select to authenticated
  using (barbershop_id = get_my_barbershop_id()::uuid);
create policy "customer_tag_assignments_staff_read" on public.customer_tag_assignments for select to authenticated
  using (barbershop_id = get_my_barbershop_id()::uuid);
create policy "customer_segments_staff_read" on public.customer_segments for select to authenticated
  using (barbershop_id = get_my_barbershop_id()::uuid);
create policy "automation_rules_staff_read" on public.automation_rules for select to authenticated
  using (barbershop_id = get_my_barbershop_id()::uuid);
create policy "locations_staff_read" on public.locations for select to authenticated
  using (parent_barbershop_id = get_my_barbershop_id()::uuid);
create policy "location_members_staff_read" on public.location_members for select to authenticated
  using (exists (select 1 from public.locations l where l.id = location_id and l.parent_barbershop_id = get_my_barbershop_id()::uuid));
create policy "staff_permissions_staff_read" on public.staff_permissions for select to authenticated
  using (barbershop_id = get_my_barbershop_id()::uuid);
create policy "inventory_products_staff_read" on public.inventory_products for select to authenticated
  using (barbershop_id = get_my_barbershop_id()::uuid);
create policy "commissions_staff_read" on public.commissions for select to authenticated
  using (barbershop_id = get_my_barbershop_id()::uuid);
create policy "pos_transactions_staff_read" on public.pos_transactions for select to authenticated
  using (barbershop_id = get_my_barbershop_id()::uuid);
create policy "pos_transaction_items_staff_read" on public.pos_transaction_items for select to authenticated
  using (exists (select 1 from public.pos_transactions t where t.id = transaction_id and t.barbershop_id = get_my_barbershop_id()::uuid));
create policy "advanced_report_configs_staff_read" on public.advanced_report_configs for select to authenticated
  using (barbershop_id = get_my_barbershop_id()::uuid);

-- automation_runs and inventory_movements intentionally keep their existing
-- read policies; neither table gets browser write access.
