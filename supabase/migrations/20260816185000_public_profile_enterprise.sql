begin;

alter table public.shops
  add column if not exists custom_slug text,
  add column if not exists public_profile_enabled boolean not null default true,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists og_image_url text,
  add column if not exists theme_config jsonb not null default '{}'::jsonb,
  add column if not exists public_profile_updated_at timestamptz;

create unique index if not exists shops_custom_slug_unique_idx
  on public.shops (custom_slug)
  where custom_slug is not null;

create table if not exists public.shop_slug_redirects (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  old_slug text not null,
  created_at timestamptz not null default now(),
  unique (shop_id, old_slug),
  unique (old_slug)
);

create index if not exists shop_slug_redirects_shop_idx
  on public.shop_slug_redirects (shop_id);

alter table public.shop_slug_redirects enable row level security;
revoke all on public.shop_slug_redirects from public, anon, authenticated;

commit;
