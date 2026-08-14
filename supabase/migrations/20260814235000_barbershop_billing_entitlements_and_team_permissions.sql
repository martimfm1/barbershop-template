begin;

-- Billing access belongs to the barbershop. The user_id remains the Stripe/billing owner.
alter table public.subscriptions
  add column if not exists barbershop_id uuid references public.barbershops(id) on delete set null;

-- Backfill existing subscriptions from the user's current tenant.
update public.subscriptions s
set barbershop_id = u.barbershop_id
from public.users u
where u.id = s.user_id
  and s.barbershop_id is null
  and u.barbershop_id is not null;

-- Keep at most one entitlement row per barbershop. Prefer the owner, then the oldest row.
do $$
declare
  v_shop uuid;
  v_keep uuid;
begin
  for v_shop in
    select barbershop_id
    from public.subscriptions
    where barbershop_id is not null
    group by barbershop_id
    having count(*) > 1
  loop
    select s.id
      into v_keep
    from public.subscriptions s
    left join public.users u on u.id = s.user_id
    where s.barbershop_id = v_shop
    order by case when u.role = 'owner' then 0 else 1 end,
             s.created_at asc,
             s.id asc
    limit 1;

    update public.subscriptions
    set barbershop_id = null,
        updated_at = now()
    where barbershop_id = v_shop
      and id <> v_keep;
  end loop;
end;
$$;

create unique index if not exists subscriptions_barbershop_unique_idx
  on public.subscriptions(barbershop_id)
  where barbershop_id is not null;

create index if not exists subscriptions_barbershop_active_idx
  on public.subscriptions(barbershop_id)
  where status in ('active', 'trialing', 'past_due');

-- Members of a barbershop may read the barbershop's billing state. Billing writes
-- remain service-role only.
drop policy if exists "Users can read their subscription" on public.subscriptions;
create policy "Barbershop members can read their subscription"
  on public.subscriptions
  for select
  to authenticated
  using (
    barbershop_id = (
      select u.barbershop_id
      from public.users u
      where u.id = (select auth.uid())
    )
  );

-- Canonical plan resolver for database-side entitlements and quotas.
create or replace function public.get_effective_billing_plan_for_barbershop(p_barbershop_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when s.plan_override in ('pro', 'enterprise') then s.plan_override::text
    when s.plan in ('pro', 'enterprise') and s.status in ('active', 'trialing') then s.plan::text
    else 'free'::text
  end
  from public.subscriptions s
  where s.barbershop_id = p_barbershop_id
  order by s.updated_at desc, s.created_at desc
  limit 1;
$$;

-- Backward-compatible wrapper: callers that pass a user now resolve the
-- user's barbershop and therefore inherit the barbershop plan.
create or replace function public.get_effective_billing_plan(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.get_effective_billing_plan_for_barbershop(u.barbershop_id),
    'free'::text
  )
  from public.users u
  where u.id = p_user_id;
$$;

revoke all on function public.get_effective_billing_plan_for_barbershop(uuid) from public, anon, authenticated;
grant execute on function public.get_effective_billing_plan_for_barbershop(uuid) to service_role;
revoke all on function public.get_effective_billing_plan(uuid) from public, anon, authenticated;
grant execute on function public.get_effective_billing_plan(uuid) to service_role;

-- Reconcile the existing team-permission records so every internal member has
-- an explicit permission set. These values are only defaults for existing data;
-- the authorization layer will honor the saved switches exactly.
do $$
declare
  v_user record;
  v_permissions jsonb;
begin
  for v_user in
    select id, barbershop_id, role
    from public.users
    where barbershop_id is not null
      and role <> 'owner'
  loop
    v_permissions := case lower(coalesce(v_user.role, ''))
      when 'admin' then jsonb_build_object(
        'dashboard', true, 'agenda', true, 'clients', true, 'services', true,
        'team', true, 'messages', true, 'marketing', true, 'loyalty', true,
        'automations', true, 'analytics', true, 'qr', true, 'settings', true, 'billing', false
      )
      when 'manager' then jsonb_build_object(
        'dashboard', true, 'agenda', true, 'clients', true, 'services', true,
        'team', true, 'messages', true, 'marketing', true, 'loyalty', true,
        'automations', true, 'analytics', true, 'qr', true, 'settings', false, 'billing', false
      )
      when 'receptionist' then jsonb_build_object(
        'dashboard', true, 'agenda', true, 'clients', true, 'services', false,
        'team', false, 'messages', true, 'marketing', false, 'loyalty', false,
        'automations', false, 'analytics', false, 'qr', false, 'settings', false, 'billing', false
      )
      when 'barber' then jsonb_build_object(
        'dashboard', true, 'agenda', true, 'clients', true, 'services', true,
        'team', false, 'messages', false, 'marketing', false, 'loyalty', false,
        'automations', false, 'analytics', false, 'qr', false, 'settings', false, 'billing', false
      )
      else jsonb_build_object(
        'dashboard', true, 'agenda', false, 'clients', false, 'services', false,
        'team', false, 'messages', false, 'marketing', false, 'loyalty', false,
        'automations', false, 'analytics', false, 'qr', false, 'settings', false, 'billing', false
      )
    end;

    insert into public.barbershop_member_permissions(user_id, barbershop_id, permissions, updated_at)
    values (v_user.id, v_user.barbershop_id, v_permissions, now())
    on conflict (user_id) do nothing;
  end loop;
end;
$$;

-- Update the professional quota function to resolve the plan from the tenant,
-- never from the actor's personal billing row.
create or replace function public.create_professional_with_plan_quota(
  p_actor_user_id uuid,
  p_barbershop_id uuid,
  p_name varchar,
  p_commission_percentage integer default null,
  p_active boolean default true
)
returns public.professionals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_barbershop_id uuid;
  v_role text;
  v_plan text := 'free';
  v_limit integer := 1;
  v_count integer;
  v_professional public.professionals;
  v_commission integer;
  v_has_permission boolean := false;
begin
  if p_name is null or length(btrim(p_name)) = 0 or length(p_name) > 120 then
    raise exception using errcode = '22023', message = 'INVALID_NAME';
  end if;

  if p_commission_percentage is not null
     and (p_commission_percentage < 0 or p_commission_percentage > 100) then
    raise exception using errcode = '22023', message = 'INVALID_COMMISSION';
  end if;

  select u.barbershop_id, lower(coalesce(u.role, ''))
    into v_user_barbershop_id, v_role
  from public.users u
  where u.id = p_actor_user_id;

  if v_user_barbershop_id is null or v_user_barbershop_id <> p_barbershop_id then
    raise exception using errcode = '42501', message = 'BARBERSHOP_ACCESS_DENIED';
  end if;

  if v_role = 'owner' then
    v_has_permission := true;
  else
    select exists (
      select 1
      from public.barbershop_member_permissions mp
      where mp.barbershop_id = p_barbershop_id
        and mp.user_id = p_actor_user_id
        and coalesce((mp.permissions ->> 'team')::boolean, false) = true
    ) into v_has_permission;
  end if;

  if not v_has_permission then
    raise exception using errcode = '42501', message = 'PROFESSIONAL_MANAGEMENT_DENIED';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_barbershop_id::text, 0));

  select coalesce(public.get_effective_billing_plan_for_barbershop(p_barbershop_id), 'free')
    into v_plan;

  v_limit := case v_plan
    when 'free' then 1
    when 'pro' then 5
    when 'enterprise' then null
    else 1
  end;

  select count(*)::integer
    into v_count
  from public.professionals
  where barbershop_id = p_barbershop_id
    and active = true;

  if v_limit is not null and v_count >= v_limit then
    raise exception using errcode = 'P0001', message = 'PROFESSIONAL_LIMIT_REACHED';
  end if;

  v_commission := case
    when v_plan = 'free' then 100
    else coalesce(p_commission_percentage, 100)
  end;

  insert into public.professionals (barbershop_id, name, commission_percentage, active)
  values (p_barbershop_id, btrim(p_name), v_commission, coalesce(p_active, true))
  returning * into v_professional;

  insert into public.audit_logs (action, entity_type, entity_id, metadata, created_at)
  values (
    'professional.created',
    'professional',
    v_professional.id::text,
    jsonb_build_object(
      'barbershop_id', p_barbershop_id,
      'plan', v_plan,
      'plan_source', 'barbershop',
      'actor_user_id', p_actor_user_id
    ),
    now()
  );

  return v_professional;
end;
$$;

revoke all on function public.create_professional_with_plan_quota(uuid, uuid, varchar, integer, boolean) from public, anon, authenticated;
grant execute on function public.create_professional_with_plan_quota(uuid, uuid, varchar, integer, boolean) to service_role;

commit;
