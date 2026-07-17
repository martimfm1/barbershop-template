import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: "text-amber-200 bg-amber-500/10 hover:bg-amber-500/20",
    scheduled: "text-blue-200 bg-blue-500/10 hover:bg-blue-500/20",
    completed: "text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20",
    cancelled: "text-red-200 bg-red-500/10 hover:bg-red-500/20",
  } as const;

  const displayStatus = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Badge
      variant="ghost"
      className={cn(
        "px-3 py-1 font-semibold",
        styles[status as keyof typeof styles] ?? "text-zinc-300 bg-white/5 hover:bg-white/10",
      )}
    >
      {displayStatus}
    </Badge>
  );
}