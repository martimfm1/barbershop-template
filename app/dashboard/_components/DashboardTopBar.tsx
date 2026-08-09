"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function getGreeting(hour: number) {
  if (hour < 12) return "Bom dia";
  if (hour < 20) return "Boa tarde";
  return "Boa noite";
}

export function DashboardTopBar() {
  const supabase = useMemo(() => createClient(), []);
  const [name, setName] = useState("Utilizador");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const user = data.user;
      const fullName = user?.user_metadata?.name || user?.user_metadata?.full_name;
      const firstName = typeof fullName === "string" && fullName.trim()
        ? fullName.trim().split(/\s+/)[0]
        : user?.email?.split("@")[0] || "Utilizador";
      setName(firstName.charAt(0).toUpperCase() + firstName.slice(1));
    });

    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [supabase]);

  const greeting = getGreeting(now.getHours());
  const time = now.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" });

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-white/5 bg-zinc-950/55 backdrop-blur-xl lg:left-64" aria-label="Resumo do dashboard">
      <div className="mx-auto flex min-h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-100 sm:text-base">
            {greeting}, {name}
          </p>
          <p className="truncate text-xs text-zinc-500">{date}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-zinc-200" aria-label={`Hora atual ${time}`}>
          <Clock3 className="size-4 text-emerald-400" aria-hidden="true" />
          <time className="font-mono text-sm font-medium tabular-nums" dateTime={now.toISOString()}>{time}</time>
        </div>
      </div>
    </header>
  );
}
