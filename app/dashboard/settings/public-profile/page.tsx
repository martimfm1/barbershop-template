'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ExternalLink,
  Globe2,
  ImageIcon,
  Lock,
  Save,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const inputClass =
  'min-h-11 rounded-xl border-white/10 bg-white/[0.04] text-zinc-100 placeholder:text-zinc-600';

type Profile = {
  slug: string;
  custom_slug: string | null;
  public_profile_enabled: boolean;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  theme_config: Record<string, unknown>;
  plan: 'free' | 'pro' | 'enterprise';
  canCustomizeSlug: boolean;
  canCustomizeEnterprise: boolean;
};

export default function PublicProfileSettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [slug, setSlug] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [ogImageUrl, setOgImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const response = await fetch('/api/barbershops/public-profile', {
      cache: 'no-store',
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.data) {
      toast.error(body.error || 'Não foi possível carregar o perfil público.');
      setLoading(false);
      return;
    }
    const next = body.data as Profile;
    setProfile(next);
    setSlug(next.custom_slug || next.slug || '');
    setSeoTitle(next.seo_title || '');
    setSeoDescription(next.seo_description || '');
    setOgImageUrl(next.og_image_url || '');
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    if (!profile) return;
    setSaving(true);
    try {
      const response = await fetch('/api/barbershops/public-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, seoTitle, seoDescription, ogImageUrl }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(body.error || 'Não foi possível guardar.');
      toast.success('Presença online atualizada.');
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Não foi possível guardar.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 px-4 py-12 text-white">
        <div className="mx-auto max-w-3xl animate-pulse rounded-3xl border border-white/10 bg-white/[0.02] p-8">
          <div className="h-8 w-1/3 rounded bg-white/10" />
          <div className="mt-6 h-12 rounded bg-white/10" />
          <div className="mt-4 h-28 rounded bg-white/10" />
        </div>
      </main>
    );
  }

  if (!profile) return null;

  const publicUrl = `/barbershops/${encodeURIComponent(profile.custom_slug || profile.slug)}`;

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link
              href="/dashboard/settings"
              className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-200"
            >
              <ArrowLeft className="size-4" /> Definições
            </Link>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
              Presença online
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Página pública da barbearia
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Controla o URL público e, no Enterprise, a apresentação que
              aparece nos resultados de pesquisa e partilhas.
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
            {profile.plan}
          </span>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <Globe2 className="size-5 text-emerald-400" />
            <div>
              <h2 className="font-semibold">URL público</h2>
              <p className="text-xs text-zinc-500">
                O endereço que os clientes partilham e que o Google pode
                indexar.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center overflow-hidden rounded-xl border border-white/10 bg-black/20">
              <span className="shrink-0 px-3 text-xs text-zinc-600">
                barbers.silentra.me/barbershops/
              </span>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                disabled={!profile.canCustomizeSlug}
                className="min-h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>
            {profile.canCustomizeSlug ? (
              <span className="text-xs text-emerald-300">Pro incluído</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-zinc-600">
                <Lock className="size-3" /> Disponível no Pro
              </span>
            )}
          </div>
          <p className="mt-3 text-xs text-zinc-600">
            O slug deve ser simples, único e não pode usar rotas reservadas.
            Alterações mantêm redirects permanentes para preservar SEO.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <Sparkles className="size-5 text-amber-300" />
            <div>
              <h2 className="font-semibold">SEO avançado</h2>
              <p className="text-xs text-zinc-500">
                Personaliza o snippet que o motor de pesquisa pode mostrar.
              </p>
            </div>
          </div>
          {profile.canCustomizeEnterprise ? (
            <div className="mt-5 space-y-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">SEO title</label>
                <Input
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  maxLength={60}
                  className={inputClass}
                  placeholder="Porto Cut — Barbearia no Porto"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">SEO description</label>
                <Textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  maxLength={160}
                  className={`${inputClass} min-h-28 resize-none`}
                  placeholder="Marca o teu próximo corte na Porto Cut..."
                />
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-500">
              SEO avançado está disponível no Enterprise.
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <ImageIcon className="size-5 text-violet-300" />
            <div>
              <h2 className="font-semibold">Open Graph</h2>
              <p className="text-xs text-zinc-500">
                Imagem usada ao partilhar a página no WhatsApp, Discord e outras
                plataformas.
              </p>
            </div>
          </div>
          {profile.canCustomizeEnterprise ? (
            <div className="mt-5 grid gap-2">
              <label className="text-sm font-medium">URL da imagem OG</label>
              <Input
                value={ogImageUrl}
                onChange={(e) => setOgImageUrl(e.target.value)}
                className={inputClass}
                placeholder="https://.../og-image.webp"
              />
              <p className="text-xs text-zinc-600">
                Recomendado: 1200×630. O upload dedicado para Supabase será
                ligado na próxima etapa.
              </p>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-500">
              Imagem OG personalizada está disponível no Enterprise.
            </div>
          )}
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={publicUrl}
            target="_blank"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-medium hover:bg-white/[0.06]"
          >
            <ExternalLink className="size-4" /> Ver página pública
          </Link>
          <Button
            onClick={() => void save()}
            disabled={saving || !profile.canCustomizeSlug}
            className="min-h-11 rounded-xl bg-zinc-100 px-5 text-zinc-950 hover:bg-white"
          >
            {saving ? (
              'A guardar…'
            ) : (
              <>
                <Save className="mr-2 size-4" /> Guardar alterações
              </>
            )}
          </Button>
        </div>
      </div>
    </main>
  );
}
