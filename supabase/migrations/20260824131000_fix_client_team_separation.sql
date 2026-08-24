begin;

-- CRM clients share public.users with authenticated team members, but clients
-- must never be treated as team seats. Keep the distinction explicit at the DB layer.
create or replace function public.get_effective_team_member_count(p_barbershop_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.users
  where barbershop_id = p_barbershop_id
    and coalesce(lower(role), 'client') <> 'client';
$$;

revoke all on function public.get_effective_team_member_count(uuid) from public, anon;
grant execute on function public.get_effective_team_member_count(uuid) to authenticated;

commit;
