-- New barbershops start without any forced weekly day off.
-- Existing data is intentionally left unchanged.
alter table public.barbershops
  alter column closed_days set default '';

alter table public.shops
  alter column closed_days set default '';

-- Public reviews are submitted through a validated RPC so anonymous clients
-- cannot directly mutate the reviews table or the aggregate shop statistics.
create or replace function public.submit_public_review(
  p_shop_id uuid,
  p_client_name text,
  p_rating integer,
  p_comment text default null
)
returns public.reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  v_review public.reviews;
  v_name text := left(trim(coalesce(p_client_name, '')), 120);
  v_comment text := nullif(left(trim(coalesce(p_comment, '')), 2000), '');
begin
  if p_shop_id is null then
    raise exception using errcode = '22023', message = 'REVIEW_SHOP_REQUIRED';
  end if;

  if v_name = '' then
    raise exception using errcode = '22023', message = 'REVIEW_NAME_REQUIRED';
  end if;

  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception using errcode = '22023', message = 'REVIEW_RATING_INVALID';
  end if;

  if not exists (
    select 1
    from public.shops s
    join public.barbershops b on b.id = s.barbershop_id
    where s.id = p_shop_id
      and s.is_active = true
      and coalesce(b.is_public_in_directory, true) = true
  ) then
    raise exception using errcode = '42501', message = 'REVIEW_SHOP_NOT_AVAILABLE';
  end if;

  insert into public.reviews (barbershop_id, client_name, rating, comment)
  values (p_shop_id, v_name, p_rating, v_comment)
  returning * into v_review;

  return v_review;
end;
$$;

revoke all on function public.submit_public_review(uuid, text, integer, text) from public, anon, authenticated;
grant execute on function public.submit_public_review(uuid, text, integer, text) to anon, authenticated;

-- Review aggregates are maintained in the database, not by the browser.
create or replace function public.sync_shop_review_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop_id uuid;
begin
  v_shop_id := coalesce(new.barbershop_id, old.barbershop_id);

  update public.shops s
  set rating = coalesce(stats.rating_avg, 0),
      reviews_count = coalesce(stats.review_count, 0),
      updated_at = now()
  from (
    select
      r.barbershop_id,
      round(avg(r.rating)::numeric, 1) as rating_avg,
      count(*)::integer as review_count
    from public.reviews r
    where r.barbershop_id = v_shop_id
    group by r.barbershop_id
  ) stats
  where s.id = v_shop_id;

  if not found then
    update public.shops
    set rating = 0,
        reviews_count = 0,
        updated_at = now()
    where id = v_shop_id;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_sync_shop_review_stats on public.reviews;
create trigger trg_sync_shop_review_stats
after insert or update or delete on public.reviews
for each row execute function public.sync_shop_review_stats();

-- Anonymous/public review creation must go through the RPC above.
drop policy if exists "reviews_public_insert" on public.reviews;
drop policy if exists "Criar avaliações publicamente" on public.reviews;
revoke insert, update, delete on public.reviews from anon, authenticated;

-- Keep public read access for the public barbershop page.
drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read"
  on public.reviews for select to anon, authenticated
  using (true);

-- Re-sync existing shop aggregates once when this migration is applied.
update public.shops s
set rating = coalesce(stats.rating_avg, 0),
    reviews_count = coalesce(stats.review_count, 0),
    updated_at = now()
from (
  select
    r.barbershop_id,
    round(avg(r.rating)::numeric, 1) as rating_avg,
    count(*)::integer as review_count
  from public.reviews r
  group by r.barbershop_id
) stats
where s.id = stats.barbershop_id;

update public.shops
set rating = 0,
    reviews_count = 0,
    updated_at = now()
where id not in (select distinct barbershop_id from public.reviews);
