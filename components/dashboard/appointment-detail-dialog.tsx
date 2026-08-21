"use client";

import type { ReactNode } from "react";
import { CalendarDays, Clock3, Mail, Phone, UserRound, Wallet } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/app/state/_components/shared/StatusBadge";
import type { Appointment } from "@/types";

type Props = {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function DetailRow({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/8 bg-white/[0.025] p-3.5 transition-colors hover:border-white/12 hover:bg-white/[0.04]">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        <span className="shrink-0 text-zinc-400" aria-hidden="true">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="mt-1.5 min-w-0 break-words text-sm leading-6 text-zinc-100">{value || "—"}</div>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`appointment-detail-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
      <h2
        id={`appointment-detail-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
        className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

export function AppointmentDetailDialog({ appointment, open, onOpenChange }: Props) {
  if (!appointment) return null;

  const date = new Date(appointment.date_hour);
  const clientName = appointment.users?.name_complete || appointment.manual_name || "Cliente";
  const phone = appointment.users?.num_phone || appointment.manual_phone;
  const email = appointment.users?.email || "";
  const birthDate = appointment.users?.birth_date || appointment.manual_birth_date;
  const serviceName = appointment.services?.name || "Serviço";
  const professionalName = appointment.professionals?.name || "Sem barbeiro";
  const extra = Number(appointment.value_products ?? 0);
  const servicePrice = Number(appointment.services?.price ?? 0);
  const total = servicePrice + extra;

  const dateLabel = date.toLocaleDateString("pt-PT", { dateStyle: "full" });
  const timeLabel = date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby="appointment-detail-description"
        className="w-[min(94vw,56rem)] max-w-4xl overflow-hidden border-white/10 bg-zinc-950 p-0 text-white shadow-[0_30px_120px_rgba(0,0,0,0.55)] sm:rounded-3xl"
      >
        <DialogHeader className="sticky top-0 z-10 border-b border-white/8 bg-zinc-950/95 px-5 py-5 backdrop-blur-xl sm:px-7">
          <div className="pr-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="min-w-0">
                <DialogTitle className="break-words text-xl font-semibold tracking-[-0.02em] text-white sm:text-2xl">
                  {clientName}
                </DialogTitle>
                <DialogDescription id="appointment-detail-description" className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">
                  Detalhes completos da marcação, cliente, profissional e pagamento.
                </DialogDescription>
              </div>
              <div className="shrink-0 self-start rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 [&>span]:text-xs">
                <StatusBadge status={appointment.status} />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-400">
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">{dateLabel}</span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">{timeLabel}</span>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-300">{serviceName}</span>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[calc(100dvh-9rem)] overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 sm:py-6">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)] lg:gap-8">
            <div className="space-y-7">
              <DetailSection title="Marcação">
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <DetailRow icon={<CalendarDays className="size-3.5" />} label="Data" value={dateLabel} />
                  <DetailRow icon={<Clock3 className="size-3.5" />} label="Hora" value={timeLabel} />
                  <DetailRow icon={<UserRound className="size-3.5" />} label="Profissional" value={professionalName} />
                  <DetailRow icon={<Clock3 className="size-3.5" />} label="Serviço" value={serviceName} />
                </div>
              </DetailSection>

              <DetailSection title="Cliente">
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <DetailRow
                    icon={<Phone className="size-3.5" />}
                    label="Telefone"
                    value={phone ? <a href={`tel:${phone}`} className="inline-flex min-h-8 items-center rounded-md text-zinc-100 underline decoration-white/20 underline-offset-4 transition-colors hover:text-emerald-300 hover:decoration-emerald-300/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60">{phone}</a> : "Não indicado"}
                  />
                  <DetailRow
                    icon={<Mail className="size-3.5" />}
                    label="Email"
                    value={email ? <a href={`mailto:${email}`} className="inline-flex min-h-8 max-w-full items-center break-all rounded-md text-zinc-100 underline decoration-white/20 underline-offset-4 transition-colors hover:text-emerald-300 hover:decoration-emerald-300/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60">{email}</a> : "Não indicado"}
                  />
                  <DetailRow icon={<CalendarDays className="size-3.5" />} label="Nascimento" value={birthDate ? new Date(birthDate).toLocaleDateString("pt-PT") : "Não indicado"} />
                  <DetailRow icon={<UserRound className="size-3.5" />} label="Cliente registado" value={appointment.client_id ? "Sim" : "Não"} />
                </div>
              </DetailSection>

              {(appointment.users?.style_notes || appointment.description_products) ? (
                <DetailSection title="Notas">
                  <div className="space-y-2.5">
                    {appointment.users?.style_notes ? (
                      <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Preferências / notas do cliente</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{appointment.users.style_notes}</p>
                      </div>
                    ) : null}
                    {appointment.description_products ? (
                      <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Produtos adicionais</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{appointment.description_products}</p>
                      </div>
                    ) : null}
                  </div>
                </DetailSection>
              ) : null}
            </div>

            <aside className="lg:sticky lg:top-0 lg:self-start">
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                  <Wallet className="size-4 text-emerald-300" aria-hidden="true" />
                  Resumo financeiro
                </div>

                <div className="mt-4 divide-y divide-white/8 rounded-xl border border-white/8 bg-black/15">
                  <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                    <span className="text-zinc-500">Serviço</span>
                    <span className="font-medium text-zinc-200">{servicePrice.toFixed(2)} €</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                    <span className="text-zinc-500">Produtos</span>
                    <span className="font-medium text-zinc-200">{extra.toFixed(2)} €</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 px-4 py-4">
                    <span className="text-sm font-semibold text-zinc-300">Total</span>
                    <span className="text-lg font-semibold text-white">{total.toFixed(2)} €</span>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-white/8 bg-black/15 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Pagamento</p>
                  <p className="mt-1.5 text-sm font-medium text-zinc-200">
                    {appointment.payment_method === "cash" ? "Dinheiro" : appointment.payment_method === "mbway" ? "MB WAY" : appointment.payment_method === "card" ? "Cartão" : appointment.payment_method || "Ainda não registado"}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
