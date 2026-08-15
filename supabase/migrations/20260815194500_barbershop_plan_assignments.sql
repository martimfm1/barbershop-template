begin;

-- Administrative plan assignment, intentionally separate from Stripe billing state.
-- This lets Silentra grant/revoke Free, Pro or Enterprise access for a barbershop
-- without pretending that a Stripe subscription exists.
create table if not exists public.barbershop_plan_assignments (
  barbershop_id uuid primary key references public.barbershops(id) on delete cascade,
  plan public.subscription_plan not null,
  reason text,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  expires_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint barbershop_plan_assignment_reason_length check (reason is null or char_length(reason) <= 500)
);

create index if not exists barbershop_plan_assignments_active_idx
  on public.barbershop_plan_assignments(barbershop_id, expires_at);

alter table public.barbershop_plan_assignments enable row level security;
revoke all on public.barbershop_plan_assignments from anon, authenticated;

-- Keep the existing resolver signature as text. Earlier migrations already created
-- this function with text return type, and PostgreSQL cannot change a function's
-- return type with CREATE OR REPLACE FUNCTION. The application casts this value
-- to BillingPlan where needed.
create or replace function public.get_effective_billing_plan_for_barbershop(p_barbershop_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select a.plan::text
      from public.barbershop_plan_assignments a
      where a.barbershop_id = p_barbershop_id
        and (a.expires_at is null or a.expires_at > now())
      limit 1
    ),
    (
      select case
        when s.plan_override in ('pro', 'enterprise', 'free') then s.plan_override::text
        when s.plan in ('pro', 'enterprise') and s.status in ('active', 'trialing') then s.plan::text
        else 'free'::text
      end
      from public.subscriptions s
      where s.barbershop_id = p_barbershop_id
      order by s.updated_at desc, s.created_at desc
      limit 1
    ),
    'free'::text
  );
$$;

-- Service-role only: the application administration layer can use this instead
-- of writing billing tables directly.
create or replace function public.set_barbershop_plan_assignment(
  p_barbershop_id uuid,
  p_plan public.subscription_plan,
  p_reason text default null,
  p_assigned_by uuid default null,
  p_expires_at timestamptz default null
)
returns public.barbershop_plan_assignments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assignment public.barbershop_plan_assignments;
begin
  if p_reason is not null and char_length(p_reason) > 500 then
    raise exception using errcode = '22023', message = 'PLAN_ASSIGNMENT_REASON_TOO_LONG';
  end if;

  insert into public.barbershop_plan_assignments (
    barbershop_id,
    plan,
    reason,
    assigned_by,
    assigned_at,
    expires_at,
    updated_at
  )
  values (
    p_barbershop_id,
    p_plan,
    nullif(btrim(p_reason), ''),
    p_assigned_by,
    now(),
    p_expires_at,
    now()
  )
  on conflict (barbershop_id) do update set
    plan = excluded.plan,
    reason = excluded.reason,
    assigned_by = excluded.assigned_by,
    assigned_at = excluded.assigned_at,
    expires_at = excluded.expires_at,
    updated_at = now()
  returning * into v_assignment;

  return v_assignment;
end;
$$;

create or replace function public.clear_barbershop_plan_assignment(
  p_barbershop_id uuid
)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.barbershop_plan_assignments
  where barbershop_id = p_barbershop_id;
$$;

revoke all on function public.get_effective_billing_plan_for_barbershop(uuid) from public, anon, authenticated;
grant execute on function public.get_effective_billing_plan_for_barbershop(uuid) to service_role;
revoke all on function public.set_barbershop_plan_assignment(uuid, public.subscription_plan, text, uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.set_barbershop_plan_assignment(uuid, public.subscription_plan, text, uuid, timestamptz) to service_role;
revoke all on function public.clear_barbershop_plan_assignment(uuid) from public, anon, authenticated;
grant execute on function public.clear_barbershop_plan_assignment(uuid) to service_role;

comment on table public.barbershop_plan_assignments is
  'Administrative Silentra plan grants for a barbershop. Separate from Stripe subscriptions; active assignments take precedence over billing state.';
comment on column public.barbershop_plan_assignments.plan is
  'Effective administrative entitlement while the assignment is active. Supports free, pro and enterprise.';
comment on column public.barbershop_plan_assignments.expires_at is
  'Optional automatic expiry. After this timestamp the normal subscription state becomes authoritative again.';

commit;
