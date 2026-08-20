"use client";

import type { Appointment } from "@/types";
import { StatusBadge } from "@/app/state/_components/shared/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User } from "lucide-react";
import { AppointmentActions } from "./appointment-actions";

type ActionProps = Omit<React.ComponentProps<typeof AppointmentActions>, "appointment" | "onDetails">;

type Props = ActionProps & {
  appointments: Appointment[];
  onDetails: (appointment: Appointment) => void;
};

export function AppointmentsTable({ appointments, onDetails, ...actionProps }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-white/10 hover:bg-transparent">
          <TableHead className="text-zinc-400">Cliente</TableHead>
          <TableHead className="text-zinc-400">Serviço / Profissional</TableHead>
          <TableHead className="text-zinc-400">Data e hora</TableHead>
          <TableHead className="text-zinc-400">Estado</TableHead>
          <TableHead className="text-right text-zinc-400">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {appointments.map((appointment) => {
          const date = new Date(appointment.date_hour);
          const phone = appointment.users?.num_phone || appointment.manual_phone;
          const name = appointment.users?.name_complete || appointment.manual_name || "Cliente";

          return (
            <TableRow
              key={appointment.id}
              tabIndex={0}
              role="button"
              className="cursor-pointer border-white/5 hover:bg-white/[0.03] focus-visible:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/15"
              onClick={() => onDetails(appointment)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onDetails(appointment);
                }
              }}
              aria-label={`Ver detalhes da marcação de ${name}`}
            >
              <TableCell className="font-semibold text-zinc-100">
                <div className="flex flex-col">
                  <span>{name}</span>
                  <span className="text-[11px] font-normal text-zinc-500">{phone || "Sem telefone"}</span>
                </div>
              </TableCell>
              <TableCell className="text-zinc-300">
                <div className="flex flex-col">
                  <span>{appointment.services?.name || "Serviço"}</span>
                  <span className="flex items-center gap-1 text-[11px] text-zinc-500"><User className="size-3" aria-hidden="true" />{appointment.professionals?.name || "Sem barbeiro"}</span>
                </div>
              </TableCell>
              <TableCell className="text-zinc-300">
                {date.toLocaleDateString("pt-PT")} <span className="ml-1.5 text-zinc-500">{date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}</span>
              </TableCell>
              <TableCell><StatusBadge status={appointment.status} /></TableCell>
              <TableCell onClick={(event) => event.stopPropagation()}>
                <AppointmentActions appointment={appointment} onDetails={() => onDetails(appointment)} compact {...actionProps} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
