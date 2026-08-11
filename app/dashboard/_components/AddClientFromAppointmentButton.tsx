"use client";

import { UserPlus, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AddClientFromAppointmentButtonProps {
  onAdd: () => void | Promise<void>;
  loading?: boolean;
  alreadyAdded?: boolean;
  className?: string;
}

export function AddClientFromAppointmentButton({
  onAdd,
  loading = false,
  alreadyAdded = false,
  className,
}: AddClientFromAppointmentButtonProps) {
  if (alreadyAdded) {
    return (
      <span className={cn("inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-emerald-500/15 bg-emerald-500/5 px-3 text-xs font-medium text-emerald-400", className)}>
        <Check className="size-3.5" aria-hidden="true" />
        Cliente na lista
      </span>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={loading}
      onClick={() => void onAdd()}
      className={cn("min-h-9 gap-1.5 border-white/10 bg-white/[0.03] text-xs text-zinc-200 hover:bg-white/[0.07]", className)}
    >
      {loading ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <UserPlus className="size-3.5" aria-hidden="true" />}
      {loading ? "A adicionar…" : "Adicionar aos clientes"}
    </Button>
  );
}
