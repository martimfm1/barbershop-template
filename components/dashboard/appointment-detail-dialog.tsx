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
    <div className="rounded-xl border border-white/8 bg-white/[0.025] p-3">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{icon}<span>{label}</span></div>
      <div className="mt-1.5 text-sm text-zinc-100">{value || "—"}</div>
    </div>
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[94vw] max-w-2xl rounded-2xl border-white/10 bg-zinc-950 p-0 text-white shadow-2xl">
        <DialogHeader className="border-b border-white/8 px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-4 pr-8"><div className="min-w-0"><DialogTitle className="truncate text-xl font-semibold text-white">{clientName}</DialogTitle><DialogDescription className="mt-1 text-sm text-zinc-400">Detalhes completos da marcação e informação disponível do cliente.</DialogDescription></div><StatusBadge status={appointment.status} /></div>
        </DialogHeader>
        <div className="max-h-[75vh] space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          <section><h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Marcação</h3><div className="grid gap-2 sm:grid-cols-2"><DetailRow icon={<CalendarDays className="size-3.5" />} label="Data" value={date.toLocaleDateString("pt-PT", { dateStyle: "full" })} /><DetailRow icon={<Clock3 className="size-3.5" />} label="Hora" value={date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })} /><DetailRow icon={<UserRound className="size-3.5" />} label="Profissional" value={professionalName} /><DetailRow icon={<Clock3 className="size-3.5" />} label="Serviço" value={serviceName} /></div></section>
          <section><h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Cliente</h3><div className="grid gap-2 sm:grid-cols-2"><DetailRow icon={<Phone className="size-3.5" />} label="Telefone" value={phone ? <a href={`tel:${phone}`} className="transition-colors hover:text-emerald-300">{phone}</a> : "Não indicado"} /><DetailRow icon={<Mail className="size-3.5" />} label="Email" value={email ? <a href={`mailto:${email}`} className="break-all transition-colors hover:text-emerald-300">{email}</a> : "Não indicado"} /><DetailRow icon={<CalendarDays className="size-3.5" />} label="Nascimento" value={birthDate ? new Date(birthDate).toLocaleDateString("pt-PT") : "Não indicado"} /><DetailRow icon={<UserRound className="size-3.5" />} label="Cliente registado" value={appointment.client_id ? "Sim" : "Não"} /></div></section>
          <section><h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Valor</h3><div className="grid gap-2 sm:grid-cols-3"><DetailRow icon={<Wallet className="size-3.5" />} label="Serviço" value={`${servicePrice.toFixed(2)} €`} /><DetailRow icon={<Wallet className="size-3.5" />} label="Produtos" value={`${extra.toFixed(2)} €`} /><DetailRow icon={<Wallet className="size-3.5" />} label="Total" value={<span className="font-semibold text-white">{total.toFixed(2)} €</span>} /></div><div className="mt-2 rounded-xl border border-white/8 bg-white/[0.02] p-3 text-sm text-zinc-300"><span className="text-xs text-zinc-500">Pagamento</span><p className="mt-1">{appointment.payment_method === "cash" ? "Dinheiro" : appointment.payment_method === "mbway" ? "MB WAY" : appointment.payment_method === "card" ? "Cartão" : appointment.payment_method || "Ainda não registado"}</p></div></section>
          {(appointment.users?.style_notes || appointment.description_products) ? <section><h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Notas</h3><div className="space-y-2">{appointment.users?.style_notes ? <div className="rounded-xl border border-white/8 bg-white/[0.025] p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Preferências / notas do cliente</p><p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{appointment.users.style_notes}</p></div> : null}{appointment.description_products ? <div className="rounded-xl border border-white/8 bg-white/[0.025] p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Produtos adicionais</p><p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{appointment.description_products}</p></div> : null}</div></section> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
