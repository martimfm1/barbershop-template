"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Mail, Phone, Send, Smartphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useBarbershop } from "@/context/BarbershopContext";

interface Client {
  id: string;
  name_complete?: string | null;
  name?: string | null;
  email?: string | null;
  num_phone?: string | null;
}

const templates = {
  reminder: {
    label: "Lembrete de marcação",
    subject: "Lembrete da sua marcação",
    body: "Olá {{nome}},\n\nEstamos a enviar-lhe um lembrete da sua próxima marcação na {{barbearia}}.\n\nSe precisar de alterar a marcação, entre em contacto connosco.\n\nObrigado,\n{{barbearia}}",
  },
  thanks: {
    label: "Obrigado pela visita",
    subject: "Obrigado pela sua visita",
    body: "Olá {{nome}},\n\nObrigado por visitar a {{barbearia}}. Esperamos voltar a recebê-lo em breve.\n\nAté à próxima!\n{{barbearia}}",
  },
  custom: {
    label: "Mensagem personalizada",
    subject: "",
    body: "Olá {{nome}},\n\n",
  },
} as const;

type TemplateKey = keyof typeof templates;

export default function MensagensPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [template, setTemplate] = useState<TemplateKey>("reminder");
  const [subject, setSubject] = useState<string>(templates.reminder.subject);
  const [body, setBody] = useState<string>(templates.reminder.body);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [shopName, setShopName] = useState<string>("a sua barbearia");
  const { barbershopId } = useBarbershop();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Carregar clientes
        const clientsResponse = await fetch("/api/crm/clients?limit=100", { cache: "no-store" });
        const clientsData = await clientsResponse.json();
        if (!clientsResponse.ok) throw new Error(clientsData.error || "Não foi possível carregar os clientes.");
        setClients(clientsData.clients ?? []);

        // Carregar nome da barbearia se barbershopId existir
        if (barbershopId) {
          const shopResponse = await fetch(`/api/barbershops/${barbershopId}`, { cache: "no-store" });
          if (shopResponse.ok) {
            const shopData = await shopResponse.json();
            if (shopData.name) {
              setShopName(shopData.name);
            }
          }
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, [barbershopId]);

  const selectedClient = useMemo(() => clients.find((client) => client.id === clientId), [clients, clientId]);

  const applyTemplate = (next: TemplateKey) => {
    setTemplate(next);
    setSubject(templates[next].subject);
    setBody(templates[next].body);
  };

  const preview = body
    .replaceAll("{{nome}}", selectedClient?.name_complete || selectedClient?.name || "Nome do cliente")
    .replaceAll("{{barbearia}}", shopName);

  const sendEmail = async () => {
    if (!clientId) return toast.error("Selecione um cliente.");
    if (!subject.trim() || !body.trim()) return toast.error("Preencha o assunto e a mensagem.");

    setSending(true);
    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, template, subject, body }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível enviar o email.");
      toast.success("Email enviado com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 pb-24 pt-24 text-foreground sm:px-6 lg:px-8 lg:pt-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Comunicação</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-50">Mensagens</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Envie mensagens manuais aos seus clientes através de email, usando templates prontos ou uma mensagem personalizada.</p>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-zinc-100"><Mail className="size-5 text-emerald-400" aria-hidden="true" /> Email</CardTitle>
              <CardDescription>O nome da sua barbearia será usado automaticamente como remetente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="client">Destinatário</Label>
                <Select value={clientId} onValueChange={setClientId} disabled={loading}>
                  <SelectTrigger id="client" className="min-h-11 bg-black/20"><SelectValue placeholder={loading ? "A carregar clientes…" : "Selecionar cliente"} /></SelectTrigger>
                  <SelectContent>
                    {clients.filter((client) => client.email).map((client) => (
                      <SelectItem key={client.id} value={client.id}>{client.name_complete || client.name || "Cliente"} — {client.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template">Template</Label>
                <Select value={template} onValueChange={(value) => applyTemplate(value as TemplateKey)}>
                  <SelectTrigger id="template" className="min-h-11 bg-black/20"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(templates).map(([key, item]) => <SelectItem key={key} value={key}>{item.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="subject">Assunto</Label>
                  <span className="text-xs text-zinc-500">{subject.length}/180</span>
                </div>
                <Input id="subject" value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={180} className="min-h-11 bg-black/20" />
                {subject.length >= 180 && <p className="text-xs text-amber-400">Limite de caracteres atingido.</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="body">Mensagem</Label>
                  <span className="text-xs text-zinc-500">{body.length}/8000</span>
                </div>
                <Textarea id="body" value={body} onChange={(event) => setBody(event.target.value)} maxLength={8000} className="min-h-52 resize-y bg-black/20 leading-6" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Use {'{{nome}}'} e {'{{barbearia}}'}</span>
                  {body.length >= 8000 && <p className="text-xs text-amber-400">Limite de caracteres atingido.</p>}
                </div>
              </div>

              {selectedClient && !selectedClient.email && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                  <p className="text-sm text-amber-300">Este cliente não tem um endereço de email registado. Não é possível enviar email.</p>
                </div>
              )}

              <Button type="button" onClick={sendEmail} disabled={sending || !clientId || !selectedClient?.email} className="min-h-11 w-full sm:w-auto">
                <Send className="mr-2 size-4" aria-hidden="true" />{sending ? "A enviar…" : "Enviar email"}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card className="border-white/10 bg-white/[0.03]">
              <CardHeader><CardTitle className="text-base">Pré-visualização</CardTitle><CardDescription>Assim verá o cliente o conteúdo principal.</CardDescription></CardHeader>
              <CardContent>
                <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{subject || "Sem assunto"}</p>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-200">{preview}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.03]">
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Smartphone className="size-4" aria-hidden="true" /> Telemóvel</CardTitle><CardDescription>Mensagens SMS estão temporariamente indisponíveis.</CardDescription></CardHeader>
              <CardContent>
                <div className="rounded-xl border border-dashed border-white/10 bg-zinc-950/60 p-4">
                  <Badge variant="secondary" className="mb-3">Desativado</Badge>
                  <p className="text-sm leading-6 text-zinc-400">O envio por SMS permanece desligado enquanto o fornecedor de SMS não estiver ativo.</p>
                  <Button type="button" disabled className="mt-4 w-full"><Phone className="mr-2 size-4" aria-hidden="true" /> Enviar SMS</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
