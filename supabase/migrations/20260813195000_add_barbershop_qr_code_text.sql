begin;

alter table public.barbershops add column if not exists qr_code_text text;

alter table public.barbershops drop constraint if exists barbershops_qr_code_text_length;
alter table public.barbershops add constraint barbershops_qr_code_text_length
  check (qr_code_text is null or char_length(qr_code_text) <= 160);

comment on column public.barbershops.qr_code_text is
  'Optional caption displayed alongside the deterministic public booking QR code.';

commit;
