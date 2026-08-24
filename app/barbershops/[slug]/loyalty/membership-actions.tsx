'use client';

import { useEffect, useState } from 'react';
import { LogIn, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Props = { slug: string };

export default function LoyaltyMembershipActions({ slug }: Props) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      const response = await fetch(
        `/api/loyalty/me?slug=${encodeURIComponent(slug)}`,
        { cache: 'no-store' },
      );
      const data = await response.json().catch(() => ({}));
      setAuthenticated(response.ok && data.authenticated === true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [slug]);

  function enter() {
    const emailInput = document.querySelector<HTMLInputElement>(
      'input[type="email"]',
    );
    emailInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    emailInput?.focus({ preventScroll: true });
  }

  async function leave() {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch('/api/loyalty/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
        cache: 'no-store',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data.error || 'Não foi possível sair da fidelização.');
      toast.success(
        'Saíste da fidelização. Os teus pontos ficam guardados para uma futura reentrada nesta barbearia.',
      );
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível sair da fidelização.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) return null;

  return authenticated ? (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={() => void leave()}
        disabled={busy}
        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/[0.04] px-4 text-xs font-medium text-red-200 transition hover:bg-red-400/[0.08] disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <LogOut className="size-3.5" />
        )}
        {busy ? 'A sair…' : 'Sair da fidelização'}
      </button>
    </div>
  ) : (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={enter}
        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] px-4 text-xs font-medium text-emerald-200 transition hover:bg-emerald-400/[0.10]"
      >
        <LogIn className="size-3.5" /> Entrar na fidelização
      </button>
    </div>
  );
}
