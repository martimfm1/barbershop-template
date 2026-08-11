import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Resolves the authenticated user for API requests.
 *
 * Supports both authentication transports used by the application:
 * - Authorization: Bearer <access_token> (API/integrations)
 * - Supabase SSR auth cookies (normal dashboard requests)
 *
 * Dashboard fetch() calls intentionally do not need to manually forward the
 * access token because the browser already carries the Supabase session cookie.
 */
export async function getCurrentUser(req?: Request) {
  try {
    const authHeader = req?.headers.get("Authorization");

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice("Bearer ".length).trim();
      if (!token) return null;

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) return null;

      const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) return user;
    }

    // Normal Next.js dashboard requests authenticate through the SSR cookie.
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    return user;
  } catch (error) {
    console.error("Erro ao autenticar utilizador:", error);
    return null;
  }
}
