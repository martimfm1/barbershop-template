import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RegistoPage() {
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (user) redirect("/plans");
  redirect("/login?tab=register");
}
