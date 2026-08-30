'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { barbershopService } from '@/app/dashboard/_services/barbershop.service';

export function SettingsAutomaticBookingPanel({
  barbershopId,
}: {
  barbershopId: string;
}) {
  const { plan, loading: planLoading } = useFeatureAccess();
  const eligible = plan === 'pro' || plan === 'enterprise';
  const [autoConfirm, setAutoConfirm] = useState(false);
  const [autoComplete, setAutoComplete] = useState(false);
  const [initial, setInitial] = useState({
    autoConfirm: false,
    autoComplete: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void barbershopService.getConfig(barbershopId).then((result) => {
      if (!active) return;
      if (result.error) {
        toast.error(
          result.error.message ||
            'Não foi possível carregar estas opções. Tenta novamente.',
        );
      } else if (result.data) {
        const next = {
          autoConfirm: result.data.auto_confirm_bookings === true,
          autoComplete: result.data.auto_complete_bookings === true,
        };
        setAutoConfirm(next.autoConfirm);
        setAutoComplete(next.autoComplete);
        setInitial(next);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [barbershopId]);

  const dirty =
    autoConfirm !== initial.autoConfirm ||
    autoComplete !== initial.autoComplete;

  async function save() {
    if (!eligible) {
      toast.error(
        'Estas opções estão disponíveis apenas nos planos Pro e Enterprise.',
      );
      return;
    }
    if (!dirty) return;
    setSaving(true);
    const result = await barbershopService.updateConfig(barbershopId, {
      auto_confirm_bookings: autoConfirm,
      auto_complete_bookings: autoComplete,
    });
    setSaving(false);
    if (result.error) {
      toast.error(
        result.error.message || 'Não foi possível guardar estas opções.',
      );
      return;
    }
    setInitial({ autoConfirm, autoComplete });
    toast.success('Alterações guardadas.');
  }

  if (planLoading || loading) {
    return (
      <div className="flex min-h-36 items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">
              Confirmar novas marcações automaticamente
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Assim que uma nova marcação entrar, fica confirmada sem teres de a
              abrir manualmente.
            </p>
          </div>
          <Switch
            checked={autoConfirm}
            disabled={!eligible}
            onCheckedChange={setAutoConfirm}
            aria-label="Confirmar novas marcações automaticamente"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">
              Dar como concluídas automaticamente
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Depois da hora prevista para terminar o serviço, a marcação passa
              automaticamente para concluída.
            </p>
          </div>
          <Switch
            checked={autoComplete}
            disabled={!eligible}
            onCheckedChange={setAutoComplete}
            aria-label="Dar como concluídas automaticamente"
          />
        </div>
      </div>

      {!eligible && (
        <p className="flex items-center gap-2 text-xs text-zinc-500">
          <Check className="size-3.5 text-emerald-300" aria-hidden="true" />
          Muda para Pro ou Enterprise para ativar estas opções.
        </p>
      )}

      <div className="flex justify-end border-t border-white/10 pt-4">
        <Button
          type="button"
          onClick={() => void save()}
          disabled={!eligible || !dirty || saving}
          className="min-h-11 rounded-xl"
        >
          {saving ? <Spinner className="mr-2 size-4" /> : null}
          {saving ? 'A guardar…' : 'Guardar alterações'}
        </Button>
      </div>
    </div>
  );
}
