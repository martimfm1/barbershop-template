-- Adds a server-side, race-safe quota check for creating professionals (barbers).
--
-- The function is SECURITY DEFINER so it bypasses RLS; the calling API route is
-- responsible for authenticating the user and verifying ownership. The plan is
-- always resolved from the barbershop owner's subscription (Stripe sync state),
-- never from the client.
--
-- Limits mirror PLAN_LIMITS in lib/billing/plan-features.ts:
--   free        -> 1 barber
--   pro         -> 5 barbers
--   enterprise  -> unlimited
--
-- On success returns the inserted row. On quota breach raises an exception with
-- the message: quota_exceeded|barbers|<current>|<limit>|<plan>|<requiredPlan>
-- so the API route can map it to a structured 409 response.

create or replace function public.create_professional_with_quota(
  p_barbershop_id uuid,
  p_user_id uuid,
  p_name text,
  p_commission_percentage numeric default 50,
  p_active boolean default true
) returns public.professionals as $$
declare
  v_plan text;
  v_count int;
  v_limit int;
  v_required text;
  v_new public.professionals%ROWTYPE;
begin
  -- Defensive ownership check (the API route also enforces this).
  if not exists (
    select 1
    from public.users u
    where u.id = p_user_id
      and u.barbershop_id = p_barbershop_id
  ) then
    raise exception 'forbidden: user is not the owner of this barbershop'
      using errcode = 'P08001';
  end if;

  -- Resolve the plan from the barbershop owner's subscription.
  select s.plan into v_plan
  from public.users u
  join public.subscriptions s on s.user_id = u.id
  where u.id = p_user_id
  limit 1;

  v_plan := coalesce(v_plan, 'free');

  -- Map plan -> barber limit (mirrors PLAN_LIMITS).
  v_limit := case v_plan
    when 'free' then 1
    when 'pro' then 5
    when 'enterprise' then 999999
    else 1
  end;

  -- Lock the table so the count + insert is atomic across concurrent requests.
  lock table public.professionals in row exclusive mode;

  select count(*) into v_count
  from public.professionals
  where barbershop_id = p_barbershop_id;

  if v_count >= v_limit then
    v_required := case v_plan
      when 'free' then 'pro'
      when 'pro' then 'enterprise'
      else 'enterprise'
    end;
    raise exception 'quota_exceeded|barbers|%s|%s|%s|%s',
      v_count, v_limit, v_plan, v_required
      using errcode = 'P0001';
  end if;

  insert into public.professionals (barbershop_id, name, commission_percentage, active)
  values (p_barbershop_id, p_name, p_commission_percentage, p_active)
  returning * into v_new;

  return v_new;
end;
$$ language plpgsql security definer;