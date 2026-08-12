-- Atomic, server-side onboarding.
-- The authenticated user is always the owner of the newly-created barbershop.
-- The whole operation is transactional: either all records are created/linked or
-- PostgreSQL rolls everything back.

create or replace function public.create_barbershop_onboarding(
  p_name text,
  p_address text,
  p_city text,
  p_opening_time time,
  p_closing_time time,
  p_price numeric,
  p_tags text[] default '{}',
  p_lat numeric default null,
  p_lng numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_barbershop_id uuid;
  v_slug text;
  v_tags text[];
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if nullif(trim(p_name), '') is null
     or nullif(trim(p_address), '') is null
     or nullif(trim(p_city), '') is null then
    raise exception 'required fields missing' using errcode = '22023';
  end if;

  if p_opening_time is null or p_closing_time is null then
    raise exception 'invalid opening hours' using errcode = '22023';
  end if;

  if p_price is null or p_price < 0 or p_price > 10000 then
    raise exception 'invalid price' using errcode = '22023';
  end if;

  if p_lat is not null and (p_lat < -90 or p_lat > 90) then
    raise exception 'invalid latitude' using errcode = '22023';
  end if;

  if p_lng is not null and (p_lng < -180 or p_lng > 180) then
    raise exception 'invalid longitude' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.users u
    where u.id = v_user_id
      and u.barbershop_id is not null
  ) then
    raise exception 'user already belongs to a barbershop' using errcode = '23505';
  end if;

  -- Limit and normalize marketplace tags server-side.
  select coalesce(array_agg(tag), '{}')
    into v_tags
  from (
    select distinct left(trim(value), 60) as tag
    from unnest(coalesce(p_tags, '{}')) as value
    where nullif(trim(value), '') is not null
    limit 12
  ) normalized_tags;

  v_slug := regexp_replace(lower(trim(p_name)), '[^a-z0-9]+', '-', 'g');
  v_slug := trim(both '-' from v_slug);
  v_slug := coalesce(nullif(v_slug, ''), 'barbearia');
  v_slug := left(v_slug, 80) || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  insert into public.barbershops (
    name,
    address,
    opening_time,
    closing_time,
    allow_online_bookings,
    auto_reminders,
    created_by
  ) values (
    trim(p_name),
    trim(p_address),
    p_opening_time,
    p_closing_time,
    true,
    false,
    v_user_id
  )
  returning id into v_barbershop_id;

  insert into public.shops (
    barbershop_id,
    slug,
    city,
    price,
    tags,
    lat,
    lng,
    is_active
  ) values (
    v_barbershop_id,
    v_slug,
    trim(p_city),
    round(p_price, 2),
    v_tags,
    p_lat,
    p_lng,
    true
  );

  -- The trigger permits this exact internal onboarding context only.
  perform set_config('app.silentra_onboarding_owner_link', 'true', true);

  update public.users
  set barbershop_id = v_barbershop_id,
      role = 'owner'
  where id = v_user_id
    and barbershop_id is null;

  if not found then
    raise exception 'user profile not found or already linked' using errcode = '23505';
  end if;

  perform set_config('app.silentra_onboarding_owner_link', 'false', true);

  return v_barbershop_id;
end;
$$;

revoke all on function public.create_barbershop_onboarding(
  text, text, text, time, time, numeric, text[], numeric, numeric
) from public, anon;

grant execute on function public.create_barbershop_onboarding(
  text, text, text, time, time, numeric, text[], numeric, numeric
) to authenticated;
