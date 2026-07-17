ALTER TABLE public.barbershops
ADD COLUMN IF NOT EXISTS updated_at timestamptz;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_barbershops_updated_at ON public.barbershops;

CREATE TRIGGER set_barbershops_updated_at
BEFORE UPDATE ON public.barbershops
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
