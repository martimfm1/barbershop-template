begin;

alter table public.barbershops
  add column if not exists custom_slug text,
  add column if not exists public_profile_enabled boolean not null default true,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists og_image_url text,
  add column if not exists theme_config jsonb not null default '{}'::jsonb,
  add column if not exists public_profile_updated_at timestamptz not null default now();

create unique index if not exists barbershops_custom_slug_unique_idx
  on public.barbershops (lower(custom_slug))
  where custom_slug is not null;

create table if not exists public.barbershop_slug_redirects (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  old_slug text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists barbershop_slug_redirects_unique_idx
  on public.barbershop_slug_redirects (barbershop_id, lower(old_slug));

create index if not exists barbershop_slug_redirects_lookup_idx
  on public.barbershop_slug_redirects (lower(old_slug));

alter table public.barbershop_slug_redirects enable row level security;
revoke all on public.barbershop_slug_redirects from public, anon, authenticated;

comment on column public.barbershops.custom_slug is 'Owner-selected public slug. Feature-gated to Pro and Enterprise server-side.';
comment on column public.barbershops.public_profile_enabled is 'Controls whether the public barbershop profile is visible.';
comment on column public.barbershops.seo_title is 'Enterprise/custom SEO title override for the public profile.';
comment on column public.barbershops.seo_description is 'Enterprise/custom SEO description override for the public profile.';
comment on column public.barbershops.og_image_url is 'Enterprise/custom Open Graph image URL.';
comment on column public.barbershops.theme_config is 'Enterprise public-profile presentation settings. Must be validated server-side.';

commit;
