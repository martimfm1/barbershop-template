alter table public.subscriptions
  add column if not exists plan_override text null;

alter table public.subscriptions
  drop constraint if exists subscriptions_plan_override_check;

alter table public.subscriptions
  add constraint subscriptions_plan_override_check
  check (plan_override is null or plan_override in ('free', 'pro', 'enterprise'));

comment on column public.subscriptions.plan_override is
  'Optional admin/support override for the effective billing plan. Managed directly in Supabase; null means Stripe/local plan resolution is used.';
