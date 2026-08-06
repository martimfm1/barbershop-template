import { FormEvent } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface LoginParams {
  event: FormEvent<HTMLFormElement>;
  setIsSubmitting: (loading: boolean) => void;
  setErrorMsg: (msg: string | null) => void;
}

interface LoginResponse {
  error?: string;
  session?: { access_token: string; refresh_token: string };
  user?: { barbershopId?: string | null };
}

export async function handleLogin({
  event,
  setIsSubmitting,
  setErrorMsg,
}: LoginParams) {
  event.preventDefault();
  setIsSubmitting(true);
  setErrorMsg(null);

  const supabase = createClient();
  const formData = new FormData(event.currentTarget);
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const contentType = res.headers.get("content-type");
    let result: LoginResponse = {};

    if (contentType && contentType.includes("application/json")) {
      result = await res.json();
    } else {
      const fallbackText = await res.text();
      throw new Error(
        fallbackText || `Server responded with status ${res.status}`,
      );
    }

    if (!res.ok) {
      const errorText = result.error || "Credenciais inválidas.";
      toast.error(errorText);
      setErrorMsg(errorText);
      return;
    }

    // Sincroniza a sessão no browser se a API retornar os tokens
    if (result.session) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
      });

      if (sessionError) {
        console.error(
          "❌ Failed to sync session on client:",
          sessionError.message,
        );
      }
    }

    // O teu backend já valida se o utilizador tem barbearia e envia no JSON
    if (!result.user?.barbershopId) {
      window.location.href = "/onboarding";
    } else {
      window.location.href = "/dashboard";
    }
  } catch (error: unknown) {
    const targetError =
      error instanceof Error
        ? error.message
        : "Erro de ligação. Por favor, tenta novamente.";
    toast.error(targetError);
    console.error("❌ Error during login:", error);
    setErrorMsg(targetError);
  } finally {
    setIsSubmitting(false);
  }
}

interface RegisterParams {
  event: FormEvent<HTMLFormElement>;
  setIsSubmitting: (loading: boolean) => void;
  setErrorMsg: (msg: string | null) => void;
  acceptedTerms: boolean;
  termsErrorMessage?: string;
}

export async function handleRegister({
  event,
  setIsSubmitting,
  setErrorMsg,
  acceptedTerms,
  termsErrorMessage = "Deves aceitar os termos e condições.",
}: RegisterParams) {
  event.preventDefault();

  if (!acceptedTerms) {
    toast.error(termsErrorMessage);
    return;
  }

  setIsSubmitting(true);
  setErrorMsg(null);

  const formData = new FormData(event.currentTarget);
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const password = formData.get("password") as string;

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name_complete: name,
        email,
        num_phone: phone,
        password,
      }),
    });

    const contentType = res.headers.get("content-type");
    let data: { error?: string } = {};

    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const fallbackText = await res.text();
      throw new Error(
        fallbackText || `Server responded with status ${res.status}`,
      );
    }

    if (!res.ok) {
      throw new Error(data.error || "Falha ao criar conta.");
    }

    // Faz login automático no browser após o registo bem-sucedido
    window.location.assign(`/login?email=${encodeURIComponent(email)}`);
  } catch (error) {
    const targetError =
      error instanceof Error
        ? error.message
        : "Erro de ligação. Por favor, tenta novamente.";
    toast.error(targetError);
    console.error("❌ Error during registration:", error);
    setErrorMsg(targetError);
  } finally {
    setIsSubmitting(false);
  }
}
