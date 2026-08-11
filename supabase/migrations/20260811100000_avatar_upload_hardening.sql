-- Harden barbershop avatar updates performed after Storage uploads.
-- The client never receives service_role privileges; the function is narrowly
-- scoped to the authenticated admin of the target barbershop.

create or replace function public.set_barbershop_avatar_url(
  p_barbershop_id uuid,
  p_avatar_url text
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

  if p_barbershop_id is null or p_avatar_url is null or btrim(p_avatar_url) = '' then
    raise exception 'invalid avatar update';
  end if;

  if not exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.barbershop_id = p_barbershop_id
      and u.role = 'admin'
  ) then
    raise exception 'avatar update not permitted';
  end if;

  -- Only accept the public Supabase Storage URL for this tenant's avatar.
  if p_avatar_url !~ ('/storage/v1/object/public/avatar/' || p_barbershop_id::text || '/avatar\.webp($|[?])') then
    raise exception 'invalid avatar url';
  end if;

  update public.barbershops
  set avatar_url = p_avatar_url,
      updated_at = now()
  where id = p_barbershop_id;
end;
$$;

revoke all on function public.set_barbershop_avatar_url(uuid, text) from public;
grant execute on function public.set_barbershop_avatar_url(uuid, text) to authenticated;
