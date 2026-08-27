begin;

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
  v_status text := case when p_status in ('pending', 'scheduled', 'confirmed') then p_status else 'scheduled' end;
  v_email text := lower(nullif(trim(coalesce(p_manual_email, '')), ''));
  v_phone text := regexp_replace(coalesce(p_manual_phone, ''), '\\D', '', 'g');
begin
  if p_barbershop_id is null or p_service_id is null or p_date_hour is null then
    raise exception using errcode = '22023', message = 'BOOKING_REQUIRED_FIELDS';
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
      and a.status in ('pending', 'scheduled', 'confirmed')
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
      and regexp_replace(coalesce(u.num_phone, ''), '\\D', '', 'g') = v_phone
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
  'Atomic server-side appointment creation with tenant-scoped conflict protection and exact email+phone client linking.';

commit;
