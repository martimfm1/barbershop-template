begin;

create or replace function public.guard_cancelled_marketing_campaign()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'cancelled' and old.active = false then
    new.status := 'cancelled';
    new.active := false;
    new.next_run_at := null;
  elsif new.status = 'cancelled' then
    new.active := false;
    new.next_run_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists marketing_campaign_cancelled_state_guard
  on public.marketing_campaigns;

create trigger marketing_campaign_cancelled_state_guard
before update on public.marketing_campaigns
for each row
execute function public.guard_cancelled_marketing_campaign();

commit;
