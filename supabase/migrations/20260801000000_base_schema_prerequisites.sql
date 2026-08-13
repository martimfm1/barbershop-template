-- Baseline prerequisites for local/clean database rebuilds.
-- The original project schema predates the retained migration history. These
-- definitions are deliberately idempotent, so applying them to an existing
-- production database is a no-op while a fresh local database can build the
-- later tenant migrations deterministically.

do $$
begin
  create type public.appointment_status as enum (
    'pending', 'scheduled', 'completed', 'cancelled'
  );
exception when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.whatsapp_bot_status as enum (
    'NOT_INITIALIZED', 'INITIALIZING', 'qr', 'CONNECTED', 'DISCONNECTED', 'ERROR'
  );
exception when duplicate_object then null;
end;
$$;

create table if not exists public.barbershops (
  id uuid primary key default gen_random_uuid(),
  name varchar(255) not null,
  phone varchar(50),
  address text,
  opening_time time,
  closing_time time,
  closed_days text default 'None',
  allow_online_bookings boolean default true,
  auto_reminders boolean default false,
  time_limit_cancellation_hours integer default 24,
  created_at timestamptz default now(),
  slug text,
  whatsapp_status public.whatsapp_bot_status not null default 'NOT_INITIALIZED',
  updated_at timestamptz,
  lunch_start time,
  lunch_end time,
  is_public_in_directory boolean not null default true,
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.users (
  id uuid primary key,
  barbershop_id uuid references public.barbershops(id) on delete cascade,
  name_complete varchar(150) not null,
  num_phone varchar(25),
  email varchar(255),
  style_notes text,
  created_at timestamptz not null default now(),
  role text default 'barber',
  name text default 'user',
  birth_date date
);

do $baseline$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'get_my_barbershop_id'
      and p.pronargs = 0
  ) then
    execute $function$
      create function public.get_my_barbershop_id()
      returns uuid
      language sql
      stable
      security definer
      set search_path = public
      as $body$
        select u.barbershop_id from public.users u where u.id = auth.uid() limit 1;
      $body$
    $function$;
    revoke all on function public.get_my_barbershop_id() from public;
    grant execute on function public.get_my_barbershop_id() to authenticated;
  end if;
end;
$baseline$;

create table if not exists public.professionals (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  name varchar(255) not null,
  commission_percentage integer default 50,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  name varchar(255) not null,
  price numeric(10,2) not null,
  duration integer not null,
  created_at timestamptz default now(),
  popular boolean default false
);

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null unique references public.barbershops(id) on delete cascade,
  city text not null,
  price numeric(10,2) not null default 0,
  tags text[] default '{}',
  lat double precision default 0,
  lng double precision default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  slug text unique,
  name text,
  phone text,
  address text,
  opening_time time,
  closing_time time,
  lunch_start time,
  lunch_end time,
  closed_days text default 'domingo',
  popular_service_id uuid references public.services(id) on delete set null,
  rating numeric(3,2) default 0,
  reviews_count integer default 0
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  client_id uuid references public.users(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  professional_id uuid references public.professionals(id) on delete set null,
  date_hour timestamptz not null,
  status public.appointment_status not null default 'scheduled',
  manual_name varchar(255),
  manual_phone varchar(50),
  value_products numeric(10,2) default 0,
  description_products text,
  payment_method varchar(50),
  created_at timestamptz default now(),
  manual_email varchar(255),
  management_token uuid default gen_random_uuid(),
  management_token_expires_at timestamptz default now() + interval '24 hours',
  email_verified boolean default false,
  email_verified_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  manual_birth_date date
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb,
  created_at timestamptz default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.shops(id) on delete cascade,
  client_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

create table if not exists public.schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  professional_id uuid not null references public.professionals(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  reason text,
  created_at timestamptz default now()
);
