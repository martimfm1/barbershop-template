import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getAccessPlanForRequest } from "@/services/billing/plan-access.guard";
import { canUseFeature } from "@/lib/billing/entitlements";
import { createClient } from "@/lib/supabase/server";

export default async function LoyaltyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const plan = await getAccessPlanForRequest(user.id);
  if (!canUseFeature(plan, "loyalty")) redirect("/plans?feature=loyalty");

  const supabase = await createClient();
  const { data: rewards } = await supabase.from("loyalty_rewards").select("id,name,description,points_cost,reward_type,reward_value,active").eq("barbershop_id", user.barbershop_id).order("points_cost");

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 p-6 md:p-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Barbers Pro</p>
          <h1 className="text-3xl font-semibold tracking-tight">Fidelização</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Transforma visitas em clientes recorrentes com pontos, recompensas e níveis VIP.</p>
        </div>
        <Link href="/dashboard" className="text-sm font-medium text-primary hover:underline">Voltar ao dashboard</Link>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Pontos", "€1 gasto = 1 ponto", "Define quanto vale cada visita."],
          ["Níveis", "Bronze · Silver · Gold", "Cria progressão para clientes frequentes."],
          ["Recompensas", `${rewards?.length ?? 0} configuradas`, "Oferece benefícios que incentivam o regresso."],
        ].map(([title, value, description]) => (
          <article key={title} className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-2 text-xl font-semibold">{value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div><h2 className="text-lg font-semibold">Recompensas</h2><p className="text-sm text-muted-foreground">Benefícios disponíveis para resgate.</p></div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">PRO</span>
        </div>
        {rewards?.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rewards.map((reward) => (
              <div key={reward.id} className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3"><h3 className="font-medium">{reward.name}</h3><span className="text-sm font-semibold">{reward.points_cost} pts</span></div>
                <p className="mt-2 text-sm text-muted-foreground">{reward.description || "Recompensa de fidelização"}</p>
              </div>
            ))}
          </div>
        ) : <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Ainda não tens recompensas configuradas.</div>}
      </section>
    </main>
  );
}
