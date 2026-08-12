-- Securely link the authenticated user to a newly created barbershop.
-- This is intentionally narrow: it can only modify auth.uid()'s own user row,
-- only when that row is not already attached to a barbershop.

create or replace function public.complete_barbershop_onboarding(
  p_barbershop_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if p_barbershop_id is null then
    raise exception 'barbershop id is required';
  end if;

  if not exists (
    select 1
    from public.barbershops b
    where b.id = p_barbershop_id
  ) then
    raise exception 'barbershop not found';
  end if;

  if exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.barbershop_id is not null
  ) then
    raise exception 'user already belongs to a barbershop';
  end if;

  update public.users
  set barbershop_id = p_barbershop_id,
      role = 'owner'
  where id = auth.uid();

  if not found then
    raise exception 'user profile not found';
  end if;
end;
$$;

revoke all on function public.complete_barbershop_onboarding(uuid) from public;
grant execute on function public.complete_barbershop_onboarding(uuid) to authenticated;
