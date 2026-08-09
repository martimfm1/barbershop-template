-- Locations are the tenant's physical operating sites.
-- The existing barbershop is represented as the first location during migration.

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  name varchar(160) not null,
  phone varchar(40),
  address text,
  city text,
  opening_time time,
  closing_time time,
  lunch_start time,
  lunch_end time,
  closed_days text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists locations_barbershop_idx
  on public.locations (barbershop_id);

create unique index if not exists locations_barbershop_name_idx
  on public.locations (barbershop_id, lower(name));

-- Backfill one location for every existing barbershop.
insert into public.locations (
  barbershop_id, name, phone, address, opening_time, closing_time,
  lunch_start, lunch_end, closed_days
)
select
  b.id,
  b.name,
  b.phone,
  b.address,
  b.opening_time,
  b.closing_time,
  b.lunch_start,
  b.lunch_end,
  b.closed_days
from public.barbershops b
where not exists (
  select 1 from public.locations l where l.barbershop_id = b.id
);

alter table public.locations enable row level security;

drop policy if exists "Public can read active locations" on public.locations;
create policy "Public can read active locations"
  on public.locations for select to anon, authenticated
  using (is_active = true);

-- All mutations go through the server-side locations API. This prevents the
-- browser from bypassing plan quotas by writing directly with Supabase.
drop policy if exists "Staff can insert locations" on public.locations;
drop policy if exists "Staff can update locations" on public.locations;
drop policy if exists "Staff can delete locations" on public.locations;

-- Server-side helper used by the API. It derives the caller's tenant and plan
-- from the existing subscription row. Free is the safe fallback.
create or replace function public.create_location_with_quota(
  p_user_id uuid,
  p_barbershop_id uuid,
  p_name varchar,
  p_phone varchar default null,
  p_address text default null,
  p_city text default null,
  p_opening_time time default null,
  p_closing_time time default null
)
returns public.locations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan public.subscription_plan := 'free';
  v_limit integer := 1;
  v_count integer;
  v_location public.locations;
begin
  if auth.role() <> 'service_role' and auth.uid() is distinct from p_user_id then
    raise exception 'forbidden:invalid_user';
  end if;

  if not exists (
    select 1 from public.users u
    where u.id = p_user_id
      and u.barbershop_id = p_barbershop_id
      and coalesce(u.role, '') in ('admin', 'owner')
  ) then
    raise exception 'forbidden:barbershop_access';
  end if;

  select s.plan into v_plan
  from public.subscriptions s
  where s.user_id = p_user_id
    and s.status in ('active', 'trialing')
    and s.plan in ('pro', 'enterprise')
  order by s.updated_at desc
  limit 1;

  if v_plan = 'pro' then
    v_limit := 1;
  elsif v_plan = 'enterprise' then
    v_limit := null;
  else
    v_plan := 'free';
    v_limit := 1;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_barbershop_id::text || ':locations', 0));

  select count(*) into v_count
  from public.locations
  where barbershop_id = p_barbershop_id;

  if v_limit is not null and v_count >= v_limit then
    raise exception 'quota_exceeded|locations|%|%|%|enterprise', v_count, v_limit, v_plan;
  end if;

  insert into public.locations (
    barbershop_id, name, phone, address, city, opening_time, closing_time
  ) values (
    p_barbershop_id, trim(p_name), p_phone, p_address, p_city, p_opening_time, p_closing_time
  ) returning * into v_location;

  return v_location;
end;
$$;

revoke all on function public.create_location_with_quota(uuid, uuid, varchar, varchar, text, text, time, time) from public;
grant execute on function public.create_location_with_quota(uuid, uuid, varchar, varchar, text, text, time, time) to authenticated, service_role;

-- Existing direct writes to locations are intentionally unavailable to clients.
revoke all on table public.locations from anon, authenticated;
grant select on table public.locations to anon, authenticated;
grant select, insert, update, delete on table public.locations to service_role;

create index if not exists subscriptions_user_plan_status_idx
  on public.subscriptions (user_id, plan, status, updated_at desc);
