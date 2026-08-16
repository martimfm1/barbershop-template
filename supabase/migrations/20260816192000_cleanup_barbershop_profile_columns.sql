begin;

alter table if exists public.barbershops
  drop column if exists custom_slug,
  drop column if exists public_profile_enabled,
  drop column if exists seo_title,
  drop column if exists seo_description,
  drop column if exists og_image_url,
  drop column if exists theme_config,
  drop column if exists public_profile_updated_at;

drop table if exists public.barbershop_slug_redirects;

commit;
