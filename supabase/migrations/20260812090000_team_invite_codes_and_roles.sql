-- Team membership roles and short-lived onboarding invite codes.
-- Invite codes are stored hashed; the raw code is only returned once to the authorized generator.

alter table public.users
  add column if not exists role text not null default 'barber';

alter table public.users
  drop constraint if exists users_role_check;

-- Preserve legacy application roles used by existing customer/staff records.
-- New team roles are additive; legacy roles can be migrated separately without
-- blocking this migration or accidentally changing customer accounts.
alter table public.users
  add constraint users_role_check
  check (role in ('owner', 'admin', 'manager', 'barber', 'receptionist', 'staff', 'client'));

-- Existing single-user barbershops are migrated to the owner role.
-- Multi-user shops are left unchanged so ownership is not guessed.
update public.users u
set role = 'owner'
where u.barbershop_id is not null
  and u.role not in ('client')
  and not exists (
    select 1 from public.users existing_owner
    where existing_owner.barbershop_id = u.barbershop_id
      and existing_owner.role = 'owner'
  )
  and 1 = (
    select count(*) from public.users shop_users
    where shop_users.barbershop_id = u.barbershop_id
      and shop_users.role <> 'client'
  );

create table if not exists public.barbershop_invite_codes (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  code_hash text not null,
  role text not null default 'barber',
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid references auth.users(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint barbershop_invite_codes_role_check check (role in ('admin', 'manager', 'barber', 'receptionist'))
);

create unique index if not exists barbershop_invite_codes_code_hash_idx
  on public.barbershop_invite_codes(code_hash);

create index if not exists barbershop_invite_codes_active_idx
  on public.barbershop_invite_codes(barbershop_id, expires_at)
  where used_at is null;

alter table public.barbershop_invite_codes enable row level security;

create or replace function public.create_barbershop_invite_code(p_role text default 'barber')
returns table (code text, expires_at timestamptz, role text)
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_user uuid := auth.uid(); v_barbershop_id uuid; v_code text; v_hash text; v_expires timestamptz := now() + interval '10 minutes';
begin
  if v_user is null then raise exception 'not_authenticated' using errcode = '42501'; end if;
  if p_role not in ('admin', 'manager', 'barber', 'receptionist') then raise exception 'invalid_role' using errcode = '22023'; end if;
  select u.barbershop_id into v_barbershop_id from public.users u where u.id = v_user and u.role in ('owner', 'admin');
  if v_barbershop_id is null then raise exception 'not_allowed' using errcode = '42501'; end if;
  v_code := upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 10));
  v_hash := encode(digest(v_code, 'sha256'), 'hex');
  insert into public.barbershop_invite_codes (barbershop_id, code_hash, role, expires_at, created_by) values (v_barbershop_id, v_hash, p_role, v_expires, v_user);
  return query select v_code, v_expires, p_role;
end;
$$;

create or replace function public.join_barbershop_with_invite(p_code text)
returns table (barbershop_id uuid, role text)
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_user uuid := auth.uid(); v_hash text; v_invite public.barbershop_invite_codes%rowtype;
begin
  if v_user is null then raise exception 'not_authenticated' using errcode = '42501'; end if;
  if nullif(trim(p_code), '') is null then raise exception 'invalid_code' using errcode = '22023'; end if;
  v_hash := encode(digest(upper(trim(p_code)), 'sha256'), 'hex');
  select * into v_invite from public.barbershop_invite_codes where code_hash = v_hash and used_at is null and expires_at > now() order by created_at desc limit 1 for update;
  if not found then raise exception 'invalid_or_expired_code' using errcode = '22023'; end if;
  update public.users set barbershop_id = v_invite.barbershop_id, role = v_invite.role where id = v_user;
  if not found then raise exception 'user_profile_not_found' using errcode = 'P0002'; end if;
  update public.barbershop_invite_codes set used_at = now(), used_by = v_user where id = v_invite.id;
  return query select v_invite.barbershop_id, v_invite.role;
end;
$$;

revoke all on function public.create_barbershop_invite_code(text) from public, anon, authenticated;
grant execute on function public.create_barbershop_invite_code(text) to authenticated;
revoke all on function public.join_barbershop_with_invite(text) from public, anon, authenticated;
grant execute on function public.join_barbershop_with_invite(text) to authenticated;
revoke all on table public.barbershop_invite_codes from anon, authenticated;
comment on table public.barbershop_invite_codes is 'Single-use onboarding codes for joining a barbershop; codes expire after 10 minutes.';
