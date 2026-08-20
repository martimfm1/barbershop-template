-- Loyalty activation is explicit for new barbershops.
-- Existing rows are preserved so an owner who already enabled the programme
-- does not get unexpectedly disabled.
alter table public.loyalty_settings
  alter column enabled set default false;
