"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface BarbershopContextType {
  barbershopId: string | null;
  barbershopAvatarUrl: string | null;
  loading: boolean;
}

const BarbershopContext = createContext<BarbershopContextType>({
  barbershopId: null,
  barbershopAvatarUrl: null,
  loading: true,
});

const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
};

export function BarbershopProvider({ children }: { children: React.ReactNode }) {
  const [barbershopId, setBarbershopId] = useState<string | null>(null);
  const [barbershopAvatarUrl, setBarbershopAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function loadBarbershopData() {
      try {
        const cookieId = getCookie("barbershop_id");
        let resolvedBarbershopId = cookieId;

        if (!resolvedBarbershopId) {
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

          resolvedBarbershopId = profile.barbershop_id;
          setBarbershopId(resolvedBarbershopId);
        } else {
          setBarbershopId(resolvedBarbershopId);
        }

        if (resolvedBarbershopId) {
          const { data: barbershop } = await supabase
            .from("barbershops")
            .select("avatar_url")
            .eq("id", resolvedBarbershopId)
            .maybeSingle();

          if (barbershop?.avatar_url) {
            setBarbershopAvatarUrl(barbershop.avatar_url);
          } else {
            const { data: publicUrl } = supabase.storage
              .from("avatars")
              .getPublicUrl(`avatar/${resolvedBarbershopId}/avatar.webp`);

            setBarbershopAvatarUrl(publicUrl.publicUrl || null);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar o layout do dashboard:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    loadBarbershopData();
  }, [router]);

  return (
    <BarbershopContext.Provider value={{ barbershopId, barbershopAvatarUrl, loading }}>
      {children}
    </BarbershopContext.Provider>
  );
}

export function useBarbershop() {
  const context = useContext(BarbershopContext);
  if (!context) {
    throw new Error("useBarbershop deve ser usado dentro de um BarbershopProvider");
  }
  return context;
}