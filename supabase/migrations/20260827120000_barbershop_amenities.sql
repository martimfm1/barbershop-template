begin;

alter table public.shops
  add column if not exists amenities jsonb not null default '{}'::jsonb;

comment on column public.shops.amenities is
  'Structured public-facing barbershop amenities and accessibility information.';

commit;
