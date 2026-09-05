begin;

-- Human-friendly invite codes are easier to read aloud and type:
-- BARB-AB12-CD34
-- The stored value remains hashed; only the creator receives the raw code.
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
  v_expires timestamptz := now() + interval '10 minutes';
  v_suffix text;
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
    v_suffix := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
    v_code := 'BARB-' || substr(v_suffix, 1, 4) || '-' || substr(v_suffix, 5, 4);
    v_hash := encode(digest(v_code, 'sha256'), 'hex');

    exit when not exists (
      select 1
      from public.barbershop_invite_codes i
      where i.code_hash = v_hash
    );
  end loop;

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

  return query select v_code, v_expires, p_role;
end;
$$;

comment on function public.create_barbershop_invite_code(text) is
  'Creates a single-use onboarding invite using the BARB-XXXX-XXXX human-friendly format.';

commit;
