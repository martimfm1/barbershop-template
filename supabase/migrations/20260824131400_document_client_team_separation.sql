begin;

comment on table public.users is 'Authentication profiles, including both CRM clients (role=client) and barbershop team members (non-client roles). Client records must not be treated as team seats.';

commit;
