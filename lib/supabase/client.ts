import { createBrowserClient } from "@supabase/ssr";

let supabaseBrowserInstance: any = null;

export function createClient() {
  if (supabaseBrowserInstance) return supabaseBrowserInstance;

  supabaseBrowserInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return supabaseBrowserInstance;
}