begin;

create or replace function public.admin_find_loyalty_member_by_email(p_email text)
returns table (
  member_id uuid,
  member_email text,
  member_name text,
  points_balance integer,
  status text,
  barbershop_id uuid,
  barbershop_name text,
  barbershop_slug text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
begin
  if v_email = '' or length(v_email) > 254 then
    raise exception 'LOYALTY_EMAIL_INVALID';
  end if;

  return query
  select
    lm.id::uuid,
    lm.email::text,
    lm.name::text,
    lm.points_balance::integer,
    lm.status::text,
    lm.barbershop_id::uuid,
    b.name::text,
    b.slug::text
  from public.loyalty_members as lm
  join public.barbershops as b on b.id = lm.barbershop_id
  where lower(lm.email) = v_email
    and lm.status = 'active'
  order by lm.updated_at desc
  limit 1;
end;
$$;

revoke all on function public.admin_find_loyalty_member_by_email(text) from public, anon, authenticated;
grant execute on function public.admin_find_loyalty_member_by_email(text) to service_role;

notify pgrst, 'reload schema';

commit;
