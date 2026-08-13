-- The avatar upload RPC and dashboard read from barbershops.avatar_url.
-- Keep this column nullable so existing barbershops remain valid.
alter table public.barbershops
  add column if not exists avatar_url text;

comment on column public.barbershops.avatar_url is
  'Public Supabase Storage URL for the barbershop avatar.';
