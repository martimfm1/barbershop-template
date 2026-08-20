"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, CheckCircle2, Loader2, ScanLine, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function LoyaltyValidationPage() {
  const [slug, setSlug] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ rewardName: string; pointsCost: number; memberEmail: string } | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [status, setStatus] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    fetch("/api/barbershops/public-profile", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Não foi possível carregar a barbearia.");
        return response.json();
      })
      .then((data) => setSlug(data.data?.slug ?? null))
      .catch(() => {
        setStatus("Não foi possível carregar a barbearia.");
        toast.error("Não foi possível carregar a página pública.");
      });
    return () => streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  async function validate(value = identifier) {
    const clean = value.trim();
    if (!clean || !slug || busy) return;
    setBusy(true);
    setStatus("A validar recompensa…");
    try {
      const response = await fetch("/api/loyalty/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, identifier: clean }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível validar a recompensa.");
      setResult(data.redemption);
      setIdentifier("");
      stopCamera();
      setStatus(`Recompensa ${data.redemption?.rewardName ?? ""} validada com sucesso.`);
      toast.success("Recompensa validada.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível validar.";
      setStatus(message);
      toast.error(message);
    } finally { setBusy(false); }
  }

  async function startCamera() {
    try {
      if (!("BarcodeDetector" in window)) {
        toast.error("O teu navegador não suporta leitura QR automática. Usa o código manual.");
        setStatus("Leitura QR indisponível neste navegador. Usa o código manual.");
        return;
      }
      const detector = new (window as unknown as { BarcodeDetector: new (options?: { formats?: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>> } }).BarcodeDetector({ formats: ["qr_code"] });
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = stream;
      setCameraOpen(true);
      setStatus("Câmara aberta. Aponta-a para o QR da recompensa.");
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });

      const scan = async () => {
        if (!streamRef.current || !videoRef.current || videoRef.current.readyState < 2) {
          if (streamRef.current) requestAnimationFrame(scan);
          return;
        }
        try {
          const codes = await detector.detect(videoRef.current);
          const value = codes.find((item) => item.rawValue)?.rawValue;
          if (value) {
            setIdentifier(value);
            await validate(value);
            return;
          }
        } catch {
          // Camera frame can occasionally fail while autofocus is adjusting.
        }
        if (streamRef.current) window.setTimeout(() => void scan(), 350);
      };
      void scan();
    } catch {
      toast.error("Não foi possível aceder à câmara. Usa o código manual.");
      setStatus("Não foi possível aceder à câmara. Usa o código manual.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
    setStatus((current) => current === "Câmara aberta. Aponta-a para o QR da recompensa." ? "Câmara fechada. Podes usar o código manual." : current);
  }

  const maskedEmail = result?.memberEmail ? result.memberEmail.replace(/^(.).+(@.+)$/, "$1•••$2") : "";

  return (
    <main id="main-content" className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 sm:px-6 sm:py-12">
      <a className="skip-link" href="#validation-content">Saltar para a validação</a>
      <div id="validation-content" className="mx-auto w-full max-w-xl" tabIndex={-1}>
        <Link href="/dashboard/loyalty" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm text-zinc-400 hover:text-white" aria-label="Voltar à página de fidelização"><ArrowLeft className="size-4" aria-hidden="true" /> Fidelização</Link>
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Operações</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Validar recompensa</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">Lê o QR mostrado pelo cliente ou introduz o código de utilização. A validação é única e fica associada ao teu utilizador.</p>
          <p className="sr-announcer" aria-live="polite" aria-atomic="true">{status}</p>
        </div>

        {result ? (
          <section aria-labelledby="validation-success" className="mt-8 rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.06] p-6 shadow-2xl sm:p-8">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-200"><CheckCircle2 className="size-6" aria-hidden="true" /></div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Validada com sucesso</p>
            <h2 id="validation-success" className="mt-2 text-2xl font-semibold">{result.rewardName}</h2>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-white/10 bg-black/20 p-4"><dt className="text-xs text-zinc-500">Pontos usados</dt><dd className="mt-1 text-lg font-semibold">{result.pointsCost}</dd></div><div className="rounded-2xl border border-white/10 bg-black/20 p-4"><dt className="text-xs text-zinc-500">Cliente</dt><dd className="mt-1 truncate text-sm font-medium">{maskedEmail}</dd></div></dl>
            <button type="button" onClick={() => { setResult(null); setStatus("Pronto para validar outra recompensa."); }} className="mt-6 h-12 w-full rounded-xl bg-white text-sm font-semibold text-zinc-950 focus-visible:ring-2 focus-visible:ring-emerald-300">Validar outra recompensa</button>
          </section>
        ) : (
          <section className="mt-8 space-y-4" aria-label="Métodos de validação">
            <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
              <div className="flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-2xl border border-emerald-400/15 bg-emerald-400/10 text-emerald-200"><ScanLine className="size-5" aria-hidden="true" /></div><div><h2 className="font-semibold">Ler QR code</h2><p className="text-xs text-zinc-500">Recomendado no telemóvel.</p></div></div>
              {cameraOpen ? <div className="mt-5 overflow-hidden rounded-2xl border border-emerald-400/20 bg-black"><video ref={videoRef} autoPlay playsInline muted aria-label="Pré-visualização da câmara para leitura do QR code" className="aspect-[4/3] w-full object-cover" /><button type="button" onClick={stopCamera} className="min-h-11 w-full border-t border-white/10 text-sm text-zinc-300">Fechar câmara</button></div> : <button type="button" onClick={() => void startCamera()} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-zinc-950"><Camera className="size-4" aria-hidden="true" /> Abrir câmara</button>}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
              <div className="flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-300"><ShieldCheck className="size-5" aria-hidden="true" /></div><div><h2 className="font-semibold">Ou introduz o código</h2><p className="text-xs text-zinc-500">O mesmo código é válido como fallback do QR.</p></div></div>
              <form className="mt-5 flex gap-2" onSubmit={(event) => { event.preventDefault(); void validate(); }} aria-busy={busy}>
                <div className="min-w-0 flex-1"><label htmlFor="loyalty-validation-code" className="sr-only">Código da recompensa</label><input id="loyalty-validation-code" autoComplete="off" value={identifier} onChange={(event) => setIdentifier(event.target.value.toUpperCase().slice(0, 256))} placeholder="Ex.: 7K4P9X2M" aria-describedby="loyalty-validation-help" className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm tracking-[0.08em] outline-none focus:border-white/30"/></div><button type="submit" disabled={busy || !identifier.trim()} aria-disabled={busy || !identifier.trim()} className="inline-flex min-w-28 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-zinc-950 disabled:opacity-50">{busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}{busy ? "A validar…" : "Validar"}</button>
              </form>
              <p id="loyalty-validation-help" className="mt-2 text-xs text-zinc-600">Introduz o código recebido pelo cliente. Podes também usar o QR acima.</p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
