begin;

-- Loyalty is opt-in. New settings rows are disabled unless the owner
-- explicitly enables the programme from the dashboard.
alter table public.loyalty_settings
  alter column enabled set default false;

-- Make the public/transactional source of truth explicit for existing rows:
-- do not change an owner's explicit choice, only preserve the new default.

create or replace function public.award_loyalty_points_for_appointment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings public.loyalty_settings;
  v_rule public.loyalty_earning_rules;
  v_member public.loyalty_members;
  v_email text;
  v_inserted uuid;
begin
  -- Only award once, when the appointment actually changes to completed.
  if new.status <> 'completed' or old.status = 'completed' then
    return new;
  end if;

  -- Never award while the programme is disabled.
  select * into v_settings
  from public.loyalty_settings
  where barbershop_id = new.barbershop_id
    and enabled = true;

  if not found then
    return new;
  end if;

  -- Resolve the customer's email from the booking first, then fall back
  -- to the linked client account. This covers both guest/manual bookings
  -- and authenticated customer bookings.
  v_email := lower(trim(coalesce(new.manual_email, '')));

  if v_email = '' and new.client_id is not null then
    select lower(trim(u.email))
      into v_email
    from public.users u
    where u.id = new.client_id
      and u.barbershop_id = new.barbershop_id;
  end if;

  if v_email is null or v_email = '' then
    return new;
  end if;

  select * into v_member
  from public.loyalty_members
  where barbershop_id = new.barbershop_id
    and lower(email) = v_email
    and status = 'active'
  for update;

  if not found then
    return new;
  end if;

  -- Only an active earning rule for the completed service can award points.
  select * into v_rule
  from public.loyalty_earning_rules
  where barbershop_id = new.barbershop_id
    and service_id = new.service_id
    and active = true
  order by updated_at desc, created_at desc
  limit 1;

  if not found or v_rule.points <= 0 then
    return new;
  end if;

  -- The partial unique index created by the loyalty enrollment migration
  -- makes this idempotent per member + appointment.
  insert into public.loyalty_member_transactions (
    barbershop_id,
    member_id,
    points,
    type,
    reference_id,
    description
  )
  values (
    new.barbershop_id,
    v_member.id,
    v_rule.points,
    'booking',
    new.id,
    v_rule.name
  )
  on conflict (member_id, reference_id) where type = 'booking'
  do nothing
  returning id into v_inserted;

  if v_inserted is null then
    return new;
  end if;

  update public.loyalty_members
  set points_balance = points_balance + v_rule.points,
      updated_at = now()
  where id = v_member.id;

  -- Keep the legacy account in sync when that table exists.
  begin
    update public.loyalty_accounts
    set points_balance = points_balance + v_rule.points,
        lifetime_points = lifetime_points + v_rule.points,
        updated_at = now()
    where barbershop_id = new.barbershop_id
      and client_id = new.client_id;
  exception
    when undefined_table then
      null;
  end;

  return new;
end;
$$;

drop trigger if exists loyalty_award_points_on_appointment on public.appointments;
create trigger loyalty_award_points_on_appointment
after update of status on public.appointments
for each row
execute function public.award_loyalty_points_for_appointment();

revoke all on function public.award_loyalty_points_for_appointment() from public, anon, authenticated;
grant execute on function public.award_loyalty_points_for_appointment() to service_role;

commit;
