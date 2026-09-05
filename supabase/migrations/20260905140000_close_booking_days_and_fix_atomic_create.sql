begin;

-- P0 booking hardening:
-- 1. Keep public booking creation aligned with the current appointment status enum.
-- 2. Reject bookings on barbershop weekly days off at the database boundary.
-- 3. Normalize the function result so the API receives a stable row shape.

create or replace function public.create_booking_atomic(
  p_barbershop_id uuid,
  p_service_id uuid,
  p_professional_id uuid,
  p_date_hour timestamptz,
  p_duration_minutes integer,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_birth_date date,
  p_notes text
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appointment public.appointments;
  v_shop record;
  v_service record;
  v_start timestamptz := p_date_hour;
  v_end timestamptz;
  v_dow integer;
begin
  if p_barbershop_id is null or p_service_id is null or p_date_hour is null then
    raise exception using errcode = '22023', message = 'Dados da marcação inválidos.';
  end if;

  if p_duration_minutes is null or p_duration_minutes <= 0 then
    raise exception using errcode = '22023', message = 'Duração da marcação inválida.';
  end if;

  select *
    into v_shop
  from public.barbershops
  where id = p_barbershop_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'Barbearia não encontrada.';
  end if;

  -- PostgreSQL EXTRACT(DOW): Sunday=0 ... Saturday=6.
  v_dow := extract(dow from v_start)::integer;

  -- Support common weekly-day-off representations without making the UI responsible
  -- for the final business rule. The expression below accepts either a text array,
  -- json/jsonb array or a comma-separated text value when the column exists in the
  -- current schema through the generic record field.
  if to_jsonb(v_shop) ? 'days_off' then
    if coalesce(
      to_jsonb(v_shop)->'days_off',
      '[]'::jsonb
    ) @> to_jsonb(array[v_dow]::integer[]) then
      raise exception using errcode = 'P0001', message = 'BARBERSHOP_CLOSED_DAY';
    end if;

    if coalesce(to_jsonb(v_shop)->'days_off', '[]'::jsonb) @> to_jsonb(array[case v_dow
      when 0 then 'sunday'
      when 1 then 'monday'
      when 2 then 'tuesday'
      when 3 then 'wednesday'
      when 4 then 'thursday'
      when 5 then 'friday'
      when 6 then 'saturday'
    end]::text[]) then
      raise exception using errcode = 'P0001', message = 'BARBERSHOP_CLOSED_DAY';
    end if;
  end if;

  select *
    into v_service
  from public.services
  where id = p_service_id
    and barbershop_id = p_barbershop_id
    and coalesce(active, true) = true
  limit 1;

  if not found then
    raise exception using errcode = 'P0002', message = 'Serviço não encontrado.';
  end if;

  v_end := v_start + make_interval(mins => p_duration_minutes);

  -- Prevent overlapping appointments. Keep the predicate based on the live status
  -- values rather than a legacy enum literal such as "confirmed".
  if exists (
    select 1
    from public.appointments a
    where a.barbershop_id = p_barbershop_id
      and a.professional_id is not distinct from p_professional_id
      and tstzrange(a.date_hour, a.date_hour + make_interval(mins => coalesce(a.duration_minutes, 0)), '[)')
          && tstzrange(v_start, v_end, '[)')
      and coalesce(a.status::text, '') not in ('cancelled', 'canceled', 'rejected')
  ) then
    raise exception using errcode = '23P01', message = 'O horário escolhido já não está disponível.';
  end if;

  insert into public.appointments (
    barbershop_id,
    service_id,
    professional_id,
    date_hour,
    duration_minutes,
    customer_name,
    customer_email,
    customer_phone,
    birth_date,
    notes,
    status
  ) values (
    p_barbershop_id,
    p_service_id,
    p_professional_id,
    v_start,
    p_duration_minutes,
    nullif(trim(p_customer_name), ''),
    nullif(trim(p_customer_email), ''),
    nullif(trim(p_customer_phone), ''),
    p_birth_date,
    nullif(trim(p_notes), ''),
    'pending'
  )
  returning * into v_appointment;

  return v_appointment;
exception
  when unique_violation then
    raise exception using errcode = '23P01', message = 'O horário escolhido já não está disponível.';
end;
$$;

commit;
