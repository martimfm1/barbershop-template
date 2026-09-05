begin;

-- P0 booking fix:
-- `appointments.status` uses the appointment_status enum. The RPC previously kept
-- the normalized status in text and inserted it directly into the enum column,
-- which can produce PostgreSQL datatype mismatch errors (42804).
-- Closed days are validated in /api/bookings before this RPC is called; this
-- migration additionally makes the RPC reject numeric closed-day values so a
-- direct server-side call cannot bypass the shop schedule rule.

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
  v_status text := case
    when p_status in ('pending', 'scheduled') then p_status
    else 'scheduled'
  end;
  v_shop_closed_days text;
  v_dow integer;
begin
  if p_barbershop_id is null or p_service_id is null or p_date_hour is null then
    raise exception using errcode = '22023', message = 'BOOKING_REQUIRED_FIELDS';
  end if;

  select b.closed_days
    into v_shop_closed_days
  from public.barbershops b
  where b.id = p_barbershop_id;

  if v_shop_closed_days is not null and trim(v_shop_closed_days) <> '' then
    v_dow := extract(dow from p_date_hour)::integer;
    if exists (
      select 1
      from unnest(string_to_array(v_shop_closed_days, ',')) as day_value(value)
      where trim(day_value.value) = v_dow::text
         or lower(trim(day_value.value)) = case v_dow
           when 0 then 'sunday'
           when 1 then 'monday'
           when 2 then 'tuesday'
           when 3 then 'wednesday'
           when 4 then 'thursday'
           when 5 then 'friday'
           when 6 then 'saturday'
         end
    ) then
      raise exception using errcode = 'P0001', message = 'BARBERSHOP_CLOSED_DAY';
    end if;
  end if;

  if not exists (
    select 1
    from public.services s
    where s.id = p_service_id
      and s.barbershop_id = p_barbershop_id
  ) then
    raise exception using errcode = '22023', message = 'BOOKING_SERVICE_NOT_AVAILABLE';
  end if;

  if p_professional_id is not null and not exists (
    select 1
    from public.professionals p
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
      and a.date_hour + make_interval(
        mins => greatest(1, least(coalesce(a.duration_minutes, 30), 1440))
      ) > p_date_hour
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
    v_status::appointment_status,
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
