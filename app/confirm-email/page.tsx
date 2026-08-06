"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { StarfieldBackground } from "@/components/ui/starfield";
import { Button } from "@/components/ui/button";
import { SiteNavbar } from "@/components/site-navbar";

export default function ConfirmEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const handleResendEmail = async () => {
    if (!email) {
      setResendStatus("error");
      setStatusMessage("Endereço de e-mail não encontrado.");
      return;
    }

    setIsResending(true);
    setResendStatus("idle");

    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    setIsResending(false);

    if (error) {
      setResendStatus("error");
      setStatusMessage(error.message || "Falha ao reenviar e-mail.");
    } else {
      setResendStatus("success");
      setStatusMessage("Novo e-mail de verificação enviado!");
    }
  };

  return (
    <main className="min-h-dvh w-full bg-background text-foreground flex flex-col antialiased selection:bg-zinc-50 selection:text-zinc-950">
      <StarfieldBackground>
        <div className="flex flex-col min-h-dvh w-full">
          <SiteNavbar />

          <section className="flex-1 w-full flex items-center justify-center px-4 py-12 sm:px-8">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-[460px] border border-white/10 bg-zinc-950/85 p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-xl rounded-2xl text-center"
            >
              {/* Ícone Header */}
              <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-inner text-zinc-100">
                <Mail className="size-7" />
              </div>

              <h1 className="font-heading text-2xl font-bold text-zinc-50 tracking-tight">
                Verifica a tua caixa de entrada
              </h1>

              <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                Enviámos um e-mail com o link de confirmação para:
              </p>

              {email && (
                <div className="mt-2 inline-block rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-200">
                  {email}
                </div>
              )}

              <p className="mt-4 text-xs text-zinc-500 leading-relaxed">
                Clica no link dentro do e-mail para ativares a tua conta e acederes à plataforma.
              </p>

              {/* Status de Reenvio */}
              {resendStatus === "success" && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl"
                >
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>{statusMessage}</span>
                </motion.div>
              )}

              {resendStatus === "error" && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl"
                >
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{statusMessage}</span>
                </motion.div>
              )}

              {/* Botões de Ação */}
              <div className="mt-8 flex flex-col gap-3">
                <Button
                  onClick={handleResendEmail}
                  disabled={isResending}
                  variant="outline"
                  className="h-11 w-full rounded-full border-white/10 bg-white/5 text-xs font-semibold text-zinc-200 hover:bg-white/10 hover:text-white transition-all"
                >
                  {isResending ? (
                    <RefreshCw className="size-4 animate-spin text-zinc-300" />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="size-3.5" /> Reenviar e-mail de verificação
                    </span>
                  )}
                </Button>

                <Link href="/login" className="w-full">
                  <Button
                    type="button"
                    className="h-11 w-full rounded-full bg-zinc-50 text-xs font-bold text-zinc-950 hover:bg-white transition-all shadow-md"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <ArrowLeft className="size-4" /> Voltar ao Login
                    </span>
                  </Button>
                </Link>
              </div>
            </motion.div>
          </section>
        </div>
      </StarfieldBackground>
    </main>
  );
}