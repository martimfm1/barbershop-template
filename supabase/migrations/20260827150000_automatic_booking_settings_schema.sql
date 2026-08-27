begin;

alter table public.barbershops
  add column if not exists auto_confirm_bookings boolean not null default false,
  add column if not exists auto_complete_bookings boolean not null default false;

create or replace function public.update_barbershop_config(
  p_barbershop_id uuid,
  p_config jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if p_barbershop_id is null or p_config is null or jsonb_typeof(p_config) <> 'object' then
    raise exception 'invalid barbershop config';
  end if;

  if not exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.barbershop_id = p_barbershop_id
      and u.role in ('owner', 'admin')
  ) then
    raise exception 'barbershop update not permitted';
  end if;

  v_plan := public.get_effective_billing_plan_for_barbershop(p_barbershop_id);

  update public.barbershops b
  set
    name = case when p_config ? 'name' then nullif(btrim(p_config->>'name'), '') else b.name end,
    phone = case when p_config ? 'phone' then nullif(btrim(p_config->>'phone'), '') else b.phone end,
    address = case when p_config ? 'address' then nullif(btrim(p_config->>'address'), '') else b.address end,
    opening_time = case when p_config ? 'opening_time' then nullif(p_config->>'opening_time', '') else b.opening_time end,
    closing_time = case when p_config ? 'closing_time' then nullif(p_config->>'closing_time', '') else b.closing_time end,
    lunch_start = case when p_config ? 'lunch_start' then nullif(p_config->>'lunch_start', '') else b.lunch_start end,
    lunch_end = case when p_config ? 'lunch_end' then nullif(p_config->>'lunch_end', '') else b.lunch_end end,
    closed_days = case when p_config ? 'closed_days' then nullif(p_config->>'closed_days', '') else b.closed_days end,
    allow_online_bookings = case when p_config ? 'allow_online_bookings' then (p_config->>'allow_online_bookings')::boolean else b.allow_online_bookings end,
    auto_reminders = case when p_config ? 'auto_reminders' then (p_config->>'auto_reminders')::boolean else b.auto_reminders end,
    auto_confirm_bookings = case
      when p_config ? 'auto_confirm_bookings' then
        case when v_plan in ('pro', 'enterprise') then (p_config->>'auto_confirm_bookings')::boolean else false end
      else b.auto_confirm_bookings
    end,
    auto_complete_bookings = case
      when p_config ? 'auto_complete_bookings' then
        case when v_plan in ('pro', 'enterprise') then (p_config->>'auto_complete_bookings')::boolean else false end
      else b.auto_complete_bookings
    end,
    updated_at = now()
  where b.id = p_barbershop_id;

  if not found then
    raise exception 'barbershop not found';
  end if;

  if (v_plan not in ('pro', 'enterprise'))
     and (p_config ? 'auto_confirm_bookings' or p_config ? 'auto_complete_bookings') then
    raise exception using errcode = '42501', message = 'AUTOMATIC_BOOKING_PRO_REQUIRED';
  end if;
end;
$$;

comment on column public.barbershops.auto_confirm_bookings is
  'Automatically confirms newly created online bookings. Pro and Enterprise only.';
comment on column public.barbershops.auto_complete_bookings is
  'Automatically completes scheduled bookings after their end time. Pro and Enterprise only.';

commit;
