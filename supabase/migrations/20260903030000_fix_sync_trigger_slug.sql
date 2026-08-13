-- The sync trigger copies NEW.slug from barbershops into shops, but
-- barbershops has no slug column. NEW.slug is therefore always NULL and
-- violates shops.slug NOT NULL on every barbershop UPDATE (e.g. avatar).
-- The slug is canonical on shops; drop it from the sync trigger.

create or replace function public.sync_barbershop_details_to_shops()
returns trigger
language plpgsql
as $$
begin
  update public.shops
  set
    name = new.name,
    phone = new.phone,
    address = new.address,
    opening_time = new.opening_time,
    closing_time = new.closing_time,
    lunch_start = new.lunch_start,
    lunch_end = new.lunch_end,
    closed_days = new.closed_days,
    updated_at = now()
  where barbershop_id = new.id;

  return new;
end;
$$;