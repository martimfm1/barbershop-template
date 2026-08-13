-- Invite codes are intentionally onboarding-only for barbers.
-- Role changes happen later through the owner-only member management UI/RPC.

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
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select u.barbershop_id into v_barbershop_id
  from public.users u
  where u.id = v_user
    and u.role in ('owner', 'admin');

  if v_barbershop_id is null then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  v_code := upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 10));
  v_hash := encode(digest(v_code, 'sha256'), 'hex');

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
    'barber',
    v_expires,
    v_user
  );

  return query select v_code, v_expires, 'barber'::text;
end;
$$;

revoke all on function public.create_barbershop_invite_code(text) from public, anon, authenticated;
grant execute on function public.create_barbershop_invite_code(text) to authenticated;
