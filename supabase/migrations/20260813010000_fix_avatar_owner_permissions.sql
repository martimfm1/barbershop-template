-- Fix avatar metadata validation to match the existing `avatars` Storage bucket.
-- Public URL shape:
-- /storage/v1/object/public/avatars/avatar/{barbershop_id}/avatar.webp

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
      and u.role in ('owner', 'admin')
  ) then
    raise exception 'avatar update not permitted';
  end if;

  if p_avatar_url !~ ('/storage/v1/object/public/avatars/avatar/' || p_barbershop_id::text || '/avatar\\.webp($|[?])') then
    raise exception 'invalid avatar url';
  end if;

  update public.barbershops
  set avatar_url = p_avatar_url,
      updated_at = now()
  where id = p_barbershop_id;

  if not found then
    raise exception 'barbershop not found';
  end if;
end;
$$;

revoke all on function public.set_barbershop_avatar_url(uuid, text) from public;
grant execute on function public.set_barbershop_avatar_url(uuid, text) to authenticated;
