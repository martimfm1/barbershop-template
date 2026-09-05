begin;

-- Standardize newly generated invite codes to a predictable, human-friendly
-- format: BARB-XXXX-XXXX. The database continues to store only a SHA-256 hash,
-- so the raw code is still exposed only at creation time.
create or replace function public.create_barbershop_invite_code(p_role text default 'barber')
returns table (code text, expires_at timestamptz, role text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user uuid := auth.uid();
  v_barbershop_id uuid;
  v_code text;
  v_hash text;
  v_chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_body text;
  v_attempt integer := 0;
  v_expires timestamptz := now() + interval '10 minutes';
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if p_role not in ('admin', 'manager', 'barber', 'receptionist') then
    raise exception 'invalid_role' using errcode = '22023';
  end if;

  select u.barbershop_id
    into v_barbershop_id
  from public.users u
  where u.id = v_user
    and u.role in ('owner', 'admin');

  if v_barbershop_id is null then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  loop
    v_attempt := v_attempt + 1;
    if v_attempt > 10 then
      raise exception 'invite_generation_failed' using errcode = 'P0001';
    end if;

    v_body := '';
    for i in 1..8 loop
      v_body := v_body || substr(v_chars, 1 + floor(random() * length(v_chars))::integer, 1);
    end loop;

    v_code := 'BARB-' || substr(v_body, 1, 4) || '-' || substr(v_body, 5, 4);
    v_hash := encode(digest(v_code, 'sha256'), 'hex');

    begin
      insert into public.barbershop_invite_codes (
        barbershop_id,
        code_hash,
        role,
        expires_at,
        created_by
      )
      values (
        v_barbershop_id,
        v_hash,
        p_role,
        v_expires,
        v_user
      );
      exit;
    exception when unique_violation then
      -- Retry on the extremely unlikely event of a hash collision.
      null;
    end;
  end loop;

  return query select v_code, v_expires, p_role;
end;
$$;

create or replace function public.join_barbershop_with_invite(p_code text)
returns table (barbershop_id uuid, role text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user uuid := auth.uid();
  v_input text;
  v_hash text;
  v_invite public.barbershop_invite_codes%rowtype;
  v_default_permissions jsonb := jsonb_build_object(
    'dashboard', true, 'agenda', true, 'clients', true, 'services', true,
    'team', false, 'messages', false, 'marketing', false, 'loyalty', false,
    'automations', false, 'analytics', false, 'qr', false, 'settings', false, 'billing', false
  );
  v_plan text := 'free';
  v_limit integer := 1;
  v_active_count integer := 0;
  v_existing_professional boolean := false;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  v_input := upper(regexp_replace(trim(coalesce(p_code, '')), '\s+', '', 'g'));
  if v_input !~ '^BARB-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$' then
    raise exception 'invalid_code' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.users where id = v_user and role = 'owner'
  ) then
    raise exception 'owner_cannot_join' using errcode = '42501';
  end if;

  v_hash := encode(digest(v_input, 'sha256'), 'hex');

  select *
    into v_invite
  from public.barbershop_invite_codes
  where code_hash = v_hash
    and used_at is null
    and expires_at > now()
  order by created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'invalid_or_expired_code' using errcode = '22023';
  end if;

  select exists (
    select 1 from public.professionals
    where barbershop_id = v_invite.barbershop_id
      and user_id = v_user
  ) into v_existing_professional;

  if not v_existing_professional then
    perform pg_advisory_xact_lock(hashtextextended(v_invite.barbershop_id::text, 0));

    select coalesce(public.get_effective_billing_plan_for_barbershop(v_invite.barbershop_id), 'free')
      into v_plan;

    v_limit := case v_plan
      when 'free' then 1
      when 'pro' then 5
      when 'enterprise' then 2147483647
      else 1
    end;

    select count(*)::integer
      into v_active_count
    from public.professionals
    where barbershop_id = v_invite.barbershop_id
      and active = true;

    if v_active_count >= v_limit then
      raise exception using errcode = 'P0001', message = 'PROFESSIONAL_LIMIT_REACHED';
    end if;
  end if;

  perform set_config('app.silentra_invite_join', 'true', true);

  update public.users
  set barbershop_id = v_invite.barbershop_id,
      role = v_invite.role
  where id = v_user;

  if not found then
    raise exception 'user_profile_not_found' using errcode = 'P0002';
  end if;

  insert into public.barbershop_member_permissions(user_id, barbershop_id, permissions, updated_at)
  values (v_user, v_invite.barbershop_id, v_default_permissions, now())
  on conflict (user_id) do update
    set barbershop_id = excluded.barbershop_id,
        permissions = excluded.permissions,
        updated_at = now();

  perform public.sync_barber_professional(v_user, v_invite.barbershop_id, v_invite.role);

  update public.barbershop_invite_codes
  set used_at = now(),
      used_by = v_user
  where id = v_invite.id;

  return query
    select v_invite.barbershop_id, v_invite.role;
end;
$$;

revoke all on function public.create_barbershop_invite_code(text) from public, anon, authenticated;
grant execute on function public.create_barbershop_invite_code(text) to authenticated;
revoke all on function public.join_barbershop_with_invite(text) from public, anon, authenticated;
grant execute on function public.join_barbershop_with_invite(text) to authenticated;

commit;
