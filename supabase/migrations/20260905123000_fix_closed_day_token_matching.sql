begin;

-- Correct the closed-day token matching introduced by the previous booking
-- contract migration. Accept numeric day indexes plus the common English and
-- Portuguese names without allowing one weekday's alias to match another.
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
  v_client_id uuid;
  v_duration integer := greatest(1, least(coalesce(p_duration_minutes, 30), 1440));
  v_status public.appointment_status :=
    case
      when lower(trim(coalesce(p_status, 'scheduled'))) = 'pending' then 'pending'::public.appointment_status
      else 'scheduled'::public.appointment_status
    end;
  v_email text := lower(nullif(trim(coalesce(p_manual_email, '')), ''));
  v_phone_digits text := regexp_replace(coalesce(p_manual_phone, ''), '\D', '', 'g');
  v_phone text;
  v_weekday integer;
  v_closed boolean := false;
  v_closed_day text;
  v_auto_confirm boolean := false;
begin
  if p_barbershop_id is null or p_service_id is null or p_date_hour is null then
    raise exception using errcode = '22023', message = 'BOOKING_REQUIRED_FIELDS';
  end if;

  v_phone := case
    when left(v_phone_digits, 2) = '00' then substring(v_phone_digits from 3)
    when left(v_phone_digits, 3) = '351' and length(v_phone_digits) = 12 then substring(v_phone_digits from 4)
    else v_phone_digits
  end;

  select b.closed_days, coalesce(b.auto_confirm_bookings, false)
    into v_closed_day, v_auto_confirm
  from public.barbershops b
  where b.id = p_barbershop_id;

  if not found then
    raise exception using errcode = '22023', message = 'BOOKING_BARBERSHOP_NOT_FOUND';
  end if;

  v_weekday := extract(dow from (p_date_hour at time zone 'Europe/Lisbon'))::integer;

  if v_closed_day is not null and nullif(trim(v_closed_day), '') is not null then
    select exists (
      select 1
      from unnest(string_to_array(lower(v_closed_day), ',')) as d(value)
      where trim(d.value) in (
        v_weekday::text,
        case v_weekday
          when 0 then 'sunday'
          when 1 then 'monday'
          when 2 then 'tuesday'
          when 3 then 'wednesday'
          when 4 then 'thursday'
          when 5 then 'friday'
          when 6 then 'saturday'
        end,
        case v_weekday
          when 0 then 'domingo'
          when 1 then 'segunda'
          when 2 then 'terça'
          when 3 then 'quarta'
          when 4 then 'quinta'
          when 5 then 'sexta'
          when 6 then 'sábado'
        end,
        case v_weekday
          when 0 then 'sunday-day'
          when 1 then 'segunda-feira'
          when 2 then 'terça-feira'
          when 3 then 'quarta-feira'
          when 4 then 'quinta-feira'
          when 5 then 'sexta-feira'
          when 6 then 'sábado'
        end,
        case v_weekday
          when 0 then 'domingo-feira'
          when 1 then 'monday-day'
          when 2 then 'terca-feira'
          when 3 then 'quarta-feira'
          when 4 then 'quinta-feira'
          when 5 then 'sexta-feira'
          when 6 then 'sabado'
        end
      )
    ) into v_closed;
  end if;

  if v_closed then
    raise exception using errcode = '22023', message = 'BOOKING_BARBERSHOP_CLOSED';
  end if;

  if v_auto_confirm then
    v_status := 'scheduled'::public.appointment_status;
  end if;

  if not exists (
    select 1 from public.services s
    where s.id = p_service_id
      and s.barbershop_id = p_barbershop_id
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
      and a.status in ('pending'::public.appointment_status, 'scheduled'::public.appointment_status)
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

  if v_email is not null and length(v_phone) >= 7 then
    select u.id
      into v_client_id
    from public.users u
    where u.barbershop_id = p_barbershop_id
      and u.role = 'client'
      and lower(trim(coalesce(u.email, ''))) = v_email
      and (
        case
          when left(regexp_replace(coalesce(u.num_phone, ''), '\D', '', 'g'), 2) = '00'
            then substring(regexp_replace(coalesce(u.num_phone, ''), '\D', '', 'g') from 3)
          when left(regexp_replace(coalesce(u.num_phone, ''), '\D', '', 'g'), 3) = '351'
               and length(regexp_replace(coalesce(u.num_phone, ''), '\D', '', 'g')) = 12
            then substring(regexp_replace(coalesce(u.num_phone, ''), '\D', '', 'g') from 4)
          else regexp_replace(coalesce(u.num_phone, ''), '\D', '', 'g')
        end
      ) = v_phone
    order by u.created_at asc
    limit 1;
  end if;

  insert into public.appointments (
    barbershop_id,
    client_id,
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
    v_client_id,
    p_service_id,
    p_professional_id,
    p_date_hour,
    v_status,
    nullif(left(trim(coalesce(p_manual_name, '')), 120), ''),
    nullif(left(trim(coalesce(p_manual_phone, '')), 40), ''),
    v_email,
    p_manual_birth_date,
    v_duration
  )
  returning * into v_appointment;

  return v_appointment;
end;
$$;

revoke all on function public.create_booking_atomic(uuid, uuid, uuid, timestamptz, integer, text, text, text, date, text) from public, anon, authenticated;
grant execute on function public.create_booking_atomic(uuid, uuid, uuid, timestamptz, integer, text, text, text, date, text) to service_role;

comment on function public.create_booking_atomic(uuid, uuid, uuid, timestamptz, integer, text, text, text, date, text) is
  'Atomic public booking creation with enum-safe status handling, tenant-scoped overlap protection, closed-day enforcement, and exact email+normalized-phone client linking.';

commit;
