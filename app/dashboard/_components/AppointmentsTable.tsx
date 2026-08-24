import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/app/state/_components/shared/StatusBadge';
import { Appointment } from '@/types';
import { Trash2, Check } from 'lucide-react';

interface AppointmentsTableProps {
  appointments: Appointment[];
  onFinalize: (id: string) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}

export function AppointmentsTable({
  appointments,
  onFinalize,
  onDelete,
  isPending,
}: AppointmentsTableProps) {
  return (
    <div className="rounded-lg border border-white/5 bg-zinc-900/50 overflow-hidden">
      <Table>
        <TableHeader className="bg-zinc-900 border-white/5">
          <TableRow>
            <TableHead className="text-zinc-400">Client</TableHead>
            <TableHead className="text-zinc-400">Service</TableHead>
            <TableHead className="text-zinc-400">Barber</TableHead>
            <TableHead className="text-zinc-400">Date & Hour</TableHead>
            <TableHead className="text-zinc-400">Status</TableHead>
            <TableHead className="text-right text-zinc-400">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                No appointments scheduled.
              </TableCell>
            </TableRow>
          ) : (
            appointments.map((apt) => (
              <TableRow
                key={apt.id}
                className="border-white/5 hover:bg-white/[0.02]"
              >
                <TableCell className="font-medium text-white">
                  {apt.users?.name_complete || apt.manual_name || 'N/A'}
                </TableCell>
                <TableCell className="text-zinc-300">
                  {apt.services?.name}
                </TableCell>
                <TableCell className="text-zinc-300">
                  {apt.professionals?.name}
                </TableCell>
                <TableCell className="text-zinc-300">
                  {new Date(apt.date_hour).toLocaleString('en-US', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </TableCell>
                <TableCell>
                  <StatusBadge status={apt.status} />
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {apt.status !== 'completed' && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                      disabled={isPending}
                      onClick={() => onFinalize(apt.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                    disabled={isPending}
                    onClick={() => onDelete(apt.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
