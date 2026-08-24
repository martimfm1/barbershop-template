'use client';

import { useCallback, useEffect, useState } from 'react';
import { Globe2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import { useBarbershop } from '@/context/BarbershopContext';

export function BarbershopVisibilitySetting() {
  const { barbershopId } = useBarbershop();
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadVisibility = useCallback(async () => {
    if (!barbershopId) return;

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('barbershops')
      .select('is_public_in_directory')
      .eq('id', barbershopId)
      .single();

    if (error) {
      console.error('[BARBERSHOP_VISIBILITY_LOAD]', error);
      toast.error('Não foi possível carregar a visibilidade da barbearia.');
    } else {
      setIsVisible(data?.is_public_in_directory ?? true);
    }

    setLoading(false);
  }, [barbershopId]);

  useEffect(() => {
    void loadVisibility();
  }, [loadVisibility]);

  const handleChange = async (nextValue: boolean) => {
    if (!barbershopId || saving) return;

    const previousValue = isVisible;
    setIsVisible(nextValue);
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from('barbershops')
      .update({ is_public_in_directory: nextValue })
      .eq('id', barbershopId);

    setSaving(false);

    if (error) {
      console.error('[BARBERSHOP_VISIBILITY_UPDATE]', error);
      setIsVisible(previousValue);
      toast.error('Não foi possível atualizar a visibilidade.');
      return;
    }

    toast.success(
      nextValue
        ? 'A tua barbearia voltou a aparecer no diretório.'
        : 'A tua barbearia deixou de aparecer no diretório.',
    );
  };

  return (
    <section className="mb-6 rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-400">
            <Globe2 className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-zinc-100">
              Visibilidade no diretório
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-400">
              Controla se a tua barbearia aparece em{' '}
              <strong className="font-medium text-zinc-300">/barbearias</strong>
              , onde os clientes podem descobrir e agendar serviços.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {loading || saving ? (
            <Loader2 className="size-4 animate-spin text-zinc-500" />
          ) : null}
          <Switch
            checked={isVisible}
            disabled={loading || saving || !barbershopId}
            onCheckedChange={handleChange}
            aria-label="Mostrar barbearia no diretório público"
          />
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-xs text-zinc-500">
        {isVisible
          ? 'Visível: a tua barbearia pode aparecer nos resultados públicos.'
          : 'Oculta: a tua barbearia não aparece no diretório público, mas o teu link direto continua disponível.'}
      </div>
    </section>
  );
}
