"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Clock,
  AlertCircle,
  Check,
  Loader2,
  Scissors,
  User,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Mail,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import type {
  BookingDayOption,
  BookingDrawerProps,
  MarketplaceBookingResponse,
  MarketplaceProfessional,
} from "@/_types/marketplace/booking";
import type { MarketplaceService } from "@/_types/marketplace/shops";

function getNextDays(count = 7): BookingDayOption[] {
  const days: BookingDayOption[] = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const isoDate = `${year}-${month}-${day}`;

    const weekdayShort = d.toLocaleDateString("pt-PT", { weekday: "short" });
    const fullDate = d.toLocaleDateString("pt-PT", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    days.push({
      dateStr: isoDate,
      weekdayShort: weekdayShort.replace(".", "").toUpperCase(),
      dayNumeric: d.getDate(),
      fullDateFormatted: fullDate.charAt(0).toUpperCase() + fullDate.slice(1),
      isToday: i === 0,
    });
  }
  return days;
}

export function BookingDrawer({
  shop,
  isOpen,
  onClose,
  onSuccess,
}: BookingDrawerProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const nextDays = useMemo(() => getNextDays(7), []);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const [services, setServices] = useState<MarketplaceService[]>([]);
  const [selectedService, setSelectedService] =
    useState<MarketplaceService | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isClosed, setIsClosed] = useState(false);

  const [professionals, setProfessionals] = useState<MarketplaceProfessional[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<
    MarketplaceProfessional | "any"
  >("any");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentDay = nextDays[selectedDayIndex];

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  const target = e.target;
  setTimeout(() => {
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 300); // 300ms é o tempo médio que o teclado do telemóvel demora a abrir
};

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedDayIndex(0);
      setSelectedProfessional("any");
      setSelectedSlot(null);
      setHasError(false);
      setErrorMessage("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !shop) return;

    let isMounted = true;
    const shopId = shop.id;

    async function fetchBookingData() {
      setIsLoading(true);
      setSelectedSlot(null);

      try {
        const response = await fetch(
          `/api/shops/${shopId}/booking-data?date=${currentDay.dateStr}`,
        );

        if (!response.ok) {
          throw new Error("Falha ao carregar informações de disponibilidade.");
        }

        const data: MarketplaceBookingResponse = await response.json();

        if (!isMounted) return;

        const fetchedServices = data.services || [];
        setServices(fetchedServices);

        if (fetchedServices.length > 0 && !selectedService) {
          setSelectedService(fetchedServices[0]);
        }

        setIsClosed(data.isClosed ?? false);
        setAvailableSlots(data.availableSlots || []);
        if (data.professionals) {
          setProfessionals(data.professionals);
        }
      } catch (err) {
        console.error("Erro ao carregar dados de marcação:", err);
        toast.error("Erro ao carregar horários disponíveis.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchBookingData();

    return () => {
      isMounted = false;
    };
  }, [shop?.id, isOpen, currentDay.dateStr]);

  const handleConfirm = async () => {
    if (!shop || !selectedService || !selectedSlot) return;

    if (
      !customerName.trim() ||
      !customerPhone.trim() ||
      !customerEmail.trim()
    ) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setIsSubmitting(true);
    setHasError(false);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: shop.id,
          service: selectedService.id,
          date: currentDay.dateStr,
          slot: selectedSlot,
          professionalId:
            selectedProfessional === "any" ? null : selectedProfessional.id,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const successData = {
          shopName: shop.name,
          serviceName: selectedService.name,
          date: currentDay.dateStr,
          time: selectedSlot,
          customerEmail: customerEmail.trim(),
        };

        toast.success("Agendamento efetuado com sucesso!");
        setStep(4);

        if (onSuccess) {
          onSuccess(successData);
        }
      } else {
        const errorMsg =
          data.error ||
          "Não foi possível concluir o agendamento. Este horário já não está disponível.";

        setErrorMessage(errorMsg);
        setHasError(true);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error("Erro ao enviar marcação:", err);
      const networkErrMsg = "Sem ligação ao servidor. Tenta novamente.";
      setErrorMessage(networkErrMsg);
      setHasError(true);
      toast.error(networkErrMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!shop) return null;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* max-h-[88dvh] garante que nunca passa da altura do ecrã do telemóvel */}
      <DrawerContent className="mx-auto flex flex-col max-h-[88dvh] sm:max-h-[85vh] max-w-lg border-zinc-800 bg-zinc-950 p-4 text-zinc-100 touch-manipulation">
        
        {/* HEADER FIXO (shrink-0) */}
        <DrawerHeader className="shrink-0 px-0 pt-0 pb-3 text-left border-b border-white/5">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg font-bold text-zinc-100 truncate pr-2 sm:text-xl">
              {hasError
                ? "Erro no Agendamento"
                : step === 4
                  ? "Confirmação"
                  : shop.name}
            </DrawerTitle>

            {!hasError && step < 4 && (
              <div className="flex items-center gap-1 shrink-0">
                {[1, 2, 3].map((s, idx) => (
                  <React.Fragment key={s}>
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                        step >= s
                          ? "bg-zinc-100 text-zinc-950"
                          : "bg-zinc-850 text-zinc-600 border border-zinc-800"
                      }`}
                    >
                      {s}
                    </span>
                    {idx < 2 && <span className="h-[2px] w-2.5 bg-zinc-800" />}
                  </React.Fragment>
                ))}
              </div>
            )}

            {!hasError && step === 4 && (
              <span className="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Concluído
              </span>
            )}

            {hasError && (
              <span className="flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-400">
                <AlertCircle className="h-3.5 w-3.5" /> Falhou
              </span>
            )}
          </div>

          <DrawerDescription className="text-xs text-zinc-400 mt-0.5">
            {hasError && "Surgiu um problema com o teu agendamento"}
            {!hasError && step === 1 && "1. Escolhe o serviço, dia e hora"}
            {!hasError && step === 2 && "2. Escolhe o barbeiro da tua preferência"}
            {!hasError && step === 3 && "3. Preenche os teus dados de contacto"}
            {!hasError && step === 4 && "Agendamento concluído com sucesso"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto min-h-0 pt-3 pr-0.5 overscroll-contain">
          
          {/* ECRÃ DE ERRO */}
          {hasError ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-4 text-center animate-in zoom-in-95 duration-200">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-400">
                <XCircle className="h-7 w-7 stroke-[2.5]" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-zinc-100">
                  Não foi possível reservar
                </h3>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                  Desculpa, não conseguimos concluir o agendamento neste horário.
                </p>
              </div>

              <div className="flex w-full items-start gap-3 rounded-2xl border border-rose-800/40 bg-rose-950/30 p-3.5 text-left">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                <div className="text-xs leading-relaxed text-rose-200/90">
                  <span className="font-semibold text-rose-300">Detalhe:</span>{" "}
                  {errorMessage}
                </div>
              </div>

              <p className="text-[11px] text-zinc-500">
                Podes escolher outro horário disponível ou tentar novamente.
              </p>
            </div>
          ) : (
            <>
              {/* PASSO 1 */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                  {/* SERVIÇO */}
                  <div>
                    <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      <Scissors className="h-3.5 w-3.5 text-zinc-400" />
                      <span>Serviço</span>
                    </div>

                    <div className="flex max-w-full gap-2.5 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-none">
                      {services.length === 0 && !isLoading ? (
                        <div className="py-2 text-xs text-zinc-500">
                          Nenhum serviço disponível.
                        </div>
                      ) : (
                        services.map((service) => {
                          const isSelected = selectedService?.id === service.id;
                          return (
                            <button
                              key={service.id}
                              type="button"
                              onClick={() => setSelectedService(service)}
                              className={`flex min-w-[130px] flex-shrink-0 flex-col justify-between rounded-2xl border p-3 text-left transition-all active:scale-[0.98] snap-start ${
                                isSelected
                                  ? "border-zinc-100 bg-zinc-100 font-semibold text-zinc-950 shadow-md"
                                  : "border-white/5 bg-zinc-900/50 text-zinc-300 hover:border-zinc-700 active:bg-zinc-800"
                              }`}
                            >
                              <span className="text-xs font-bold leading-snug line-clamp-2">
                                {service.name}
                              </span>
                              <div className="mt-2.5 flex items-center justify-between text-[11px]">
                                <span
                                  className={
                                    isSelected ? "text-zinc-700" : "text-zinc-400"
                                  }
                                >
                                  {service.durationMinutes}m
                                </span>
                                <span className="font-extrabold text-xs">
                                  €{service.price?.toFixed(2) ?? "0.00"}
                                </span>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* DIA */}
                  <div>
                    <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      <span>Dia</span>
                      <span className="text-[10px] lowercase text-zinc-500">
                        (desliza)
                      </span>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-none">
                      {nextDays.map((day, idx) => {
                        const isSelected = idx === selectedDayIndex;
                        return (
                          <button
                            key={day.dateStr}
                            type="button"
                            onClick={() => setSelectedDayIndex(idx)}
                            className={`flex min-w-[58px] flex-1 flex-col items-center justify-center rounded-2xl border py-2.5 transition-all active:scale-[0.98] snap-start ${
                              isSelected
                                ? "border-zinc-100 bg-zinc-100 font-bold text-zinc-950 shadow-md"
                                : "border-white/5 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 active:bg-zinc-800"
                            }`}
                          >
                            <span className="text-[10px] font-bold tracking-tight uppercase">
                              {day.isToday ? "Hoje" : day.weekdayShort}
                            </span>
                            <span className="mt-0.5 text-base font-black leading-none">
                              {day.dayNumeric}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* HORAS */}
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider">
                        <Clock className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Horas Livres:</span>
                      </div>
                      <span className="text-[11px] font-medium text-zinc-300">
                        {currentDay.fullDateFormatted}
                      </span>
                    </div>

                    {isLoading ? (
                      <div className="flex h-24 items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                      </div>
                    ) : isClosed || availableSlots.length === 0 ? (
                      <div className="my-1 flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-zinc-900/40 p-5 text-center">
                        <AlertCircle className="h-7 w-7 text-zinc-500 stroke-1" />
                        <h4 className="mt-1.5 text-xs font-bold text-zinc-200">
                          Sem vagas para esta data
                        </h4>
                        <p className="mt-0.5 text-[11px] text-zinc-400">
                          Escolhe outro dia acima.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {availableSlots.map((slot) => {
                          const isSelected = selectedSlot === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`flex h-10 items-center justify-center rounded-xl border text-xs font-bold transition-all active:scale-[0.98] ${
                                isSelected
                                  ? "border-zinc-100 bg-zinc-100 text-zinc-950 shadow-md"
                                  : "border-white/5 bg-zinc-900/60 text-zinc-200 hover:border-zinc-700 active:bg-zinc-800"
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PASSO 2 */}
              {step === 2 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-200">
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-zinc-300">
                    <UserCheck className="h-4 w-4 text-zinc-400" />
                    <span>Quem queres que faça o corte?</span>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setSelectedProfessional("any")}
                      className={`flex w-full items-center justify-between rounded-2xl border p-3.5 transition-all active:scale-[0.98] ${
                        selectedProfessional === "any"
                          ? "border-zinc-100 bg-zinc-100 font-semibold text-zinc-950 shadow-md"
                          : "border-white/5 bg-zinc-900/50 text-zinc-300 hover:border-zinc-700 active:bg-zinc-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full ${
                            selectedProfessional === "any"
                              ? "bg-zinc-950 text-white"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold">Sem preferência</p>
                          <p
                            className={`text-[11px] ${
                              selectedProfessional === "any"
                                ? "text-zinc-700"
                                : "text-zinc-400"
                            }`}
                          >
                            Primeiro barbeiro disponível
                          </p>
                        </div>
                      </div>
                      {selectedProfessional === "any" && (
                        <Check className="h-4 w-4 stroke-[2.5]" />
                      )}
                    </button>

                    {professionals.length > 0 ? (
                      professionals.map((pro) => {
                        const isSelected =
                          selectedProfessional !== "any" &&
                          selectedProfessional.id === pro.id;
                        return (
                          <button
                            key={pro.id}
                            type="button"
                            onClick={() => setSelectedProfessional(pro)}
                            className={`flex w-full items-center justify-between rounded-2xl border p-3.5 transition-all active:scale-[0.98] ${
                              isSelected
                                ? "border-zinc-100 bg-zinc-100 font-semibold text-zinc-950 shadow-md"
                                : "border-white/5 bg-zinc-900/50 text-zinc-300 hover:border-zinc-700 active:bg-zinc-800"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold uppercase ${
                                  isSelected
                                    ? "bg-zinc-950 text-white"
                                    : "bg-zinc-800 text-zinc-200"
                                }`}
                              >
                                {pro.name.charAt(0)}
                              </div>
                              <div className="text-left">
                                <p className="text-xs font-bold">{pro.name}</p>
                                <p
                                  className={`text-[11px] ${
                                    isSelected ? "text-zinc-700" : "text-zinc-400"
                                  }`}
                                >
                                  {pro.role || "Barbeiro"}
                                </p>
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="h-4 w-4 stroke-[2.5]" />
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <p className="py-4 text-center text-xs text-zinc-500">
                        Esta barbearia não tem colaboradores registados.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* PASSO 3 */}
              {step === 3 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-200">
                  <div className="space-y-1.5 rounded-2xl border border-white/10 bg-zinc-900/60 p-3.5">
                    <div className="flex items-center justify-between border-b border-white/5 pb-1.5 text-xs">
                      <span className="text-zinc-400">Serviço:</span>
                      <span className="font-bold text-zinc-100">
                        {selectedService?.name} (€
                        {selectedService?.price?.toFixed(2) ?? "0.00"})
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-white/5 pb-1.5 text-xs">
                      <span className="text-zinc-400">Data & Hora:</span>
                      <span className="font-bold text-zinc-100">
                        {currentDay.fullDateFormatted} às {selectedSlot}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Barbeiro:</span>
                      <span className="font-bold text-zinc-100">
                        {selectedProfessional === "any"
                          ? "Sem preferência"
                          : selectedProfessional.name}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      <User className="h-3.5 w-3.5" />
                      <span>Dados de Confirmação</span>
                    </div>

                    <input
                      type="text"
                      placeholder="Nome Completo *"
                      autoComplete="name"
                      enterKeyHint="next"
                      onFocus={handleInputFocus}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full h-11 rounded-xl border border-white/10 bg-zinc-900/80 px-3.5 text-base sm:text-xs text-zinc-100 placeholder-zinc-500 transition-all focus:border-zinc-300 focus:outline-none"
                      required
                    />

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <input
                        type="tel"
                        inputMode="tel"
                        placeholder="Telemóvel *"
                        autoComplete="tel"
                        enterKeyHint="next"
                        onFocus={handleInputFocus}
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full h-11 rounded-xl border border-white/10 bg-zinc-900/80 px-3.5 text-base sm:text-xs text-zinc-100 placeholder-zinc-500 transition-all focus:border-zinc-300 focus:outline-none"
                        required
                      />

                      <input
                        type="email"
                        inputMode="email"
                        placeholder="Email *"
                        autoComplete="email"
                        enterKeyHint="done"
                        onFocus={handleInputFocus}
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full h-11 rounded-xl border border-white/10 bg-zinc-900/80 px-3.5 text-base sm:text-xs text-zinc-100 placeholder-zinc-500 transition-all focus:border-zinc-300 focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* PASSO 4 */}
              {step === 4 && (
                <div className="flex flex-col items-center justify-center space-y-3 py-1 text-center animate-in zoom-in-95 duration-200">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                    <Check className="h-7 w-7 stroke-[3]" />
                  </div>

                  <div className="space-y-0.5">
                    <h3 className="text-lg font-bold tracking-tight text-zinc-100">
                      Agendamento Confirmado!
                    </h3>
                    <p className="text-xs text-zinc-400">
                      A tua vaga está garantida.
                    </p>
                  </div>

                  <div className="flex w-full items-start gap-2.5 rounded-2xl border border-emerald-800/40 bg-emerald-950/30 p-3 text-left">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <div className="text-xs leading-relaxed text-emerald-200/90">
                      Enviámos confirmação para{" "}
                      <strong className="text-emerald-100 break-all">{customerEmail}</strong>.
                    </div>
                  </div>

                  <div className="w-full space-y-1.5 rounded-2xl border border-white/10 bg-zinc-900/60 p-3.5 text-left text-xs">
                    <div className="flex items-center justify-between border-b border-white/5 pb-1">
                      <span className="text-zinc-400">Barbearia:</span>
                      <span className="font-semibold text-zinc-200">{shop.name}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-white/5 pb-1">
                      <span className="text-zinc-400">Serviço:</span>
                      <span className="font-semibold text-zinc-200">
                        {selectedService?.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-white/5 pb-1">
                      <span className="text-zinc-400">Data:</span>
                      <span className="font-semibold text-zinc-200 capitalize">
                        {currentDay.fullDateFormatted}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-white/5 pb-1">
                      <span className="text-zinc-400">Horário:</span>
                      <span className="font-black text-emerald-400">
                        {selectedSlot}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-zinc-400">Barbeiro:</span>
                      <span className="font-semibold text-zinc-200">
                        {selectedProfessional === "any"
                          ? "Sem preferência"
                          : selectedProfessional.name}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* FOOTER FIXO NA PARTE INFERIOR (shrink-0) */}
        <DrawerFooter className="shrink-0 flex-row items-center justify-between border-t border-white/5 px-0 pt-3 pb-0 gap-2">
          {hasError ? (
            <div className="flex w-full gap-2">
              <DrawerClose asChild>
                <Button
                  variant="outline"
                  className="h-11 w-1/2 border-white/10 bg-zinc-900 text-xs text-zinc-300 active:scale-[0.98]"
                >
                  Fechar
                </Button>
              </DrawerClose>
              <Button
                onClick={() => {
                  setHasError(false);
                  setStep(1);
                }}
                className="h-11 w-1/2 bg-zinc-100 text-xs font-bold text-zinc-950 hover:bg-zinc-200 active:scale-[0.98]"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Tentar Novo
              </Button>
            </div>
          ) : step === 4 ? (
            <Button
              onClick={onClose}
              className="h-11 w-full bg-zinc-100 font-bold text-zinc-950 hover:bg-zinc-200 active:scale-[0.98]"
            >
              Concluído
            </Button>
          ) : (
            <>
              {step === 1 ? (
                <DrawerClose asChild>
                  <Button
                    variant="ghost"
                    className="h-11 text-xs text-zinc-400 hover:bg-zinc-900 active:scale-[0.98]"
                  >
                    Cancelar
                  </Button>
                </DrawerClose>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                  className="h-11 border-white/10 bg-zinc-900 px-3.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 active:scale-[0.98]"
                >
                  <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Voltar
                </Button>
              )}

              {step < 3 ? (
                <Button
                  disabled={!selectedService || !selectedSlot}
                  onClick={() => setStep((s) => (s + 1) as 2 | 3)}
                  className="h-11 bg-zinc-100 px-5 font-bold text-zinc-950 hover:bg-zinc-200 disabled:opacity-40 active:scale-[0.98]"
                >
                  Próximo <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  disabled={
                    !customerName.trim() ||
                    !customerPhone.trim() ||
                    !customerEmail.trim() ||
                    isSubmitting
                  }
                  onClick={handleConfirm}
                  className="h-11 bg-zinc-100 px-5 font-bold text-zinc-950 hover:bg-zinc-200 disabled:opacity-40 active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4 stroke-[3]" />
                  )}
                  Confirmar (€{selectedService?.price?.toFixed(2) ?? "0.00"})
                </Button>
              )}
            </>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
