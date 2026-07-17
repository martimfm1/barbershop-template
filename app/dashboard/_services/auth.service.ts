import { createClient } from "@/lib/supabase/client";

export type AuthResponse<T = null> = {
  data: T | null;
  error: Error | null;
};

export interface UserSessionProfile {
  id: string;
  email: string | undefined;
  role: string | undefined;
  barbershop_id?: string;
}

export async function logout(): Promise<AuthResponse<null>> {
  const supabase = createClient();

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(
        `[Supabase Auth Error]: ${error.message} (Status: ${error.status})`,
      );
    }

    return { data: null, error: null };
  } catch (error) {
    console.error("❌ [Service Exception - authService.logout]:", error);

    return {
      data: null,
      error:
        error instanceof Error
          ? error
          : new Error("Erro inesperado ao encerrar a sessão."),
    };
  }
}

export async function getCurrentUser(): Promise<
  AuthResponse<UserSessionProfile>
> {
  const supabase = createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      throw new Error(`[Supabase User Fetch Error]: ${authError.message}`);
    }

    if (!user) {
      throw new Error("Nenhum utilizador ativo encontrado na sessão.");
    }

    const { data: publicUserData, error: dbError } = await supabase
      .from("users")
      .select("role, barbershop_id")
      .eq("id", user.id)
      .single();

    if (dbError) {
      console.warn(
        "⚠️ [Aviso]: Não foi possível obter o cargo customizado da DB:",
        dbError.message,
      );
    }

    const profile: UserSessionProfile = {
      id: user.id,
      email: user.email,
      role: publicUserData?.role || user.role,
      barbershop_id: publicUserData?.barbershop_id,
    };

    return { data: profile, error: null };
  } catch (error) {
    console.error(
      "❌ [Service Exception - authService.getCurrentUser]:",
      error,
    );
    return {
      data: null,
      error:
        error instanceof Error
          ? error
          : new Error("Falha ao recuperar sessão do utilizador."),
    };
  }
}

export const authService = {
  logout,
  getCurrentUser,
} as const;
