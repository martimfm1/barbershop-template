'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarCheck2,
  Camera,
  CheckCircle2,
  Clock3,
  CreditCard,
  ImageIcon,
  LogOut,
  MapPin,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Store,
  UserCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useBarbershop } from '@/context/BarbershopContext';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { cn } from '@/lib/utils';
import { processAndUploadImage } from '@/lib/utils/upload-image';
import { barbershopService } from '@/app/dashboard/_services/barbershop.service';
import { authService } from '@/app/dashboard/_services/auth.service';
import { SettingsAmenitiesPanel } from '@/components/dashboard/settings-amenities-panel';
import { SettingsLocationPanel } from '@/components/dashboard/settings-location-panel';
import { SettingsAutomaticBookingPanel } from '@/components/dashboard/settings-automatic-booking-panel';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';

type SettingsSection =
  | 'overview'
  | 'business'
  | 'location'
  | 'hours'
  | 'appearance'
  | 'billing'
  | 'account';

type SettingsConfig = {
  name: string;
  phone: string;
  address: string;
  opening_time: string;
  closing_time: string;
  lunch_start: string;
  lunch_end: string;
  closed_days: string;
  allow_online_bookings: boolean;
  is_public_in_directory: boolean;
  time_limit_cancellation_hours: number;
};

const SECTIONS: Array<{
  id: SettingsSection;
  label: string;
  description: string;
  icon: typeof Settings;
}> = [
  {
    id: 'overview',
    label: 'Visão geral',
    description: 'Estado da configuração',
    icon: Settings,
  },
  {
    id: 'business',
    label: 'Negócio',
    description: 'Identidade e dados públicos',
    icon: Store,
  },
  {
    id: 'location',
    label: 'Localização',
    description: 'Morada e informações do espaço',
    icon: MapPin,
  },
  {
    id: 'hours',
    label: 'Horários',
    description: 'Funcionamento e regras de marcação',
    icon: Clock3,
  },
  {
    id: 'appearance',
    label: 'Aparência',
    description: 'Logótipo e imagem de capa',
    icon: ImageIcon,
  },
  {
    id: 'billing',
    label: 'Plano e faturação',
    description: 'Subscrição e faturas',
    icon: CreditCard,
  },
  {
    id: 'account',
    label: 'Conta e segurança',
    description: 'Sessão e acesso',
    icon: ShieldCheck,
  },
];

const DAYS = [
  ['Monday', 'Segunda-feira', 'Monday'],
  ['Tuesday', 'Terça-feira', 'Tuesday'],
  ['Wednesday', 'Quarta-feira', 'Wednesday'],
  ['Thursday', 'Quinta-feira', 'Thursday'],
  ['Friday', 'Sexta-feira', 'Friday'],
  ['Saturday', 'Sábado', 'Saturday'],
  ['Sunday', 'Domingo', 'Sunday'],
] as const;

const INPUT_CLASS =
  'min-h-11 rounded-xl border-white/10 bg-white/[0.04] text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-2 focus-visible:ring-emerald-500/40';
const CARD_CLASS = 'border-white/10 bg-black/30 backdrop-blur-md';

function normalizeConfig(value: Partial<SettingsConfig>): SettingsConfig {
  return {
    name: value.name ?? '',
    phone: value.phone ?? '',
    address: value.address ?? '',
    opening_time: value.opening_time ?? '09:00',
    closing_time: value.closing_time ?? '19:00',
    lunch_start: value.lunch_start ?? '',
    lunch_end: value.lunch_end ?? '',
    closed_days: value.closed_days ?? 'None',
    allow_online_bookings: value.allow_online_bookings ?? true,
    is_public_in_directory: value.is_public_in_directory ?? true,
    time_limit_cancellation_hours: Math.max(
      0,
      Math.min(720, Number(value.time_limit_cancellation_hours ?? 24)),
    ),
  };
}

function closedDaysList(value: string): string[] {
  if (!value || value === 'None') return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function SettingsPageOrganized() {
  const router = useRouter();
  const { barbershopId } = useBarbershop();
  const { hasFeature, loading: planLoading } = useFeatureAccess();
  const canManageDirectoryVisibility = hasFeature('directory_visibility');
  const [section, setSection] = useState<SettingsSection>('overview');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [config, setConfig] = useState<SettingsConfig>(normalizeConfig({}));
  const [initialConfig, setInitialConfig] = useState<SettingsConfig | null>(
    null,
  );
  const [avatarTimestamp, setAvatarTimestamp] = useState(0);
  const [bannerTimestamp, setBannerTimestamp] = useState(0);
  const [uploading, setUploading] = useState<'avatar' | 'banner' | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!barbershopId) return;
    setLoading(true);
    const result = await barbershopService.getConfig(barbershopId);
    if (result.error)
      toast.error(
        result.error.message || 'Não foi possível carregar as definições.',
      );
    if (result.data) {
      const next = normalizeConfig(result.data);
      setConfig(next);
      setInitialConfig(next);
    }
    setLoading(false);
  }, [barbershopId]);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = useMemo(
    () => JSON.stringify(config) !== JSON.stringify(initialConfig),
    [config, initialConfig],
  );
  const closedDays = useMemo(
    () => closedDaysList(config.closed_days),
    [config.closed_days],
  );
  const filteredSections = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-PT');
    if (!term) return SECTIONS;
    return SECTIONS.filter((item) =>
      `${item.label} ${item.description}`
        .toLocaleLowerCase('pt-PT')
        .includes(term),
    );
  }, [search]);
  const completion = useMemo(() => {
    const checks = [
      Boolean(config.name.trim()),
      Boolean(config.phone.trim()),
      Boolean(config.address.trim()),
      Boolean(config.opening_time && config.closing_time),
      config.allow_online_bookings,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [config]);

  function goTo(next: SettingsSection) {
    setSection(next);
    requestAnimationFrame(() =>
      document
        .getElementById(`settings-${next}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  }

  function toggleDay(value: string) {
    setConfig((current) => {
      const next = closedDays.includes(value)
        ? closedDays.filter((day) => day !== value)
        : [...closedDays, value];
      return { ...current, closed_days: next.length ? next.join(',') : 'None' };
    });
  }

  async function save() {
    if (!barbershopId || !dirty) return;
    if (config.opening_time >= config.closing_time) {
      toast.error(
        'O horário de fecho tem de ser posterior ao horário de abertura.',
      );
      goTo('hours');
      return;
    }
    setSaving(true);
    const payload = Object.fromEntries(
      Object.entries(config).filter(
        ([key, value]) =>
          initialConfig?.[key as keyof SettingsConfig] !== value,
      ),
    ) as Partial<SettingsConfig>;
    if (!canManageDirectoryVisibility) delete payload.is_public_in_directory;
    const result = await barbershopService.updateConfig(barbershopId, payload);
    setSaving(false);
    if (result.error)
      return toast.error(
        result.error.message || 'Não foi possível guardar as alterações.',
      );
    const next = normalizeConfig(result.data ?? config);
    setConfig(next);
    setInitialConfig(next);
    toast.success('Alterações guardadas.');
  }

  async function upload(type: 'avatar' | 'banner', file: File) {
    if (!barbershopId) return;
    setUploading(type);
    const result = await processAndUploadImage({
      file,
      bucket: type,
      path: `${barbershopId}/${type}.webp`,
      maxWidth: type === 'avatar' ? 400 : 1400,
      quality: 0.85,
    });
    setUploading(null);
    if (result.error)
      return toast.error(
        result.error.message || 'Não foi possível atualizar a imagem.',
      );
    if (type === 'avatar') setAvatarTimestamp(Date.now());
    else setBannerTimestamp(Date.now());
    toast.success(
      type === 'avatar' ? 'Logótipo atualizado.' : 'Capa atualizada.',
    );
  }

  async function logout() {
    setLogoutLoading(true);
    try {
      await authService.logout();
      router.replace('/login');
      router.refresh();
    } catch {
      toast.error('Não foi possível terminar a sessão.');
      setLogoutLoading(false);
    }
  }

  const storageOrigin =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') || '';
  const avatarUrl =
    barbershopId && storageOrigin
      ? `${storageOrigin}/storage/v1/object/public/avatar/${barbershopId}/avatar.webp?t=${avatarTimestamp}`
      : null;
  const bannerUrl =
    barbershopId && storageOrigin
      ? `${storageOrigin}/storage/v1/object/public/banner/${barbershopId}/banner.webp?t=${bannerTimestamp}`
      : null;

  if (loading || planLoading)
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Spinner className="size-7" />
      </div>
    );

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-30 -mx-4 border-b border-white/[0.06] bg-zinc-950/90 px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/dashboard"
                aria-label="Voltar ao painel"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
              </Link>
              <div className="min-w-0">
                <p className="text-xs text-zinc-600">Painel</p>
                <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
                  Definições
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {dirty && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => initialConfig && setConfig(initialConfig)}
                  className="hidden min-h-10 sm:inline-flex"
                >
                  Descartar
                </Button>
              )}
              <Button
                type="button"
                onClick={() => void save()}
                disabled={!dirty || saving}
                className="min-h-10 rounded-xl bg-zinc-50 px-4 text-zinc-950 hover:bg-white"
              >
                {saving ? (
                  <Spinner className="mr-2 size-4" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}
                {saving
                  ? 'A guardar…'
                  : dirty
                    ? 'Guardar alterações'
                    : 'Tudo guardado'}
              </Button>
            </div>
          </div>
        </header>

        <div className="mt-5 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-2">
                <div className="mb-2 px-3 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                  Definições
                </div>
                {filteredSections.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => goTo(item.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400',
                        section === item.id
                          ? 'bg-white/[0.07] text-zinc-100'
                          : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-8 items-center justify-center rounded-lg',
                          section === item.id
                            ? 'bg-emerald-400/10 text-emerald-300'
                            : 'bg-white/[0.03]',
                        )}
                      >
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">
                          {item.label}
                        </span>
                        <span className="block truncate text-[11px] text-zinc-600">
                          {item.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4">
                <p className="text-xs font-semibold text-emerald-300">
                  Configuração
                </p>
                <p className="mt-2 text-2xl font-semibold">{completion}%</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-400"
                    style={{ width: `${completion}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-zinc-600">
                  Completa os dados essenciais da barbearia.
                </p>
              </div>
            </div>
          </aside>

          <div className="min-w-0 space-y-6">
            <div className="flex gap-2 lg:hidden">
              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600"
                  aria-hidden="true"
                />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pesquisar definições"
                  className={`${INPUT_CLASS} pl-9`}
                />
              </div>
              <select
                aria-label="Secção das definições"
                value={section}
                onChange={(e) => goTo(e.target.value as SettingsSection)}
                className="min-h-11 max-w-[48%] rounded-xl border border-white/10 bg-zinc-900 px-3 text-sm text-zinc-200"
              >
                {SECTIONS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <section id="settings-overview" className="scroll-mt-28">
              <Card className={CARD_CLASS}>
                <CardContent className="p-6 sm:p-8">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
                        Centro de definições
                      </p>
                      <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                        Tudo o que importa, num só lugar.
                      </h2>
                      <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
                        Dados da barbearia, localização, comodidades, horários,
                        regras de marcação, aparência e conta. Sem menus
                        duplicados.
                      </p>
                    </div>
                    <CheckCircle2
                      className="hidden size-12 text-emerald-400/60 sm:block"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {SECTIONS.filter((item) => item.id !== 'overview').map(
                      (item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => goTo(item.id)}
                            className="flex min-h-24 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-left transition hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                          >
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-300">
                              <Icon className="size-4" aria-hidden="true" />
                            </span>
                            <span>
                              <span className="block text-sm font-medium text-zinc-100">
                                {item.label}
                              </span>
                              <span className="mt-1 block text-xs leading-5 text-zinc-600">
                                {item.description}
                              </span>
                            </span>
                          </button>
                        );
                      },
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>

            <section id="settings-business" className="scroll-mt-28">
              <Card className={CARD_CLASS}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store
                      className="size-4 text-emerald-400"
                      aria-hidden="true"
                    />{' '}
                    Negócio
                  </CardTitle>
                  <CardDescription>
                    Informações que identificam a tua barbearia perante os
                    clientes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-5 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <label
                      htmlFor="settings-name"
                      className="text-sm font-medium"
                    >
                      Nome da barbearia
                    </label>
                    <Input
                      id="settings-name"
                      value={config.name}
                      onChange={(e) =>
                        setConfig((c) => ({ ...c, name: e.target.value }))
                      }
                      className={INPUT_CLASS}
                      placeholder="Ex.: Barbearia Central"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label
                      htmlFor="settings-phone"
                      className="text-sm font-medium"
                    >
                      Telefone
                    </label>
                    <Input
                      id="settings-phone"
                      type="tel"
                      autoComplete="tel"
                      value={config.phone}
                      onChange={(e) =>
                        setConfig((c) => ({ ...c, phone: e.target.value }))
                      }
                      className={INPUT_CLASS}
                      placeholder="9xx xxx xxx"
                    />
                  </div>
                  <div className="sm:col-span-2 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        Visibilidade no diretório
                      </p>
                      <p className="mt-1 text-xs leading-5 text-zinc-600">
                        Controla se a barbearia aparece na área pública de
                        descoberta. Disponível no Pro e Enterprise.
                      </p>
                    </div>
                    <Switch
                      disabled={!canManageDirectoryVisibility}
                      checked={
                        canManageDirectoryVisibility &&
                        config.is_public_in_directory
                      }
                      onCheckedChange={(checked) =>
                        canManageDirectoryVisibility &&
                        setConfig((c) => ({
                          ...c,
                          is_public_in_directory: checked,
                        }))
                      }
                      aria-label="Visibilidade no diretório"
                    />
                  </div>
                </CardContent>
              </Card>
            </section>

            <section id="settings-location" className="scroll-mt-28">
              <SettingsLocationPanel barbershopId={barbershopId!} />
              <SettingsAmenitiesPanel barbershopId={barbershopId!} />
            </section>

            <section id="settings-hours" className="scroll-mt-28">
              <Card className={CARD_CLASS}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock3
                      className="size-4 text-blue-400"
                      aria-hidden="true"
                    />{' '}
                    Horários e encerramentos
                  </CardTitle>
                  <CardDescription>
                    Define quando a barbearia funciona e os dias em que está
                    fechada.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <label
                        htmlFor="settings-open"
                        className="text-sm font-medium"
                      >
                        Abertura
                      </label>
                      <Input
                        id="settings-open"
                        type="time"
                        value={config.opening_time}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            opening_time: e.target.value,
                          }))
                        }
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label
                        htmlFor="settings-close"
                        className="text-sm font-medium"
                      >
                        Fecho
                      </label>
                      <Input
                        id="settings-close"
                        type="time"
                        value={config.closing_time}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            closing_time: e.target.value,
                          }))
                        }
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <label
                        htmlFor="settings-lunch-start"
                        className="text-sm font-medium"
                      >
                        Início da pausa{' '}
                        <span className="font-normal text-zinc-600">
                          (opcional)
                        </span>
                      </label>
                      <Input
                        id="settings-lunch-start"
                        type="time"
                        value={config.lunch_start}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            lunch_start: e.target.value,
                          }))
                        }
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label
                        htmlFor="settings-lunch-end"
                        className="text-sm font-medium"
                      >
                        Fim da pausa{' '}
                        <span className="font-normal text-zinc-600">
                          (opcional)
                        </span>
                      </label>
                      <Input
                        id="settings-lunch-end"
                        type="time"
                        value={config.lunch_end}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            lunch_end: e.target.value,
                          }))
                        }
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Dias de folga</p>
                    <p className="mt-1 text-xs text-zinc-600">
                      Português e inglês são mostrados juntos para evitar
                      ambiguidades.
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {DAYS.map(([value, pt, en]) => {
                        const active = closedDays.includes(value);
                        return (
                          <button
                            key={value}
                            type="button"
                            aria-pressed={active}
                            onClick={() => toggleDay(value)}
                            className={cn(
                              'flex min-h-12 items-center justify-between rounded-xl border px-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400',
                              active
                                ? 'border-emerald-400/30 bg-emerald-400/[0.07] text-emerald-200'
                                : 'border-white/10 bg-white/[0.02] text-zinc-400 hover:bg-white/[0.05]',
                            )}
                          >
                            <span>
                              <span className="block font-medium">{pt}</span>
                              <span className="block text-xs text-zinc-600">
                                {en}
                              </span>
                            </span>
                            {active && (
                              <CheckCircle2
                                className="size-4 text-emerald-300"
                                aria-hidden="true"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className={`${CARD_CLASS} mt-6`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarCheck2
                      className="size-4 text-violet-400"
                      aria-hidden="true"
                    />{' '}
                    Regras de marcação
                  </CardTitle>
                  <CardDescription>
                    As regras que controlam a forma como os clientes reservam e
                    cancelam.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                    <div>
                      <p className="text-sm font-medium">
                        Permitir marcações online
                      </p>
                      <p className="mt-1 text-xs leading-5 text-zinc-600">
                        Quando desligado, a página pública deixa de aceitar
                        novas reservas.
                      </p>
                    </div>
                    <Switch
                      checked={config.allow_online_bookings}
                      onCheckedChange={(checked) =>
                        setConfig((c) => ({
                          ...c,
                          allow_online_bookings: checked,
                        }))
                      }
                      aria-label="Permitir marcações online"
                    />
                  </div>
                  <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                    <label
                      htmlFor="cancel-window"
                      className="text-sm font-medium"
                    >
                      Prazo de cancelamento
                    </label>
                    <p className="text-xs leading-5 text-zinc-600">
                      Número de horas antes da marcação a partir do qual o
                      cliente já não pode cancelar.
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        id="cancel-window"
                        type="number"
                        min={0}
                        max={720}
                        value={config.time_limit_cancellation_hours}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            time_limit_cancellation_hours: Number(
                              e.target.value,
                            ),
                          }))
                        }
                        className={`${INPUT_CLASS} max-w-40`}
                      />
                      <span className="text-sm text-zinc-500">horas</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <SettingsAutomaticBookingPanel barbershopId={barbershopId!} />
            </section>

            <section id="settings-appearance" className="scroll-mt-28">
              <Card className={CARD_CLASS}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon
                      className="size-4 text-amber-400"
                      aria-hidden="true"
                    />{' '}
                    Aparência
                  </CardTitle>
                  <CardDescription>
                    Identidade visual da página pública da tua barbearia.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
                    <div className="relative h-48 sm:h-64">
                      {bannerUrl ? (
                        <Image
                          src={bannerUrl}
                          alt="Capa da barbearia"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-zinc-600">
                          Sem capa definida
                        </div>
                      )}
                      <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                        <div className="flex size-16 items-center justify-center overflow-hidden rounded-2xl border-2 border-zinc-950 bg-zinc-800 shadow-xl">
                          {avatarUrl ? (
                            <Image
                              src={avatarUrl}
                              alt="Logótipo da barbearia"
                              width={128}
                              height={128}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <UserCircle2
                              className="size-8 text-zinc-600"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => bannerRef.current?.click()}
                            disabled={uploading === 'banner'}
                            className="min-h-10 rounded-xl bg-zinc-950/80 text-zinc-100"
                          >
                            <ImageIcon
                              className="mr-2 size-4"
                              aria-hidden="true"
                            />
                            Capa
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => avatarRef.current?.click()}
                            disabled={uploading === 'avatar'}
                            className="min-h-10 rounded-xl bg-zinc-950/80 text-zinc-100"
                          >
                            <Camera
                              className="mr-2 size-4"
                              aria-hidden="true"
                            />
                            Logótipo
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <input
                    ref={avatarRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void upload('avatar', file);
                      e.currentTarget.value = '';
                    }}
                  />
                  <input
                    ref={bannerRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void upload('banner', file);
                      e.currentTarget.value = '';
                    }}
                  />
                </CardContent>
              </Card>
            </section>

            <section id="settings-billing" className="scroll-mt-28">
              <Card className="border-emerald-500/20 bg-emerald-500/[0.04]">
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">
                      Plano e faturação
                    </p>
                    <h2 className="mt-1 text-lg font-semibold">
                      Gerir subscrição, faturas e limites.
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      Acede ao painel completo de billing sem duplicar
                      definições aqui.
                    </p>
                  </div>
                  <Button
                    asChild
                    className="min-h-11 rounded-xl bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                  >
                    <Link href="/dashboard/billing">
                      Abrir faturação
                      <ArrowUpRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </section>

            <section id="settings-account" className="scroll-mt-28">
              <Card className={CARD_CLASS}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck
                      className="size-4 text-emerald-400"
                      aria-hidden="true"
                    />{' '}
                    Conta e segurança
                  </CardTitle>
                  <CardDescription>
                    Termina a sessão ou gere a segurança da tua conta a partir
                    daqui.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void logout()}
                    disabled={logoutLoading}
                    className="min-h-11 rounded-xl border-white/10 bg-white/[0.03] text-zinc-200"
                  >
                    <LogOut className="mr-2 size-4" aria-hidden="true" />
                    {logoutLoading ? 'A terminar sessão…' : 'Terminar sessão'}
                  </Button>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>

        {dirty && (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-zinc-950/95 p-3 backdrop-blur-xl sm:hidden">
            <div className="mx-auto flex max-w-xl gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => initialConfig && setConfig(initialConfig)}
                className="min-h-11 flex-1"
              >
                Descartar
              </Button>
              <Button
                type="button"
                onClick={() => void save()}
                disabled={saving}
                className="min-h-11 flex-1 bg-zinc-50 text-zinc-950"
              >
                {saving ? 'A guardar…' : 'Guardar alterações'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
