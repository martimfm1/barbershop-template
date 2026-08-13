begin;

create table if not exists public.booking_portal_verifications (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0 check (attempts >= 0 and attempts <= 8),
  requested_at timestamptz not null default now(),
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists booking_portal_verifications_email_idx
  on public.booking_portal_verifications (lower(email), requested_at desc);

create table if not exists public.booking_portal_sessions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists booking_portal_sessions_email_idx
  on public.booking_portal_sessions (lower(email), expires_at desc);

create index if not exists booking_portal_sessions_expires_idx
  on public.booking_portal_sessions (expires_at);

alter table public.booking_portal_verifications enable row level security;
alter table public.booking_portal_sessions enable row level security;

revoke all on public.booking_portal_verifications from public, anon, authenticated;
revoke all on public.booking_portal_sessions from public, anon, authenticated;

comment on table public.booking_portal_verifications is 'Short-lived hashed email verification codes for the public booking portal.';
comment on table public.booking_portal_sessions is 'HttpOnly-session backing records for verified public booking portal access.';

commit;
