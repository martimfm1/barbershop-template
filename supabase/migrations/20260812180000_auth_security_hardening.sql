-- Supabase Auth hardening.
-- Prevent account enumeration through legacy SECURITY DEFINER helpers and
-- keep authentication-facing functions server-only.

-- Legacy password-recovery helper. The application now uses the official
-- resetPasswordForEmail flow and must never expose email-existence checks.
revoke all on function public.check_email_exists(text) from public, anon, authenticated;

-- Keep administrative helpers server-side unless explicitly granted by a
-- future authorization layer.
revoke all on function public.check_if_admin() from public, anon, authenticated;

comment on function public.check_email_exists(text) is
  'Legacy helper intentionally disabled for client access; password recovery must not reveal account existence.';

comment on function public.check_if_admin() is
  'Server-side authorization helper; client execution is intentionally revoked.';
