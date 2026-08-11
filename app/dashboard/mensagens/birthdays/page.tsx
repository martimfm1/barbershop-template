"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Cake,
  Check,
  Eye,
  Lock,
  Mail,
  Save,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useBarbershop } from "@/context/BarbershopContext";

const DEFAULT_SUBJECT = "Feliz aniversário, {{nome}}! 🎉";

const DEFAULT_BODY = `Olá {{nome}},

Toda a equipa da {{barbearia}} deseja-te um excelente aniversário! 🎉

Esperamos voltar a ver-te em breve.

Um abraço,
{{barbearia}}`;

function renderPreview(
  template: string,
  nome: string,
  barbearia: string,
): string {
  return template
    .replaceAll("{{nome}}", nome)
    .replaceAll("{{barbearia}}", barbearia)
    .replaceAll("{{booking_url}}", "https://silentra.me/barbearias");
}

export default function BirthdaysPage() {
  const { hasFeature, loading: featureLoading } = useFeatureAccess();
  const { barbershopId } = useBarbershop();

  const [enabled, setEnabled] = useState(false);
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [barbershopName, setBarbershopName] = useState("A tua barbearia");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [previewClientName] = useState("João Silva");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const available = hasFeature("automated_followups");

  useEffect(() => {
    if (featureLoading || !barbershopId || !available) return;

    const load = async () => {
      try {
        const response = await fetch("/api/messages/birthdays", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Não foi possível carregar a automação.",
          );
        }

        setEnabled(data.automation?.enabled === true);
        setSubject(data.automation?.subject || DEFAULT_SUBJECT);
        setBody(data.automation?.body || DEFAULT_BODY);
        setBarbershopName(data.branding?.name || "A tua barbearia");
        setAvatarUrl(data.branding?.avatarUrl || null);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a automação.",
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [available, barbershopId, featureLoading]);

  const save = async () => {
    if (!available) return;

    if (!subject.trim() || !body.trim()) {
      toast.error("Preenche o assunto e a mensagem antes de guardar.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/messages/birthdays", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled,
          subject,
          body,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível guardar.");
      }

      setEnabled(data.automation.enabled === true);
      toast.success("Automação de aniversários guardada.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível guardar.",
      );
    } finally {
      setSaving(false);
    }
  };

  const previewSubject = renderPreview(
    subject,
    previewClientName,
    barbershopName,
  );
  const previewBody = renderPreview(body, previewClientName, barbershopName);

  if (!featureLoading && !available) {
    return (
      <main className="min-h-screen bg-zinc-950 px-4 pb-24 pt-20 text-zinc-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/dashboard/mensagens"
            className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-200"
          >
            <ArrowLeft className="size-4" />
            Voltar às mensagens
          </Link>

          <Card className="overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] via-white/[0.03] to-transparent">
            <CardContent className="p-8 sm:p-12">
              <div className="mb-6 flex size-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
                <Lock className="size-6 text-emerald-400" />
              </div>

              <Badge className="mb-4 border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                PRO · ENTERPRISE
              </Badge>

              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Aniversários automáticos
              </h1>

              <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-400">
                Cria uma relação mais próxima com os teus clientes enviando
                automaticamente um email personalizado no dia do aniversário.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {["Envio automático", "Template personalizado", "Variáveis dinâmicas"].map(
                  (item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-300"
                    >
                      <Check className="mb-3 size-4 text-emerald-400" />
                      {item}
                    </div>
                  ),
                )}
              </div>

              <Button asChild className="mt-8 min-h-11">
                <Link href="/dashboard/billing">Fazer upgrade para Pro</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 pb-24 pt-20 text-zinc-100 sm:px-6 lg:px-8 lg:pt-10">
      <div className="mx-auto max-w-6xl space-y-7">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <Link
              href="/dashboard/mensagens"
              className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-200"
            >
              <ArrowLeft className="size-4" />
              Mensagens
            </Link>

            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
              <Cake className="size-4" />
              Automação
            </div>

            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Aniversários
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Envia automaticamente um email aos clientes no dia do
              aniversário. A automação só considera clientes com data de
              nascimento e email registados.
            </p>
          </div>

          <Badge className="w-fit gap-1.5 border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
            <Sparkles className="size-3.5" />
            Pro
          </Badge>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-5">
            <Card className="border-white/10 bg-white/[0.03]">
              <CardHeader className="border-b border-white/10 pb-5">
                <CardTitle className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2">
                    <Cake className="size-5 text-emerald-400" />
                    Envio automático
                  </span>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    aria-label="Activar envio automático de aniversários"
                    onClick={() => setEnabled((value) => !value)}
                    disabled={loading || saving}
                    className={`relative h-7 w-12 rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      enabled
                        ? "border-emerald-400/40 bg-emerald-500"
                        : "border-white/10 bg-zinc-800"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute top-1 size-5 rounded-full bg-white shadow transition-transform ${
                        enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </CardTitle>

                <CardDescription>
                  {enabled
                    ? "A automação está activa e será processada diariamente."
                    : "Activa quando quiseres começar a enviar os emails."}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-5">
                <div
                  className={`rounded-xl border p-4 text-sm ${
                    enabled
                      ? "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-200"
                      : "border-white/10 bg-white/[0.02] text-zinc-400"
                  }`}
                >
                  <span className="font-medium">
                    {enabled ? "Automação activa" : "Automação desactivada"}
                  </span>
                  <p className="mt-1 text-xs opacity-80">
                    Cada cliente só recebe uma mensagem por aniversário.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.03]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="size-5 text-emerald-400" />
                  Template do email
                </CardTitle>
                <CardDescription>
                  Personaliza a mensagem que os teus clientes vão receber.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="birthday-subject">Assunto</Label>
                    <span className="text-xs text-zinc-600">
                      {subject.length}/180
                    </span>
                  </div>

                  <Input
                    id="birthday-subject"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    maxLength={180}
                    className="min-h-11 bg-black/20"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="birthday-body">Mensagem</Label>
                    <span className="text-xs text-zinc-600">
                      {body.length}/8000
                    </span>
                  </div>

                  <Textarea
                    id="birthday-body"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    maxLength={8000}
                    className="min-h-64 resize-y bg-black/20 leading-6"
                  />
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="mb-2 text-xs font-medium text-zinc-400">
                    Variáveis disponíveis
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {["{{nome}}", "{{barbearia}}", "{{booking_url}}"].map(
                      (item) => (
                        <code
                          key={item}
                          className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-emerald-300"
                        >
                          {item}
                        </code>
                      ),
                    )}
                  </div>

                  <p className="mt-3 text-xs leading-5 text-zinc-500">
                    <strong className="text-zinc-400">Exemplo:</strong> no
                    email, <code className="text-zinc-300">{"{{nome}}"}</code>{" "}
                    torna-se o nome real do cliente e{" "}
                    <code className="text-zinc-300">{"{{barbearia}}"}</code>{" "}
                    torna-se o nome real da tua barbearia.
                  </p>
                </div>

                <Button
                  onClick={save}
                  disabled={loading || saving}
                  className="min-h-11 w-full sm:w-auto"
                >
                  <Save className="mr-2 size-4" />
                  {saving ? "A guardar…" : "Guardar alterações"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <aside>
            <Card className="overflow-hidden border-white/10 bg-white/[0.03]">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Eye className="size-4 text-emerald-400" />
                  Pré-visualização
                </CardTitle>
                <CardDescription>
                  Exemplo com os dados reais da tua barbearia.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 sm:p-5">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-xl">
                  <div className="border-b border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-center gap-3">
                      {avatarUrl ? (
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-xl border border-white/10">
                          <img
                            src={avatarUrl}
                            alt={barbershopName}
                            width={40}
                            height={40}
                            className="size-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                          <Cake className="size-5 text-emerald-400" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {barbershopName}
                        </p>
                        <p className="text-xs text-zinc-500">Comunicação</p>
                      </div>
                    </div>

                    <p className="mt-5 text-sm font-semibold">
                      {previewSubject}
                    </p>
                  </div>

                  <div className="min-h-64 p-5">
                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-zinc-300">
                      {previewBody}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}
