-- Ensure every new public shop gets a canonical slug even when legacy
-- creation paths omit the slug column. This keeps the NOT NULL constraint
-- safe without requiring every caller to duplicate slug-generation logic.

create or replace function public.ensure_shop_slug()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base_slug text;
  v_candidate text;
begin
  if nullif(btrim(new.slug), '') is not null then
    new.slug := public.normalize_shop_slug(new.slug);
    return new;
  end if;

  v_base_slug := public.normalize_shop_slug(new.name);

  if v_base_slug = 'barbearia' and new.barbershop_id is not null then
    select public.normalize_shop_slug(b.name)
      into v_base_slug
    from public.barbershops b
    where b.id = new.barbershop_id;
  end if;

  v_base_slug := coalesce(nullif(v_base_slug, ''), 'barbearia');
  v_candidate := left(v_base_slug, 80) || '-' || substr(replace(coalesce(new.id, gen_random_uuid())::text, '-', ''), 1, 8);

  new.slug := v_candidate;
  return new;
end;
$$;

drop trigger if exists shops_ensure_slug_before_insert on public.shops;

create trigger shops_ensure_slug_before_insert
before insert on public.shops
for each row
execute function public.ensure_shop_slug();

revoke all on function public.ensure_shop_slug() from public;
