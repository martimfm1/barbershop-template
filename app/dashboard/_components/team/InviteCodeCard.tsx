"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, KeyRound, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function InviteCodeCard() {
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const remaining = useMemo(() => {
    if (!expiresAt) return null;
    return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
  }, [expiresAt]);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(remaining);

  useEffect(() => {
    setSecondsLeft(remaining);
    if (remaining === null) return;
    const timer = window.setInterval(() => {
      setSecondsLeft(Math.max(0, Math.ceil((new Date(expiresAt!).getTime() - Date.now()) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [remaining, expiresAt]);

  async function generate() {
    setLoading(true);
    setCopied(false);
    try {
      const response = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível gerar o código.");
      setCode(data.code);
      setExpiresAt(data.expiresAt);
      toast.success("Código de barbeiro gerado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar o código.");
    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Código copiado.");
  }

  const expired = secondsLeft !== null && secondsLeft <= 0;
  const minutes = secondsLeft === null ? 0 : Math.floor(secondsLeft / 60);
  const seconds = secondsLeft === null ? 0 : secondsLeft % 60;

  return (
    <Card className="rounded-3xl border-white/10 bg-zinc-900/60 shadow-xl backdrop-blur-xl">
      <CardHeader className="border-b border-white/10 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <KeyRound className="size-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-zinc-50">Código de entrada</CardTitle>
            <p className="mt-1 text-sm text-zinc-500">Gera um código de utilização única válido durante 10 minutos. Quem entrar com este código entra automaticamente como barbeiro.</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 p-5 sm:p-6">
        <Button onClick={generate} disabled={loading} className="min-h-11 bg-emerald-600 text-white hover:bg-emerald-500 sm:w-fit">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <><RefreshCw className="mr-2 size-4" />Gerar código de barbeiro</>}
        </Button>

        {code && !expired ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-zinc-500">Código de barbeiro</p>
                <p className="mt-1 font-mono text-2xl font-bold tracking-[0.18em] text-white">{code}</p>
                <p className="mt-1 text-xs text-zinc-500">Expira em {minutes}:{String(seconds).padStart(2, "0")}</p>
              </div>
              <Button variant="outline" onClick={copyCode} className="min-h-11 border-white/10 bg-transparent text-white hover:bg-white/5">
                {copied ? <Check className="mr-2 size-4" /> : <Copy className="mr-2 size-4" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs leading-5 text-zinc-500">Depois de entrar, o proprietário pode alterar a função e as permissões dessa pessoa na aba de membros.</p>
        )}
      </CardContent>
    </Card>
  );
}
