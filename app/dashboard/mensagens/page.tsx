'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Mail,
  Phone,
  Send,
  Smartphone,
  Eye,
  ShieldCheck,
  Cake,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useBarbershop } from '@/context/BarbershopContext';

interface Client {
  id: string;
  name_complete?: string | null;
  name?: string | null;
  email?: string | null;
  num_phone?: string | null;
}

const templates = {
  reminder: {
    label: 'Lembrete de marcação',
    subject: 'Lembrete da sua marcação',
    body: 'Olá {{nome}},\n\nEstamos a enviar-lhe um lembrete da sua próxima marcação na {{barbearia}}.\n\nSe precisar de alterar a marcação, entre em contacto connosco.\n\nObrigado,\n{{barbearia}}',
  },
  thanks: {
    label: 'Obrigado pela visita',
    subject: 'Obrigado pela sua visita',
    body: 'Olá {{nome}},\n\nObrigado por visitar a {{barbearia}}. Esperamos voltar a recebê-lo em breve.\n\nAté à próxima!\n{{barbearia}}',
  },
  custom: {
    label: 'Mensagem personalizada',
    subject: '',
    body: 'Olá {{nome}},\n\n',
  },
} as const;

type TemplateKey = keyof typeof templates;

export default function MensagensPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState('');
  const [template, setTemplate] = useState<TemplateKey>('reminder');
  const [subject, setSubject] = useState<string>(templates.reminder.subject);
  const [body, setBody] = useState<string>(templates.reminder.body);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [shopName, setShopName] = useState<string>('a sua barbearia');
  const { barbershopId } = useBarbershop();

  useEffect(() => {
    const loadData = async () => {
      try {
        const clientsResponse = await fetch('/api/crm/clients?limit=100', {
          cache: 'no-store',
        });
        const clientsData = await clientsResponse.json();
        if (!clientsResponse.ok)
          throw new Error(
            clientsData.error || 'Não foi possível carregar os clientes.',
          );
        setClients(clientsData.clients ?? []);

        if (barbershopId) {
          const shopResponse = await fetch(`/api/barbershops/${barbershopId}`, {
            cache: 'no-store',
          });
          if (shopResponse.ok) {
            const shopData = await shopResponse.json();
            if (shopData.name) setShopName(shopData.name);
          }
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Erro ao carregar dados.',
        );
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, [barbershopId]);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === clientId),
    [clients, clientId],
  );

  const applyTemplate = (next: TemplateKey) => {
    setTemplate(next);
    setSubject(templates[next].subject);
    setBody(templates[next].body);
  };

  const preview = body
    .replaceAll(
      '{{nome}}',
      selectedClient?.name_complete ||
        selectedClient?.name ||
        'Nome do cliente',
    )
    .replaceAll('{{barbearia}}', shopName);

  const sendEmail = async () => {
    if (!clientId) return toast.error('Selecione um cliente.');
    if (!selectedClient?.email)
      return toast.error('O cliente selecionado não tem email.');
    if (!subject.trim() || !body.trim())
      return toast.error('Preencha o assunto e a mensagem.');

    setSending(true);
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          template,
          subject: subject.trim(),
          body: body.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'Não foi possível enviar o email.');
      toast.success('Email enviado com sucesso.');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao enviar email.',
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="dashboard-page min-h-screen bg-background px-4 pb-24 pt-24 text-foreground sm:px-6 lg:px-8 lg:pt-10">
      <div className="mx-auto max-w-6xl space-y-7">
        <header className="dashboard-page-header border-b border-white/10 pb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
              <Mail className="size-4" aria-hidden="true" /> Comunicação
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
              Mensagens
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Envia emails personalizados aos teus clientes sem complicar o
              processo.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              variant="outline"
              className="min-h-11 border-emerald-500/20 bg-emerald-500/5 text-emerald-300 hover:bg-emerald-500/10"
            >
              <Link href="/dashboard/mensagens/birthdays">
                <Cake className="mr-2 size-4" />
                Aniversários
                <ArrowUpRight className="ml-1 size-3.5" />
              </Link>
            </Button>
            <Badge
              variant="secondary"
              className="w-fit gap-1.5 border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
            >
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Email seguro
            </Badge>
          </div>
        </header>

        <Card className="overflow-hidden border-amber-500/15 bg-amber-500/[0.04]">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-300">
                <Cake className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-100">
                  Automação de aniversários
                </p>
                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  Transforma uma data importante numa oportunidade de voltar a
                  contactar o cliente.
                </p>
              </div>
            </div>
            <Button
              asChild
              variant="outline"
              className="shrink-0 border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.07]"
            >
              <Link href="/dashboard/mensagens/birthdays">
                Gerir automação
                <ArrowUpRight className="ml-2 size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Card className="dashboard-card min-w-0 border-white/10 bg-white/[0.03]">
            <CardHeader className="border-b border-white/10 pb-5">
              <CardTitle className="flex items-center gap-2 text-zinc-100">
                <Mail className="size-5 text-emerald-400" aria-hidden="true" />
                Nova mensagem
              </CardTitle>
              <CardDescription>
                Escolhe um cliente, usa um template e ajusta apenas o
                necessário.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-2">
                <Label htmlFor="client">Destinatário</Label>
                <Select
                  value={clientId}
                  onValueChange={setClientId}
                  disabled={loading}
                >
                  <SelectTrigger
                    id="client"
                    className="min-h-11 w-full bg-black/20"
                  >
                    <SelectValue
                      placeholder={
                        loading ? 'A carregar clientes…' : 'Selecionar cliente'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {clients
                      .filter((client) => client.email)
                      .map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name_complete || client.name || 'Cliente'} —{' '}
                          {client.email}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="template">Template</Label>
                  <Select
                    value={template}
                    onValueChange={(value) =>
                      applyTemplate(value as TemplateKey)
                    }
                  >
                    <SelectTrigger
                      id="template"
                      className="min-h-11 bg-black/20"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(templates).map(([key, item]) => (
                        <SelectItem key={key} value={key}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="subject">Assunto</Label>
                    <span className="text-xs tabular-nums text-zinc-500">
                      {subject.length}/180
                    </span>
                  </div>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    maxLength={180}
                    className="min-h-11 bg-black/20"
                  />
                  <p className="text-xs text-zinc-500">
                    Um assunto curto torna a mensagem mais fácil de compreender.
                  </p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="body">Mensagem</Label>
                    <span className="text-xs tabular-nums text-zinc-500">
                      {body.length}/8000
                    </span>
                  </div>
                  <Textarea
                    id="body"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    maxLength={8000}
                    className="min-h-56 resize-y bg-black/20 leading-6"
                  />
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <span>Variáveis disponíveis:</span>
                    <code className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5">
                      {'{{nome}}'}
                    </code>
                    <code className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5">
                      {'{{barbearia}}'}
                    </code>
                  </div>
                </div>
              </div>
              {selectedClient && !selectedClient.email && (
                <div
                  role="alert"
                  className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300"
                >
                  Este cliente não tem email registado. Escolhe outro cliente ou
                  atualiza o contacto primeiro.
                </div>
              )}
              <Button
                type="button"
                onClick={sendEmail}
                disabled={sending || !clientId || !selectedClient?.email}
                className="min-h-11 w-full sm:w-auto"
              >
                <Send className="mr-2 size-4" aria-hidden="true" />
                {sending ? 'A enviar…' : 'Enviar email'}
              </Button>
            </CardContent>
          </Card>

          <aside
            className="space-y-5"
            aria-label="Pré-visualização da mensagem"
          >
            <Card className="dashboard-card overflow-hidden border-white/10 bg-white/[0.03]">
              <CardHeader className="border-b border-white/10 pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Eye className="size-4 text-emerald-400" aria-hidden="true" />
                  Pré-visualização
                </CardTitle>
                <CardDescription>
                  Vê o resultado final antes de enviar.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-5">
                <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950 shadow-xl">
                  <div className="border-b border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                        <Mail className="size-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-100">
                          {shopName}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          para {selectedClient?.email || 'cliente@exemplo.pt'}
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 break-words text-sm font-semibold text-zinc-100">
                      {subject || 'Sem assunto'}
                    </p>
                  </div>
                  <div className="min-h-48 p-4 sm:p-5">
                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-zinc-300">
                      {preview || 'A tua mensagem aparecerá aqui.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="dashboard-card border-white/10 bg-white/[0.03]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Smartphone className="size-4" aria-hidden="true" />
                  Telemóvel
                </CardTitle>
                <CardDescription>
                  O envio manual por SMS está temporariamente desativado.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-dashed border-white/10 bg-zinc-950/60 p-4">
                  <Badge variant="secondary" className="mb-3">
                    Desativado
                  </Badge>
                  <p className="text-sm leading-6 text-zinc-400">
                    Quando o serviço SMS for ativado, esta área poderá ser
                    disponibilizada sem alterar o compositor de email.
                  </p>
                  <Button
                    type="button"
                    disabled
                    className="mt-4 min-h-11 w-full"
                  >
                    <Phone className="mr-2 size-4" aria-hidden="true" />
                    Enviar SMS
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}
