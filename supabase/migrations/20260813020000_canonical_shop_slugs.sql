-- Canonical public URLs for marketplace shops.
-- Every shop gets a stable, human-readable unique slug.

create or replace function public.normalize_shop_slug(value text)
returns text
language sql
immutable
as $$
  select coalesce(
    nullif(
      trim(both '-' from regexp_replace(
        regexp_replace(
          lower(
            translate(
              coalesce(value, ''),
              'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
              'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
            )
          ),
          '[^a-z0-9]+', '-', 'g'
        ),
        '(^-|-$)', '', 'g'
      )),
      ''
    ),
    'barbearia'
  );
$$;

-- Repair missing/invalid slugs before enforcing uniqueness.
update public.shops
set slug = public.normalize_shop_slug(name) || '-' || substr(id::text, 1, 8)
where slug is null or btrim(slug) = '';

-- Normalize existing values while preserving their public identity where possible.
update public.shops
set slug = public.normalize_shop_slug(slug)
where slug is not null
  and public.normalize_shop_slug(slug) <> slug;

-- Resolve collisions deterministically.
with duplicates as (
  select id,
         slug,
         row_number() over (partition by lower(slug) order by created_at nulls last, id) as position
  from public.shops
  where slug is not null
)
update public.shops s
set slug = d.slug || '-' || substr(s.id::text, 1, 8)
from duplicates d
where s.id = d.id
  and d.position > 1;

create unique index if not exists shops_slug_lower_uidx
  on public.shops (lower(slug));

alter table public.shops
  alter column slug set not null;

comment on column public.shops.slug is 'Canonical public URL slug. Unique case-insensitively; used by /barbershops/[slug].';
