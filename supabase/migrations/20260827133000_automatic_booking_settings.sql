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
  v_auto_confirm boolean;
  v_auto_complete boolean;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if p_barbershop_id is null or p_config is null or jsonb_typeof(p_config) <> 'object' then
    raise exception 'invalid barbershop config';
  end if;

  if not exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.barbershop_id = p_barbershop_id
      and u.role in ('owner', 'admin')
  ) then
    raise exception 'barbershop update not permitted';
  end if;

  v_plan := public.get_effective_billing_plan_for_barbershop(p_barbershop_id);
  v_auto_confirm := case
    when p_config ? 'auto_confirm_bookings' then coalesce((p_config->>'auto_confirm_bookings')::boolean, false)
    else false
  end;
  v_auto_complete := case
    when p_config ? 'auto_complete_bookings' then coalesce((p_config->>'auto_complete_bookings')::boolean, false)
    else false
  end;

  if (p_config ? 'auto_confirm_bookings' or p_config ? 'auto_complete_bookings')
     and (v_auto_confirm or v_auto_complete)
     and coalesce(v_plan, 'free') not in ('pro', 'enterprise') then
    raise exception using errcode = '42501', message = 'AUTOMATIC_BOOKING_SETTINGS_PRO_REQUIRED';
  end if;

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
    auto_confirm_bookings = case when p_config ? 'auto_confirm_bookings' then (p_config->>'auto_confirm_bookings')::boolean else b.auto_confirm_bookings end,
    auto_complete_bookings = case when p_config ? 'auto_complete_bookings' then (p_config->>'auto_complete_bookings')::boolean else b.auto_complete_bookings end,
    updated_at = now()
  where b.id = p_barbershop_id;

  if not found then
    raise exception 'barbershop not found';
  end if;
end;
$$;

revoke all on function public.update_barbershop_config(uuid, jsonb) from public;
grant execute on function public.update_barbershop_config(uuid, jsonb) to authenticated;

create or replace function public.create_booking_atomic(
  p_barbershop_id uuid,
  p_service_id uuid,
  p_professional_id uuid,
  p_date_hour timestamptz,
  p_duration_minutes integer,
  p_manual_name text,
  p_manual_phone text,
  p_manual_email text,
  p_manual_birth_date date,
  p_status text default 'scheduled'
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appointment public.appointments;
  v_existing boolean;
  v_duration integer := greatest(1, least(coalesce(p_duration_minutes, 30), 1440));
  v_status text := case when p_status in ('pending', 'scheduled') then p_status else 'scheduled' end;
  v_auto_confirm boolean := false;
begin
  if p_barbershop_id is null or p_service_id is null or p_date_hour is null then
    raise exception using errcode = '22023', message = 'BOOKING_REQUIRED_FIELDS';
  end if;

  select coalesce(b.auto_confirm_bookings, false)
    into v_auto_confirm
  from public.barbershops b
  where b.id = p_barbershop_id;

  if v_auto_confirm then
    v_status := 'scheduled';
  end if;

  if not exists (
    select 1 from public.services s
    where s.id = p_service_id and s.barbershop_id = p_barbershop_id
  ) then
    raise exception using errcode = '22023', message = 'BOOKING_SERVICE_NOT_AVAILABLE';
  end if;

  if p_professional_id is not null and not exists (
    select 1 from public.professionals p
    where p.id = p_professional_id
      and p.barbershop_id = p_barbershop_id
      and p.active = true
  ) then
    raise exception using errcode = '22023', message = 'BOOKING_PROFESSIONAL_NOT_AVAILABLE';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_barbershop_id::text, 0));

  select exists (
    select 1
    from public.appointments a
    where a.barbershop_id = p_barbershop_id
      and a.status in ('pending', 'scheduled')
      and a.date_hour < p_date_hour + make_interval(mins => v_duration)
      and a.date_hour + make_interval(mins => greatest(1, least(coalesce(a.duration_minutes, 30), 1440))) > p_date_hour
      and (
        p_professional_id is null
        or a.professional_id is null
        or a.professional_id = p_professional_id
      )
  ) into v_existing;

  if v_existing then
    raise exception using errcode = '23P01', message = 'BOOKING_CONFLICT';
  end if;

  insert into public.appointments (
    barbershop_id,
    service_id,
    professional_id,
    date_hour,
    status,
    manual_name,
    manual_phone,
    manual_email,
    manual_birth_date,
    duration_minutes
  )
  values (
    p_barbershop_id,
    p_service_id,
    p_professional_id,
    p_date_hour,
    v_status,
    nullif(left(trim(coalesce(p_manual_name, '')), 120), ''),
    nullif(left(trim(coalesce(p_manual_phone, '')), 40), ''),
    lower(nullif(left(trim(coalesce(p_manual_email, '')), 254), '')),
    p_manual_birth_date,
    v_duration
  )
  returning * into v_appointment;

  return v_appointment;
end;
$$;

revoke all on function public.create_booking_atomic(uuid, uuid, uuid, timestamptz, integer, text, text, text, date, text) from public, anon, authenticated;
grant execute on function public.create_booking_atomic(uuid, uuid, uuid, timestamptz, integer, text, text, text, date, text) to service_role;

commit;
