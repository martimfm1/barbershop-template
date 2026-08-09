create table if not exists public.client_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete restrict,
  content text not null check (char_length(trim(content)) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists client_notes_tenant_idx on public.client_notes(barbershop_id, client_id, created_at desc);

create table if not exists public.client_tags (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 50),
  created_at timestamptz not null default now(),
  unique(barbershop_id, name)
);

create table if not exists public.client_tag_assignments (
  client_id uuid not null references public.users(id) on delete cascade,
  tag_id uuid not null references public.client_tags(id) on delete cascade,
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(client_id, tag_id)
);

create index if not exists client_tag_assignments_tenant_idx on public.client_tag_assignments(barbershop_id, client_id);

alter table public.client_notes enable row level security;
alter table public.client_tags enable row level security;
alter table public.client_tag_assignments enable row level security;

create or replace function public.is_barbershop_staff(target_barbershop_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.barbershop_id = target_barbershop_id
      and coalesce(u.role, 'staff') in ('admin', 'owner', 'staff')
  );
$$;

create policy client_notes_staff_select on public.client_notes for select to authenticated using (public.is_barbershop_staff(barbershop_id));
create policy client_notes_staff_insert on public.client_notes for insert to authenticated with check (public.is_barbershop_staff(barbershop_id) and author_id = auth.uid());
create policy client_notes_staff_update on public.client_notes for update to authenticated using (public.is_barbershop_staff(barbershop_id)) with check (public.is_barbershop_staff(barbershop_id));
create policy client_notes_staff_delete on public.client_notes for delete to authenticated using (public.is_barbershop_staff(barbershop_id));

create policy client_tags_staff_select on public.client_tags for select to authenticated using (public.is_barbershop_staff(barbershop_id));
create policy client_tags_staff_insert on public.client_tags for insert to authenticated with check (public.is_barbershop_staff(barbershop_id));
create policy client_tags_staff_update on public.client_tags for update to authenticated using (public.is_barbershop_staff(barbershop_id)) with check (public.is_barbershop_staff(barbershop_id));
create policy client_tags_staff_delete on public.client_tags for delete to authenticated using (public.is_barbershop_staff(barbershop_id));

create policy client_tag_assignments_staff_select on public.client_tag_assignments for select to authenticated using (public.is_barbershop_staff(barbershop_id));
create policy client_tag_assignments_staff_insert on public.client_tag_assignments for insert to authenticated with check (public.is_barbershop_staff(barbershop_id));
create policy client_tag_assignments_staff_delete on public.client_tag_assignments for delete to authenticated using (public.is_barbershop_staff(barbershop_id));

create or replace function public.validate_client_note_tenant()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.users where id = new.client_id and barbershop_id = new.barbershop_id) then
    raise exception 'invalid_client_tenant';
  end if;
  return new;
end;
$$;

drop trigger if exists client_notes_tenant_trigger on public.client_notes;
create trigger client_notes_tenant_trigger before insert or update on public.client_notes for each row execute function public.validate_client_note_tenant();

create or replace function public.validate_client_tag_assignment_tenant()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.users where id = new.client_id and barbershop_id = new.barbershop_id and role = 'client') then
    raise exception 'invalid_client_tenant';
  end if;
  if not exists (select 1 from public.client_tags where id = new.tag_id and barbershop_id = new.barbershop_id) then
    raise exception 'invalid_tag_tenant';
  end if;
  return new;
end;
$$;

drop trigger if exists client_tag_assignment_tenant_trigger on public.client_tag_assignments;
create trigger client_tag_assignment_tenant_trigger before insert or update on public.client_tag_assignments for each row execute function public.validate_client_tag_assignment_tenant();
