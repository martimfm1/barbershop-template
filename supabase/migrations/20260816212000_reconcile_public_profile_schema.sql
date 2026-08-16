begin;

-- Production safety: the public profile code relies on these columns being
-- present on shops. Keep this migration idempotent so it safely repairs a
-- database whose migration history and physical schema have drifted apart.
alter table public.shops
  add column if not exists slug text,
  add column if not exists custom_slug text,
  add column if not exists public_profile_enabled boolean not null default true,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists og_image_url text,
  add column if not exists theme_config jsonb not null default '{}'::jsonb,
  add column if not exists public_profile_updated_at timestamptz not null default now();

-- Keep the existing public URL stable for shops that were created before the
-- public-profile schema was introduced.
update public.shops s
set slug = b.slug
from public.barbershops b
where s.barbershop_id = b.id
  and (s.slug is null or b.slug is not null and lower(s.slug) <> lower(b.slug));

-- Custom slugs are intentionally unique only when present.
create unique index if not exists shops_custom_slug_unique_idx
  on public.shops (lower(custom_slug))
  where custom_slug is not null;

create index if not exists shops_slug_lookup_idx
  on public.shops (lower(slug));

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

grant select, insert, update, delete on public.shops to authenticated;

after? 

commit;
