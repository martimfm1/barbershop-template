"use client";

import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { type BookingFormProps } from "@/types";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";

export function BookingForm({ clients, services, professionals, loading, formData, setFormData, selectedProfessionalId, setSelectedProfessionalId, selectedDate, setSelectedDate, selectedTime, onSubmit }: BookingFormProps) {
  const [birthDate, setBirthDate] = useState("");

  return (
    <Card className="animate-in fade-in slide-in-from-top-4 border border-emerald-500/20 bg-black/40 backdrop-blur-md duration-200">
      <CardHeader><CardTitle className="flex gap-2 text-emerald-400"><Plus className="size-5" aria-hidden="true" /> Nova marcação</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid items-end gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-2 lg:col-span-2">
            <label className="text-xs text-zinc-400" htmlFor="booking-client">Cliente existente (opcional)</label>
            <Combobox value={formData.clientId || ""} onValueChange={(val) => {
              const cl = clients.find((c) => c.id === val);
              if (cl) {
                setFormData({ ...formData, clientId: cl.id, name_complete: cl.name_complete, num_phone: cl.num_phone, email: cl.email || "" });
                setBirthDate(cl.birth_date || "");
              }
            }}>
              <ComboboxInput id="booking-client" placeholder="Pesquisar cliente…" className="border-white/10 bg-zinc-900 text-white" />
              <ComboboxContent className="border-white/10 bg-zinc-900 text-white"><ComboboxList><ComboboxEmpty>Nenhum cliente encontrado.</ComboboxEmpty>{clients.map((c) => <ComboboxItem key={c.id} value={c.id}>{c.name_complete}</ComboboxItem>)}</ComboboxList></ComboboxContent>
            </Combobox>
          </div>

          <div className="grid gap-2"><label className="text-xs text-zinc-400" htmlFor="booking-name">Nome do cliente</label><input id="booking-name" required placeholder="Nome completo" className="rounded-lg border border-white/10 bg-white/5 p-2.5 text-sm text-white" value={formData.name_complete} onChange={(e) => setFormData({ ...formData, clientId: "", name_complete: e.target.value })} /></div>
          <div className="grid gap-2"><label className="text-xs text-zinc-400" htmlFor="booking-phone">Telemóvel</label><input id="booking-phone" required placeholder="+351 9xx xxx xxx" type="tel" className="rounded-lg border border-white/10 bg-white/5 p-2.5 text-sm text-white" value={formData.num_phone} onChange={(e) => setFormData({ ...formData, clientId: "", num_phone: e.target.value })} /></div>
          <div className="grid gap-2"><label className="text-xs text-zinc-400" htmlFor="booking-birth-date">Data de nascimento</label><input id="booking-birth-date" name="manual_birth_date" type="date" max={new Date().toISOString().slice(0, 10)} className="color-scheme-dark rounded-lg border border-white/10 bg-white/5 p-2.5 text-sm text-white" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} /><p className="text-[11px] text-zinc-500">Opcional. Usada para aniversários e analytics.</p></div>

          <div className="grid gap-2"><label className="text-xs text-zinc-400" htmlFor="booking-barber">Barbeiro</label><Select value={selectedProfessionalId} onValueChange={setSelectedProfessionalId}><SelectTrigger id="booking-barber" className="cursor-pointer border-white/10 bg-zinc-900 text-white"><SelectValue placeholder="Selecionar" /></SelectTrigger><SelectContent className="cursor-pointer border-white/10 bg-zinc-900 text-white"><SelectGroup>{professionals.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectGroup></SelectContent></Select></div>
          <div className="grid gap-2"><label className="text-xs text-zinc-400" htmlFor="booking-service">Serviço</label><Select value={formData.service_id} onValueChange={(val) => setFormData({ ...formData, service_id: val })}><SelectTrigger id="booking-service" className="cursor-pointer border-white/10 bg-zinc-900 text-white"><SelectValue placeholder="Selecionar" /></SelectTrigger><SelectContent className="cursor-pointer border-white/10 bg-zinc-900 text-white"><SelectGroup>{services.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} ({Number(s.price).toFixed(2)}€)</SelectItem>)}</SelectGroup></SelectContent></Select></div>
          <div className="grid gap-2"><label className="text-xs text-zinc-400">Data</label><Popover><PopoverTrigger asChild><Button type="button" variant="ghost" className={cn("justify-start border border-white/10 bg-white/5 text-white hover:bg-white/10", !selectedDate && "text-muted-foreground")}><CalendarIcon className="mr-2 size-4" aria-hidden="true" />{selectedDate ? format(new Date(selectedDate + "T00:00:00"), "PPP") : "Escolher data"}</Button></PopoverTrigger><PopoverContent className="w-auto cursor-pointer border-zinc-800 bg-zinc-900 p-0"><Calendar mode="single" selected={selectedDate ? new Date(selectedDate + "T00:00:00") : undefined} onSelect={(d) => d && setSelectedDate(format(d, "yyyy-MM-dd"))} /></PopoverContent></Popover></div>
          <div className="grid gap-2"><label className="text-xs text-zinc-400" htmlFor="booking-time">Hora</label><input id="booking-time" type="time" required className="color-scheme-dark cursor-pointer rounded-lg border border-white/10 bg-white/5 p-2.5 text-sm text-white" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} /></div>
          <Button type="submit" disabled={loading} variant="ghost" className="h-10 w-full cursor-pointer bg-emerald-600 text-white hover:bg-emerald-500">{loading ? <Spinner className="mr-2" /> : "Guardar marcação"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
