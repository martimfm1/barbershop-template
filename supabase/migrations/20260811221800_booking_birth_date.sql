-- Store the birth date supplied while creating a manual appointment.
-- This keeps the information available until the barber decides to add the
-- customer to the CRM, without changing the existing client model.
alter table public.appointments
  add column if not exists manual_birth_date date;

comment on column public.appointments.manual_birth_date is
  'Birth date supplied for a manual booking; copied to users.birth_date when the customer is added to the CRM.';
