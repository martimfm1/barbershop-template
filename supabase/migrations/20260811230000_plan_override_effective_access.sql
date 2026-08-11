-- An explicit non-free plan_override is an administrative entitlement.
-- It must behave like an active paid plan for all database-side quota checks,
-- without creating or pretending that a Stripe payment exists.

create or replace function public.get_effective_billing_plan(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when s.plan_override in ('pro', 'enterprise') then s.plan_override::text
    when s.plan::text in ('pro', 'enterprise') and s.status in ('active', 'trialing') then s.plan::text
    else 'free'::text
  end
  from public.subscriptions s
  where s.user_id = p_user_id
  limit 1;
$$;

revoke all on function public.get_effective_billing_plan(uuid) from public, anon, authenticated;
grant execute on function public.get_effective_billing_plan(uuid) to service_role;

-- Keep professional quota enforcement aligned with the application-level
-- SubscriptionService.getAccessPlan() resolver.
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

  if v_role in ('admin', 'owner') then
    v_has_permission := true;
  else
    select exists (
      select 1
      from public.staff_permissions sp
      where sp.barbershop_id = p_barbershop_id
        and sp.user_id = p_actor_user_id
        and sp.permission in ('manage_professionals', 'team_management', 'manage_team')
        and sp.allowed = true
    ) into v_has_permission;
  end if;

  if not v_has_permission then
    raise exception using errcode = '42501', message = 'PROFESSIONAL_MANAGEMENT_DENIED';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_barbershop_id::text, 0));

  select coalesce(public.get_effective_billing_plan(p_actor_user_id), 'free')
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
  where barbershop_id = p_barbershop_id;

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
      'plan_source', case when exists (
        select 1 from public.subscriptions s
        where s.user_id = p_actor_user_id and s.plan_override in ('pro', 'enterprise')
      ) then 'admin_override' else 'subscription' end,
      'actor_user_id', p_actor_user_id
    ),
    now()
  );

  return v_professional;
end;
$$;

revoke all on function public.create_professional_with_plan_quota(uuid, uuid, varchar, integer, boolean) from public, anon, authenticated;
grant execute on function public.create_professional_with_plan_quota(uuid, uuid, varchar, integer, boolean) to service_role;

comment on column public.subscriptions.plan_override is
  'Administrative entitlement override. pro/enterprise is treated as active paid access by application and database quota checks. null returns control to Stripe/local subscription state; free explicitly forces Free.';
