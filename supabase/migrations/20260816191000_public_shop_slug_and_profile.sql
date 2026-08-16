begin;

alter table public.shops
  add column if not exists custom_slug text,
  add column if not exists public_profile_enabled boolean not null default true,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists og_image_url text,
  add column if not exists theme_config jsonb not null default '{}'::jsonb,
  add column if not exists public_profile_updated_at timestamptz not null default now();

create unique index if not exists shops_custom_slug_unique_idx
  on public.shops (lower(custom_slug))
  where custom_slug is not null;

create table if not exists public.shop_slug_redirects (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  old_slug text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists shop_slug_redirects_unique_idx
  on public.shop_slug_redirects (shop_id, lower(old_slug));

create index if not exists shop_slug_redirects_lookup_idx
  on public.shop_slug_redirects (lower(old_slug));

alter table public.shop_slug_redirects enable row level security;
revoke all on public.shop_slug_redirects from public, anon, authenticated;

comment on column public.shops.custom_slug is 'Owner-selected canonical public slug. Applied to the public URL for Pro and Enterprise owners.';
comment on column public.shops.public_profile_enabled is 'Controls public visibility of the shop profile.';
comment on column public.shops.seo_title is 'Optional enterprise SEO title override.';
comment on column public.shops.seo_description is 'Optional enterprise SEO description override.';
comment on column public.shops.og_image_url is 'Optional enterprise Open Graph image.';
comment on column public.shops.theme_config is 'Validated enterprise public-profile theme configuration.';

commit;
