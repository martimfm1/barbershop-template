-- Public booking rate limit.
-- Stores only an application-generated opaque key; raw client IPs are never persisted.

create table if not exists public.public_rate_limit_buckets (
  key text primary key,
  window_started_at timestamptz not null,
  hit_count integer not null default 0,
  updated_at timestamptz not null default now()
);

revoke all on public.public_rate_limit_buckets from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_proc where proname = 'consume_public_rate_limit') then
    create function public.consume_public_rate_limit(
      p_key text,
      p_limit integer,
      p_window_seconds integer
    )
    returns boolean
    language plpgsql
    security definer
    set search_path = public
    as $fn$
    declare
      v_now timestamptz := now();
      v_row public.public_rate_limit_buckets%rowtype;
    begin
      if p_key is null or length(p_key) < 16 then
        raise exception 'invalid rate limit key';
      end if;
      if p_limit <= 0 or p_window_seconds <= 0 then
        raise exception 'invalid rate limit configuration';
      end if;

      perform pg_advisory_xact_lock(hashtextextended(p_key, 0));

      select * into v_row
      from public.public_rate_limit_buckets
      where key = p_key
      for update;

      if not found or v_now >= v_row.window_started_at + make_interval(secs => p_window_seconds) then
        insert into public.public_rate_limit_buckets (key, window_started_at, hit_count, updated_at)
        values (p_key, v_now, 1, v_now)
        on conflict (key) do update
          set window_started_at = excluded.window_started_at,
              hit_count = 1,
              updated_at = excluded.updated_at;
        return true;
      end if;

      if v_row.hit_count >= p_limit then
        update public.public_rate_limit_buckets
        set updated_at = v_now
        where key = p_key;
        return false;
      end if;

      update public.public_rate_limit_buckets
      set hit_count = hit_count + 1,
          updated_at = v_now
      where key = p_key;
      return true;
    end;
    $fn$;
  end if;
end $$;

revoke all on function public.consume_public_rate_limit(text, integer, integer) from public, anon, authenticated;

comment on table public.public_rate_limit_buckets is 'Opaque server-side rate limit buckets for public endpoints; raw IP addresses must never be stored.';

create index if not exists public_rate_limit_buckets_updated_at_idx
  on public.public_rate_limit_buckets(updated_at);
