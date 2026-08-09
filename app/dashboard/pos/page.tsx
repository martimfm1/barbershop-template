"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Lock, RefreshCcw, RotateCcw, Undo2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type PosItem = {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
};

type Transaction = {
  id: string;
  status: string;
  payment_method: string;
  subtotal: number;
  discount: number;
  total: number;
  created_at: string;
  pos_transaction_items?: PosItem[];
};

async function authHeaders() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Sessão expirada. Volta a iniciar sessão.");
  return { Authorization: `Bearer ${session.access_token}` };
}

const money = (value: number) =>
  new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(Number(value) || 0);

export default function POSPage() {
  const { hasFeature, loading: billingLoading } = useFeatureAccess();
  const allowed = hasFeature("pos");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [reversing, setReversing] = useState<string | null>(null);

  async function loadTransactions() {
    setLoading(true);
    try {
      const response = await fetch("/api/enterprise/pos", {
        headers: await authHeaders(),
        cache: "no-store",
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Não foi possível carregar o POS.");
      setTransactions(json.transactions ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar o POS.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!billingLoading && allowed) void loadTransactions();
  }, [billingLoading, allowed]);

  async function reverseTransaction(transaction: Transaction, mode: "refund" | "void") {
    const label = mode === "refund" ? "reembolsar" : "anular";
    const confirmed = window.confirm(
      `Confirma ${label} a transação de ${money(transaction.total)}? O stock dos produtos será reposto automaticamente.`,
    );
    if (!confirmed) return;

    setReversing(transaction.id);
    try {
      const response = await fetch(`/api/enterprise/pos/${transaction.id}/reversal`, {
        method: "POST",
        headers: { ...(await authHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Não foi possível reverter a transação.");
      setTransactions((current) =>
        current.map((item) => item.id === transaction.id ? { ...item, status: json.transaction.status } : item),
      );
      toast.success(mode === "refund" ? "Transação reembolsada." : "Transação anulada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao reverter a transação.");
    } finally {
      setReversing(null);
    }
  }

  if (billingLoading) return <main className="min-h-screen bg-background" />;

  if (!allowed) {
    return (
      <main className="min-h-screen bg-background px-4 py-24 text-foreground">
        <div className="mx-auto max-w-2xl">
          <Card className="border-white/10 bg-white/[0.03]">
            <CardContent className="flex flex-col items-center gap-5 py-16 text-center">
              <div className="rounded-2xl bg-primary/10 p-4 text-primary"><Lock className="h-7 w-7" /></div>
              <div>
                <h1 className="text-2xl font-semibold">POS</h1>
                <p className="mt-2 text-muted-foreground">Vendas, pagamentos, stock e reembolsos num único fluxo Enterprise.</p>
              </div>
              <Button asChild><Link href="/dashboard/billing">Fazer upgrade</Link></Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-20 text-foreground sm:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-medium text-primary">ENTERPRISE · POS</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Ponto de venda</h1>
            <p className="mt-2 text-muted-foreground">Consulta vendas e gere reversões com reposição automática de stock.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void loadTransactions()} disabled={loading}>
              <RefreshCcw className="mr-2 h-4 w-4" /> Atualizar
            </Button>
            <Button variant="outline" asChild><Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Dashboard</Link></Button>
          </div>
        </header>

        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader><CardTitle>Histórico de transações</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-12 text-center text-muted-foreground">A carregar transações...</p>
            ) : transactions.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">Ainda não existem transações.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="border-b border-white/10 text-left text-muted-foreground">
                    <tr><th className="px-3 py-3">Data</th><th className="px-3 py-3">Itens</th><th className="px-3 py-3">Pagamento</th><th className="px-3 py-3">Total</th><th className="px-3 py-3">Estado</th><th className="px-3 py-3 text-right">Ações</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {transactions.map((transaction) => {
                      const reversible = transaction.status === "completed";
                      return (
                        <tr key={transaction.id}>
                          <td className="px-3 py-4 text-muted-foreground">{new Date(transaction.created_at).toLocaleString("pt-PT")}</td>
                          <td className="max-w-[260px] px-3 py-4">{(transaction.pos_transaction_items ?? []).map((item) => `${item.description} × ${item.quantity}`).join(", ") || "—"}</td>
                          <td className="px-3 py-4 capitalize">{transaction.payment_method}</td>
                          <td className="px-3 py-4 font-medium">{money(transaction.total)}</td>
                          <td className="px-3 py-4"><span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs capitalize">{transaction.status}</span></td>
                          <td className="px-3 py-4">
                            {reversible ? (
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" disabled={reversing === transaction.id} onClick={() => void reverseTransaction(transaction, "refund")}>
                                  <Undo2 className="mr-1.5 h-3.5 w-3.5" /> Reembolsar
                                </Button>
                                <Button size="sm" variant="ghost" disabled={reversing === transaction.id} onClick={() => void reverseTransaction(transaction, "void")}>
                                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Anular
                                </Button>
                              </div>
                            ) : <span className="block text-right text-xs text-muted-foreground">Sem ações</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
