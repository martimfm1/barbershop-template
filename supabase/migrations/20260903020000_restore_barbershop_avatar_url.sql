-- The avatar upload RPC and dashboard read from barbershops.avatar_url.
-- The previous migration (20260813030000) was recorded as applied but the
-- column is missing from the remote schema cache. Re-add it idempotently.
alter table public.barbershops
  add column if not exists avatar_url text;

comment on column public.barbershops.avatar_url is
  'Public Supabase Storage URL for the barbershop avatar.';