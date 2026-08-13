"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock3, LogOut, Mail, MapPin, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";

type Appointment = { id: string; dateHour: string; durationMinutes: number; status: string; serviceName: string; servicePrice: number; professionalName: string | null; barbershopName: string; barbershopAddress: string | null };

const formatDate = (value: string) => new Intl.DateTimeFormat("pt-PT", { dateStyle: "full", timeStyle: "short" }).format(new Date(value));
const status = (value: string) => ({ scheduled: "Confirmada", pending: "Pendente", cancelled: "Cancelada", completed: "Concluída" } as Record<string, string>)[value] ?? value;

export default function MyBookingsPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [past, setPast] = useState<Appointment[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch("/api/customer-portal/appointments", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Não foi possível carregar as marcações.");
    setSessionEmail(data.email);
    setUpcoming(data.upcoming || []);
    setPast(data.past || []);
  }

  useEffect(() => { load().catch(() => undefined); }, []);

  async function requestCode(event: FormEvent) {
    event.preventDefault(); setBusy(true);
    try {
      const response = await fetch("/api/customer-portal/request-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível enviar o código.");
      setStep("code"); toast.success("Código enviado por email.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível enviar o código."); }
    finally { setBusy(false); }
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault(); setBusy(true);
    try {
      const response = await fetch("/api/customer-portal/verify-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Código inválido.");
      await load(); toast.success("Email confirmado.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Código inválido."); }
    finally { setBusy(false); }
  }

  async function cancel(id: string) {
    if (!confirm("Cancelar esta marcação?")) return;
    const response = await fetch(`/api/customer-portal/appointments/${id}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return toast.error(data.error || "Não foi possível cancelar.");
    await load(); toast.success("Marcação cancelada.");
  }

  async function reschedule(item: Appointment) {
    const date = prompt("Nova data (YYYY-MM-DD):", item.dateHour.slice(0, 10));
    if (!date) return;
    const slot = prompt("Novo horário (HH:MM):", item.dateHour.slice(11, 16));
    if (!slot) return;
    const response = await fetch(`/api/customer-portal/appointments/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date, slot }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return toast.error(data.error || "Não foi possível reagendar.");
    await load(); toast.success("Marcação reagendada.");
  }

  async function logout() {
    await fetch("/api/customer-portal/logout", { method: "POST" });
    setSessionEmail(null); setUpcoming([]); setPast([]); setStep("email"); setCode("");
  }

  return <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 sm:px-6 sm:py-12">
    <div className="mx-auto w-full max-w-5xl">
      <header className="mb-8 flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-zinc-500">Silentra</p><h1 className="mt-2 text-2xl font-bold sm:text-3xl">As minhas marcações</h1><p className="mt-2 text-sm text-zinc-400">Confirma o teu email para consultar e gerir as reservas associadas.</p></div>{sessionEmail && <button onClick={logout} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm"><LogOut className="size-4"/> Sair</button>}</header>

      {!sessionEmail ? <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/[.03] p-6">{step === "email" ? <form onSubmit={requestCode} className="space-y-4"><div className="flex size-10 items-center justify-center rounded-xl bg-white/5"><Mail className="size-5"/></div><div><h2 className="font-semibold">Confirmar email</h2><p className="mt-1 text-sm text-zinc-400">Enviamos um código de 6 dígitos.</p></div><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nome@email.com" className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4"/><button disabled={busy} className="h-12 w-full rounded-xl bg-white font-semibold text-zinc-950 disabled:opacity-50">{busy ? "A enviar…" : "Enviar código"}</button></form> : <form onSubmit={verifyCode} className="space-y-4"><div><h2 className="font-semibold">Introduz o código</h2><p className="mt-1 text-sm text-zinc-400">Verifica o email {email}.</p></div><input required inputMode="numeric" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g, "").slice(0,6))} placeholder="000000" className="h-14 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-center text-2xl tracking-[.3em]"/><button disabled={busy || code.length!==6} className="h-12 w-full rounded-xl bg-white font-semibold text-zinc-950 disabled:opacity-50">{busy ? "A confirmar…" : "Confirmar email"}</button><button type="button" onClick={()=>{setStep("email");setCode("")}} className="w-full text-xs text-zinc-500">Usar outro email</button></form>}</div> : <div className="space-y-8"><div className="rounded-xl border border-white/10 bg-white/[.03] p-4 text-sm">Sessão confirmada: <strong>{sessionEmail}</strong></div><section><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-semibold">Próximas marcações</h2><p className="text-sm text-zinc-500">Reservas futuras.</p></div><button onClick={()=>load().catch(e=>toast.error(e.message))} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs"><RefreshCw className="size-3.5"/> Atualizar</button></div>{upcoming.length===0?<div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-500">Não tens próximas marcações.</div>:<div className="grid gap-4 lg:grid-cols-2">{upcoming.map(item=><article key={item.id} className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><div><p className="text-xs uppercase tracking-wide text-zinc-500">{item.barbershopName}</p><h3 className="mt-1 font-semibold">{item.serviceName}</h3></div><div className="mt-5 space-y-3 text-sm text-zinc-300"><div className="flex gap-3"><CalendarDays className="size-4 shrink-0 text-zinc-500"/><span className="capitalize">{formatDate(item.dateHour)}</span></div><div className="flex gap-3"><Clock3 className="size-4 shrink-0 text-zinc-500"/><span>{item.durationMinutes} min{item.professionalName ? ` · ${item.professionalName}` : ""}</span></div>{item.barbershopAddress&&<div className="flex gap-3"><MapPin className="size-4 shrink-0 text-zinc-500"/><span>{item.barbershopAddress}</span></div>}</div><div className="mt-5 grid grid-cols-2 gap-2"><button onClick={()=>reschedule(item)} className="min-h-11 rounded-xl border border-white/10 text-sm">Reagendar</button><button onClick={()=>cancel(item.id)} className="min-h-11 rounded-xl border border-red-400/20 text-sm text-red-300">Cancelar</button></div></article>)}</div>}</section><section><h2 className="mb-4 text-lg font-semibold">Histórico</h2>{past.length===0?<div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-500">Sem histórico.</div>:<div className="space-y-2">{past.map(item=><div key={item.id} className="flex items-center gap-3 rounded-xl border border-white/10 p-4"><XCircle className="size-4 text-zinc-500"/><div><p className="text-sm">{item.serviceName} · {item.barbershopName}</p><p className="text-xs text-zinc-500">{formatDate(item.dateHour)} · {status(item.status)}</p></div></div>)}</div>}</section></div>}
      <p className="mt-8 text-center text-xs text-zinc-600"><Link href="/barbershops" className="hover:text-zinc-400">Explorar barbearias</Link></p>
    </div>
  </main>;
}
