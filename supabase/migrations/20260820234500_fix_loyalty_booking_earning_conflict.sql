begin;

create or replace function public.award_loyalty_points_for_appointment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.loyalty_members;
  v_rule public.loyalty_earning_rules;
  v_email text;
  v_points integer;
  v_existing boolean;
  v_client_id uuid;
begin
  -- Only award when an appointment transitions into completed.
  if new.status <> 'completed' or old.status = 'completed' then
    return new;
  end if;

  -- Loyalty must be explicitly enabled for the barbershop.
  select ls.enabled
    into v_existing
  from public.loyalty_settings ls
  where ls.barbershop_id = new.barbershop_id;

  if coalesce(v_existing, false) = false then
    return new;
  end if;

  -- Resolve the customer's email from either the manual booking fields or
  -- the authenticated client profile.
  v_email := lower(trim(coalesce(new.manual_email, '')));
  v_client_id := new.client_id;

  if v_email = '' and v_client_id is not null then
    select lower(trim(u.email))
      into v_email
    from public.users u
    where u.id = v_client_id
      and u.barbershop_id = new.barbershop_id;
  end if;

  if v_email is null or v_email = '' then
    return new;
  end if;

  -- Lock the loyalty member so concurrent completions cannot award the same
  -- booking twice.
  select lm.*
    into v_member
  from public.loyalty_members lm
  where lm.barbershop_id = new.barbershop_id
    and lower(lm.email) = v_email
    and lm.status = 'active'
  for update;

  if not found then
    return new;
  end if;

  select er.*
    into v_rule
  from public.loyalty_earning_rules er
  where er.barbershop_id = new.barbershop_id
    and er.service_id = new.service_id
    and er.active = true
  order by er.updated_at desc, er.created_at desc
  limit 1;

  if not found then
    return new;
  end if;

  v_points := v_rule.points;

  -- Idempotency without ON CONFLICT inference. The unique partial index still
  -- protects the database, while this explicit existence check works even if
  -- the index was created by an older migration or is not currently inferable.
  select exists (
    select 1
    from public.loyalty_member_transactions lmt
    where lmt.member_id = v_member.id
      and lmt.reference_id = new.id
      and lmt.type = 'booking'
  ) into v_existing;

  if v_existing then
    return new;
  end if;

  insert into public.loyalty_member_transactions (
    barbershop_id,
    member_id,
    points,
    type,
    reference_id,
    description
  ) values (
    new.barbershop_id,
    v_member.id,
    v_points,
    'booking',
    new.id,
    v_rule.name
  );

  update public.loyalty_members
  set points_balance = points_balance + v_points,
      updated_at = now()
  where id = v_member.id;

  perform public.sync_loyalty_legacy_account(v_member.id);

  return new;
exception
  when unique_violation then
    -- A concurrent worker may have inserted the same booking transaction
    -- between the explicit check and INSERT. Treat that as an idempotent hit.
    return new;
end;
$$;

drop trigger if exists loyalty_award_points_on_appointment on public.appointments;
create trigger loyalty_award_points_on_appointment
after update of status on public.appointments
for each row
execute function public.award_loyalty_points_for_appointment();

notify pgrst, 'reload schema';

commit;
