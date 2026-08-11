-- Birthday email automation for Pro and Enterprise.
-- Clients are users with role = 'client'.

alter table public.users
  add column if not exists birth_date date;

create index if not exists idx_users_client_birth_date
  on public.users (barbershop_id, birth_date)
  where role = 'client' and birth_date is not null;

create table if not exists public.birthday_email_automations (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  enabled boolean not null default false,
  subject text not null default 'Feliz aniversário, {{nome}}! 🎉',
  body text not null default E'Olá {{nome}},\n\nToda a equipa da {{barbearia}} deseja-te um excelente aniversário! 🎉\n\nEsperamos voltar a ver-te em breve.\n\nUm abraço,\n{{barbearia}}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (barbershop_id),
  constraint birthday_email_subject_length check (char_length(subject) between 1 and 180),
  constraint birthday_email_body_length check (char_length(body) between 1 and 8000)
);

create table if not exists public.birthday_email_logs (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  client_id uuid not null references public.users(id) on delete cascade,
  birthday_date date not null,
  email text not null,
  status text not null check (status in ('sent', 'failed')),
  provider_message_id text,
  error_message text,
  sent_at timestamptz not null default now(),
  unique (barbershop_id, client_id, birthday_date)
);

create index if not exists idx_birthday_automations_enabled
  on public.birthday_email_automations (enabled, barbershop_id);

create index if not exists idx_birthday_logs_date
  on public.birthday_email_logs (birthday_date, status);

alter table public.birthday_email_automations enable row level security;
alter table public.birthday_email_logs enable row level security;

-- The application accesses these tables through authenticated server-side routes
-- and the service role for the daily worker. No direct client-table access is granted.
revoke all on public.birthday_email_automations from anon, authenticated;
revoke all on public.birthday_email_logs from anon, authenticated;

drop trigger if exists birthday_email_automations_updated_at on public.birthday_email_automations;
create trigger birthday_email_automations_updated_at
before update on public.birthday_email_automations
for each row execute function public.set_updated_at();
