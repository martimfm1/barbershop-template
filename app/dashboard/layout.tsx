"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui/spinner";
import { BarbershopProvider } from "@/context/BarbershopContext";

const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [barbershopId, setBarbershopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function loadBarbershopData() {
      try {
        const cookieId = getCookie("barbershop_id");
        if (cookieId) {
          setBarbershopId(cookieId);
          setLoading(false);
          return;
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          console.error("Nenhuma sessão ativa encontrada no browser.");
          router.push("/login");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("barbershop_id")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError || !profile?.barbershop_id) {
          console.warn("Utilizador sem barbershop_id registado.");
          router.push("/onboarding");
          return;
        }

        setBarbershopId(profile.barbershop_id);
      } catch (error) {
        console.error("Erro ao carregar o layout do dashboard:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    loadBarbershopData();
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-950 text-white gap-3">
        <Spinner className="size-6 text-blue-500" />
        <p className="text-xs text-zinc-400 animate-pulse">A carregar o painel...</p>
      </div>
    );
  }

  return (
    <BarbershopProvider>
      {children}
    </BarbershopProvider>
  );
}
