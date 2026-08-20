"use client";

import { CalendarDays, Clock3, User } from "lucide-react";
import type { Appointment } from "@/types";
import { StatusBadge } from "@/app/state/_components/shared/StatusBadge";
import { AppointmentActions } from "./appointment-actions";

type Props = React.ComponentProps<typeof AppointmentActions>;

export function AppointmentMobileCard({ appointment, onDetails, ...actionProps }: Props) {
  const date = new Date(appointment.date_hour);
  const phone = appointment.users?.num_phone || appointment.manual_phone;
  const name = appointment.users?.name_complete || appointment.manual_name || "Cliente";

  return (
    <article
      className="space-y-3 py-4 first:pt-0 last:pb-0 cursor-pointer rounded-xl transition-colors hover:bg-white/[0.015]"
      onClick={onDetails}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && onDetails) {
          event.preventDefault();
          onDetails();
        }
      }}
      tabIndex={onDetails ? 0 : undefined}
      role={onDetails ? "button" : undefined}
      aria-label={onDetails ? `Ver detalhes da marcação de ${name}` : undefined}
    >
      <div className="flex items-start justify-between gap-2 px-1">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-zinc-100">{name}</h3>
          {phone ? <a href={`tel:${phone}`} onClick={(event) => event.stopPropagation()} className="mt-0.5 block text-xs text-zinc-400 hover:text-emerald-400">{phone}</a> : <span className="mt-0.5 block text-xs text-zinc-500">Sem telefone</span>}
        </div>
        <StatusBadge status={appointment.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs">
        <div>
          <span className="block text-[10px] uppercase tracking-wide text-zinc-500">Serviço</span>
          <span className="font-medium text-zinc-200">{appointment.services?.name || "Serviço"}</span>
          <span className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-400"><User className="size-3" aria-hidden="true" />{appointment.professionals?.name || "Sem barbeiro"}</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-wide text-zinc-500">Data e hora</span>
          <span className="flex items-center gap-1 font-medium text-zinc-200"><CalendarDays className="size-3" aria-hidden="true" />{date.toLocaleDateString("pt-PT")}</span>
          <span className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-400"><Clock3 className="size-3" aria-hidden="true" />{date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>

      <AppointmentActions appointment={appointment} onDetails={onDetails} {...actionProps} />
    </article>
  );
}
