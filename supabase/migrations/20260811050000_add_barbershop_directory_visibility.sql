-- Permite a cada barbearia controlar se aparece no diretório público /barbearias.
-- NULL/ausência anterior é tratada como visível para não remover barbearias existentes do diretório.
ALTER TABLE public.barbershops
  ADD COLUMN IF NOT EXISTS is_public_in_directory boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.barbershops.is_public_in_directory IS
  'Controla se a barbearia aparece no diretório público /barbearias. O link direto continua disponível quando false.';

CREATE INDEX IF NOT EXISTS idx_barbershops_public_directory
  ON public.barbershops (is_public_in_directory)
  WHERE is_public_in_directory = true;
