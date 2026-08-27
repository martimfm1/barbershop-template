begin;

-- Keep high-frequency booking completion inside Postgres so it does not depend
-- on Vercel Cron frequency limits (Hobby plans allow only daily schedules).
create extension if not exists pg_cron;

-- A stable job name makes this migration idempotent: pg_cron replaces an
-- existing job with the same name when cron.schedule is called again.
select cron.schedule(
  'silentra-booking-completion',
  '*/10 * * * *',
  $$select public.process_automatic_booking_completion();$$
);

commit;
