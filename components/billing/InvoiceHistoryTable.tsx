"use client";

import { Download, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { BillingInvoice } from "@/hooks/useBillingPortal";

export function InvoiceHistoryTable({ invoices, loading }: { invoices: BillingInvoice[]; loading: boolean }) {
  if (loading) return <div className="space-y-3"><Skeleton className="h-11 w-full bg-white/5" /><Skeleton className="h-11 w-full bg-white/5" /></div>;
  if (!invoices.length) return <div className="flex min-h-32 flex-col items-center justify-center gap-2 text-center text-sm text-zinc-500"><FileText className="size-5" />Ainda não existem faturas.</div>;
  return <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-500"><tr><th className="px-3 py-3">Data</th><th className="px-3 py-3">Plano</th><th className="px-3 py-3">Valor</th><th className="px-3 py-3">Estado</th><th className="px-3 py-3 text-right">Documento</th></tr></thead><tbody>{invoices.map((invoice) => {
    const paid = invoice.status === "paid";
    return <tr key={invoice.id} className="border-b border-white/5 text-zinc-300"><td className="px-3 py-4">{invoice.date}</td><td className="px-3 py-4 font-medium text-zinc-100">{invoice.plan}</td><td className="px-3 py-4 font-medium text-zinc-100">{new Intl.NumberFormat("pt-PT", { style: "currency", currency: invoice.currency }).format(invoice.amount / 100)}</td><td className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-xs ${paid ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>{paid ? "Paga" : "Pendente"}</span></td><td className="px-3 py-4 text-right">{invoice.invoice_pdf ? <a href={invoice.invoice_pdf} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300"><Download className="size-3.5" />Download PDF</a> : <span className="text-xs text-zinc-600">Indisponível</span>}</td></tr>;
  })}</tbody></table></div>;
}
