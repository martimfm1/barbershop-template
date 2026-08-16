create or replace function public.consume_loyalty_verification(
  p_verification_id uuid,
  p_code_hash text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  verification public.loyalty_verifications%rowtype;
begin
  select *
    into verification
    from public.loyalty_verifications
   where id = p_verification_id
   for update;

  if not found then
    return 'LOYALTY_VERIFICATION_INVALID';
  end if;

  if verification.consumed_at is not null
     or verification.expires_at <= now() then
    return 'LOYALTY_VERIFICATION_INVALID';
  end if;

  if coalesce(verification.attempts, 0) >= 8 then
    return 'LOYALTY_VERIFICATION_LOCKED';
  end if;

  if verification.code_hash <> p_code_hash then
    update public.loyalty_verifications
       set attempts = coalesce(attempts, 0) + 1
     where id = verification.id;
    return 'LOYALTY_VERIFICATION_INVALID';
  end if;

  update public.loyalty_verifications
     set consumed_at = now(),
         attempts = coalesce(attempts, 0) + 1
   where id = verification.id;

  return 'LOYALTY_VERIFICATION_OK';
end;
$$;

revoke all on function public.consume_loyalty_verification(uuid, text) from public, anon, authenticated;
grant execute on function public.consume_loyalty_verification(uuid, text) to service_role;
