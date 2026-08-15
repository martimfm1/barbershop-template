begin;

create or replace function public.get_birthday_clients(
  p_barbershop_id uuid,
  p_month integer,
  p_day integer
)
returns table(
  id uuid,
  name_complete text,
  email text,
  birth_date date
)
language sql
stable
security definer
set search_path = public
as $$
  select
    u.id,
    u.name_complete,
    u.email,
    u.birth_date
  from public.users u
  where u.barbershop_id = p_barbershop_id
    and u.role = 'client'
    and u.email is not null
    and u.birth_date is not null
    and extract(month from u.birth_date) = p_month
    and extract(day from u.birth_date) = p_day;
$$;

revoke all on function public.get_birthday_clients(uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.get_birthday_clients(uuid, integer, integer) to service_role;

commit;
