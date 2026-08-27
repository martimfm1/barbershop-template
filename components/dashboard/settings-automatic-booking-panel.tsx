'use client';

import { useEffect, useState } from 'react';
import { Check, LockKeyhole, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
            'Não foi possível carregar as opções automáticas.',
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
        'Esta funcionalidade está disponível apenas nos planos Pro e Enterprise.',
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
        result.error.message || 'Não foi possível guardar as opções.',
      );
      return;
    }
    setInitial({ autoConfirm, autoComplete });
    toast.success('Automatizações de marcações guardadas.');
  }

  if (planLoading || loading) {
    return (
      <Card className="mt-6 border-white/10 bg-black/30">
        <CardContent className="flex min-h-36 items-center justify-center">
          <Spinner className="size-6" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="mt-6 border-violet-500/20 bg-violet-500/[0.035] backdrop-blur-md"
      aria-labelledby="automatic-booking-title"
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle
              id="automatic-booking-title"
              className="flex items-center gap-2 text-lg"
            >
              <Sparkles className="size-4 text-violet-300" aria-hidden="true" />
              Automatização de marcações
            </CardTitle>
            <CardDescription className="mt-1 max-w-2xl text-xs leading-5">
              Poupa trabalho manual com confirmação imediata e conclusão
              automática depois da hora de fim do serviço.
            </CardDescription>
          </div>
          {!eligible && (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/[0.06] px-2.5 py-1 text-[11px] font-medium text-amber-200">
              <LockKeyhole className="size-3" aria-hidden="true" /> Pro
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">
                Confirmar marcações automaticamente
              </p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Novas reservas passam diretamente de pendente para confirmada,
                sem intervenção manual.
              </p>
            </div>
            <Switch
              checked={autoConfirm}
              disabled={!eligible}
              onCheckedChange={setAutoConfirm}
              aria-label="Confirmar marcações automaticamente"
            />
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">
                Concluir marcações automaticamente
              </p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Depois de terminar o serviço, a marcação passa automaticamente
                para concluída.
              </p>
            </div>
            <Switch
              checked={autoComplete}
              disabled={!eligible}
              onCheckedChange={setAutoComplete}
              aria-label="Concluir marcações automaticamente"
            />
          </div>
        </div>
        {!eligible && (
          <p className="flex items-center gap-2 text-xs text-zinc-500">
            <Check className="size-3.5 text-emerald-300" aria-hidden="true" />
            Faz upgrade para Pro ou Enterprise para ativar estas automatizações.
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
            {saving ? 'A guardar…' : 'Guardar automatizações'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
