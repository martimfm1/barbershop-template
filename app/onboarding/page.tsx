"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  PlusCircle,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { StarfieldBackground } from "@/components/ui/starfield";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

type Step = "selection" | "create" | "join";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Ocorreu um erro inesperado";
}

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("selection");
  const [loading, setLoading] = useState(false);
  const [shopName, setShopName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  async function handleCreateShop(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/onboarding/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: shopName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar barbearia");

      toast.success("Barbearia criada com sucesso!");
      window.location.href = `/dashboard`;
    } catch (error) {
      console.error(error);
      toast.error("Erro ao criar barbearia");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinShop(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/onboarding/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Código inválido");

      toast.success("Sincronizado com sucesso!");
      window.location.href = "/dashboard";
    } catch (error) {
      toast.error(getErrorMessage(error) || "Erro ao processar convite");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden antialiased">
      <StarfieldBackground>
        <section className="flex flex-1 flex-col items-center justify-center px-4 py-12 w-full max-w-md mx-auto">
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="w-full border border-white/10 bg-zinc-950/40 shadow-2xl shadow-black/80 backdrop-blur-xl rounded-2xl overflow-hidden p-6"
          >
            <AnimatePresence mode="wait">
              {/* PASSO 1: SELEÇÃO INICIAL */}
              {step === "selection" && (
                <motion.div
                  key="selection"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <CardHeader className="p-0 text-center">
                    <div className="mx-auto size-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                      <Sparkles className="size-5 text-zinc-400" />
                    </div>
                    <CardTitle className="font-heading text-xl text-zinc-50 tracking-tight">
                      Configura o teu espaço
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      Escolha como deseja começar a gerir os seus agendamentos.
                    </CardDescription>
                  </CardHeader>

                  <div className="grid gap-3">
                    <button
                      onClick={() => setStep("create")}
                      className="cursor-pointer group flex items-center gap-4 w-full p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-left transition-all duration-300"
                    >
                      <div className="size-10 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-950 shadow-md">
                        <PlusCircle className="size-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xs font-semibold text-zinc-50">
                          Criar Nova Barbearia
                        </h3>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Serei o administrador principal do ecossistema.
                        </p>
                      </div>
                      <ArrowRight className="size-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                    </button>

                    <button
                      onClick={() => setStep("join")}
                      className="cursor-pointer group flex items-center gap-4 w-full p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-left transition-all duration-300"
                    >
                      <div className="size-10 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400">
                        <UserPlus className="size-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xs font-semibold text-zinc-50">
                          Associar a Barbearia Existente
                        </h3>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Introduzir um código de convite da minha equipa.
                        </p>
                      </div>
                      <ArrowRight className="size-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* PASSO 2: CRIAR NOVA BARBEARIA */}
              {step === "create" && (
                <motion.form
                  key="create"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleCreateShop}
                  className="space-y-4"
                >
                  <button
                    type="button"
                    onClick={() => setStep("selection")}
                    className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-2"
                  >
                    <ArrowLeft className="size-3.5" /> Voltar
                  </button>

                  <CardHeader className="p-0">
                    <CardTitle className="font-heading text-lg text-zinc-50">
                      Criar Novo Espaço
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      Crie a identidade da sua barbearia para ativar o Bot de
                      WhatsApp.
                    </CardDescription>
                  </CardHeader>

                  <div className="grid gap-1.5">
                    <Label
                      htmlFor="shop-name"
                      className="text-xs text-zinc-400"
                    >
                      Nome da Barbearia
                    </Label>
                    <div className="relative group">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                      <Input
                        id="shop-name"
                        required
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        placeholder="Ex: Barber Shop Central"
                        className="h-11 text-xs border-white/10 bg-white/5 pl-10 text-zinc-50 placeholder:text-zinc-600 rounded-xl focus-visible:border-white/30"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !shopName}
                    className="cursor-pointer h-11 w-full rounded-full bg-zinc-50 text-xs font-bold text-zinc-950 hover:bg-zinc-300 active:scale-[0.98] transition-all mt-2"
                  >
                    {loading ? (
                      <Spinner className="size-4 text-zinc-950" />
                    ) : (
                      "Inicializar Barbearia"
                    )}
                  </Button>
                </motion.form>
              )}

              {/* PASSO 3: ASSOCIAR A UMA EXISTENTE */}
              {step === "join" && (
                <motion.form
                  key="join"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleJoinShop}
                  className="space-y-4"
                >
                  <button
                    type="button"
                    onClick={() => setStep("selection")}
                    className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-2"
                  >
                    <ArrowLeft className="size-3.5" /> Voltar
                  </button>

                  <CardHeader className="p-0">
                    <CardTitle className="font-heading text-lg text-zinc-50">
                      Inserir Código de Convite
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      Peça o código de acesso gerado no painel de administração
                      da sua barbearia.
                    </CardDescription>
                  </CardHeader>

                  <div className="grid gap-1.5">
                    <Label
                      htmlFor="invite-code"
                      className="text-xs text-zinc-400"
                    >
                      Código de Convite
                    </Label>
                    <Input
                      id="invite-code"
                      required
                      value={inviteCode}
                      onChange={(e) =>
                        setInviteCode(e.target.value.toUpperCase())
                      }
                      placeholder="EX: BB-98X2"
                      maxLength={10}
                      className="h-11 text-center font-mono tracking-widest text-xs border-white/10 bg-white/5 text-zinc-50 placeholder:text-zinc-600 rounded-xl focus-visible:border-white/30"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !inviteCode}
                    className="h-11 w-full rounded-full bg-zinc-50 text-xs font-bold text-zinc-950 hover:bg-white active:scale-[0.98] transition-all mt-2"
                  >
                    {loading ? (
                      <Spinner className="size-4 text-zinc-950" />
                    ) : (
                      "Vincular à Equipa"
                    )}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </section>
      </StarfieldBackground>
    </main>
  );
}
