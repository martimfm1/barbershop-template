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

const DAY_NAME_TO_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  domingo: 0,
  segunda: 1,
  terca: 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sabado: 6,
};

function parsedClosedDayIndices(closedDays: unknown): Set<number> {
  if (!closedDays) return new Set();

  const raw =
    typeof closedDays === "string"
      ? closedDays.split(",").map((s) => s.trim().toLowerCase())
      : Array.isArray(closedDays)
        ? (closedDays as (string | number)[]).map((v) =>
            typeof v === "string" ? v.trim().toLowerCase() : v,
          )
        : [];

  const indices = new Set<number>();
  for (const val of raw) {
    if (typeof val === "number") {
      indices.add(val);
    } else if (typeof val === "string") {
      const mapped = DAY_NAME_TO_INDEX[val];
      if (mapped !== undefined) indices.add(mapped);
    }
  }
  return indices;
}

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

  const [professionals, setProfessionals] = useState<MarketplaceProfessional[]>(
    [],
  );
  const [selectedProfessional, setSelectedProfessional] = useState<
    MarketplaceProfessional | "any"
  >("any");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentDay = nextDays[selectedDayIndex];

  const closedDayIndices = useMemo(() => {
    const raw =
      (shop as any)?.closed_days ??
      (shop as any)?.closedDays ??
      (shop as any)?.off_days;
    return parsedClosedDayIndices(raw);
  }, [shop]);

  const isShopClosedOnCurrentDay = useMemo(() => {
    if (!shop) return false;
    const dateObj = new Date(currentDay.dateStr + "T12:00:00");
    return closedDayIndices.has(dateObj.getDay());
  }, [shop, currentDay.dateStr, closedDayIndices]);

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const target = e.target;
    setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
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

        // Combina a regra da tabela shops (closed_days) com a resposta dinâmica da API
        const apiIsClosed = data.isClosed ?? false;
        setIsClosed(isShopClosedOnCurrentDay || apiIsClosed);

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
  }, [shop?.id, isOpen, currentDay.dateStr, isShopClosedOnCurrentDay]);

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
      <DrawerContent className="mx-auto flex flex-col max-h-[88dvh] sm:max-h-[85vh] max-w-lg overflow-hidden border border-white/15 bg-zinc-950/65 backdrop-blur-3xl backdrop-saturate-150 text-zinc-100 shadow-2xl touch-manipulation">
        {/* HEADER */}
        <DrawerHeader className="relative z-10 shrink-0 px-1 pt-1 pb-4 text-left border-b border-white/10">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg font-bold text-white truncate pr-2 sm:text-xl tracking-tight">
              {hasError
                ? "Erro no Agendamento"
                : step === 4
                  ? "Confirmação"
                  : shop.name}
            </DrawerTitle>

            {!hasError && step < 4 && (
              <div className="flex items-center gap-1.5 shrink-0">
                {[1, 2, 3].map((s, idx) => (
                  <React.Fragment key={s}>
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300 ${
                        step >= s
                          ? "bg-white text-zinc-950 shadow-md shadow-white/20 scale-105"
                          : "bg-white/5 text-zinc-400 border border-white/10"
                      }`}
                    >
                      {s}
                    </span>
                    {idx < 2 && (
                      <span className="h-[2px] w-3 bg-white/10 rounded-full" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            {!hasError && step === 4 && (
              <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
                <CheckCircle2 className="h-3.5 w-3.5" /> Concluído
              </span>
            )}

            {hasError && (
              <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
                <AlertCircle className="h-3.5 w-3.5" /> Falhou
              </span>
            )}
          </div>

          <DrawerDescription className="text-xs text-zinc-400 mt-1">
            {hasError && "Surgiu um problema com o teu agendamento"}
            {!hasError &&
              step === 1 &&
              "Escolhe o serviço, dia e hora pretendida"}
            {!hasError &&
              step === 2 &&
              "Seleciona o profissional da tua preferência"}
            {!hasError && step === 3 && "Introduz os teus dados para finalizar"}
            {!hasError && step === 4 && "Resumo do teu agendamento registado"}
          </DrawerDescription>
        </DrawerHeader>

        {/* CORPO DO CONTEÚDO */}
        <div className="relative z-10 flex-1 overflow-y-auto min-h-0 py-4 pr-0.5 overscroll-contain space-y-5">
          {hasError ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-6 text-center animate-in zoom-in-95 duration-200">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white">
                <XCircle className="h-7 w-7 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  Não foi possível reservar
                </h3>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                  Desculpa, ocorreu um imprevisto ao processar o teu pedido.
                </p>
              </div>
              <div className="flex w-full items-start gap-3 rounded-2xl border border-white/15 bg-white/[0.04] p-3.5 text-left">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-300" />
                <div className="text-xs leading-relaxed text-zinc-300">
                  <span className="font-semibold text-white">Detalhe:</span>{" "}
                  {errorMessage}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* PASSO 1 */}
              {step === 1 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                  {/* SERVIÇO */}
                  <div>
                    <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      <Scissors className="h-3.5 w-3.5 text-zinc-400" />
                      <span>Serviço</span>
                    </div>

                    <div className="flex max-w-full gap-2.5 overflow-x-auto pb-1.5 snap-x snap-mandatory scrollbar-none">
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
                              className={`flex min-w-[140px] flex-shrink-0 flex-col justify-between rounded-2xl border p-3.5 text-left transition-all duration-200 active:scale-[0.98] snap-start backdrop-blur-md ${
                                isSelected
                                  ? "border-white/50 bg-white text-zinc-950 font-semibold shadow-xl shadow-black/20 ring-1 ring-white/50"
                                  : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20 hover:bg-white/[0.06]"
                              }`}
                            >
                              <span className="text-xs font-bold leading-snug line-clamp-2">
                                {service.name}
                              </span>
                              <div className="mt-3 flex items-center justify-between text-[11px]">
                                <span
                                  className={
                                    isSelected
                                      ? "text-zinc-700"
                                      : "text-zinc-400"
                                  }
                                >
                                  {service.durationMinutes} min
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
                    <div className="mb-2.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      <span>Dia</span>
                      <span className="text-[10px] lowercase text-zinc-500 font-normal">
                        desliza para mais dias
                      </span>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1.5 snap-x snap-mandatory scrollbar-none">
                      {nextDays.map((day, idx) => {
                        const isSelected = idx === selectedDayIndex;
                        const dateObj = new Date(day.dateStr + "T12:00:00");
                        const isClosed = closedDayIndices.has(dateObj.getDay());
                        return (
                          <button
                            key={day.dateStr}
                            type="button"
                            onClick={() => setSelectedDayIndex(idx)}
                            disabled={isClosed}
                            title={isClosed ? "Encerrado" : undefined}
                            className={`relative flex min-w-[62px] flex-1 flex-col items-center justify-center rounded-2xl border py-3 transition-all duration-200 active:scale-[0.98] snap-start backdrop-blur-md ${
                              isClosed
                                ? "border-white/5 bg-white/[0.02] text-zinc-600 opacity-50 cursor-not-allowed"
                                : isSelected
                                  ? "border-white/50 bg-white text-zinc-950 font-bold shadow-xl shadow-black/20 ring-1 ring-white/50"
                                  : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:bg-white/[0.06]"
                            }`}
                          >
                            <span className="text-[10px] font-bold tracking-wider uppercase">
                              {day.isToday ? "Hoje" : day.weekdayShort}
                            </span>
                            <span className="mt-1 text-base font-black leading-none">
                              {day.dayNumeric}
                            </span>
                            {isClosed && (
                              <span className="mt-0.5 text-[8px] font-semibold uppercase tracking-widest text-zinc-600">
                                fechado
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* HORAS */}
                  <div>
                    <div className="mb-2.5 flex items-center justify-between text-xs text-zinc-400">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                        <Clock className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Horas Livres</span>
                      </div>
                      <span className="text-[11px] font-medium text-zinc-300 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                        {currentDay.fullDateFormatted}
                      </span>
                    </div>

                    {isLoading ? (
                      <div className="flex h-28 items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                      </div>
                    ) : isClosed ? (
                      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center">
                        <AlertCircle className="h-7 w-7 text-zinc-500 stroke-1 mb-1.5" />
                        <h4 className="text-xs font-bold text-zinc-200">
                          Encontra-se de folga
                        </h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Não existem horários disponíveis neste dia.
                        </p>
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center">
                        <AlertCircle className="h-7 w-7 text-zinc-500 stroke-1 mb-1.5" />
                        <h4 className="text-xs font-bold text-zinc-200">
                          Sem vagas para esta data
                        </h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Tenta selecionar outro dia acima.
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
                              className={`flex h-11 items-center justify-center rounded-xl border text-xs font-bold transition-all duration-200 active:scale-[0.98] backdrop-blur-md ${
                                isSelected
                                  ? "border-white/50 bg-white text-zinc-950 shadow-lg shadow-black/20 ring-1 ring-white/50"
                                  : "border-white/10 bg-white/[0.04] text-zinc-200 hover:border-white/20 hover:bg-white/[0.08]"
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
                    <span>Escolhe o profissional pretendido</span>
                  </div>

                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedProfessional("any")}
                      className={`flex w-full items-center justify-between rounded-2xl border p-4 transition-all duration-200 active:scale-[0.98] backdrop-blur-md ${
                        selectedProfessional === "any"
                          ? "border-white/50 bg-white text-zinc-950 font-semibold shadow-xl shadow-black/20 ring-1 ring-white/50"
                          : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20 hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                            selectedProfessional === "any"
                              ? "bg-zinc-950 text-white"
                              : "bg-white/10 text-zinc-300"
                          }`}
                        >
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold">Sem preferência</p>
                          <p
                            className={`text-[11px] ${selectedProfessional === "any" ? "text-zinc-700" : "text-zinc-400"}`}
                          >
                            Atribuição ao primeiro disponível
                          </p>
                        </div>
                      </div>
                      {selectedProfessional === "any" && (
                        <Check className="h-4 w-4 stroke-[3]" />
                      )}
                    </button>

                    {professionals.map((pro) => {
                      const isSelected =
                        selectedProfessional !== "any" &&
                        selectedProfessional.id === pro.id;
                      return (
                        <button
                          key={pro.id}
                          type="button"
                          onClick={() => setSelectedProfessional(pro)}
                          className={`flex w-full items-center justify-between rounded-2xl border p-4 transition-all duration-200 active:scale-[0.98] backdrop-blur-md ${
                            isSelected
                              ? "border-white/50 bg-white text-zinc-950 font-semibold shadow-xl shadow-black/20 ring-1 ring-white/50"
                              : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20 hover:bg-white/[0.06]"
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold uppercase transition-colors ${
                                isSelected
                                  ? "bg-zinc-950 text-white"
                                  : "bg-white/10 text-zinc-200"
                              }`}
                            >
                              {pro.name.charAt(0)}
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-bold">{pro.name}</p>
                              <p
                                className={`text-[11px] ${isSelected ? "text-zinc-700" : "text-zinc-400"}`}
                              >
                                {pro.role || "Barbeiro Profissional"}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="h-4 w-4 stroke-[3]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PASSO 3 */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                  <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs backdrop-blur-md">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-400">Serviço escolhido:</span>
                      <span className="font-bold text-white">
                        {selectedService?.name} (€
                        {selectedService?.price?.toFixed(2) ?? "0.00"})
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-400">Data e Hora:</span>
                      <span className="font-bold text-white">
                        {currentDay.fullDateFormatted} às {selectedSlot}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-zinc-400">Profissional:</span>
                      <span className="font-bold text-white">
                        {selectedProfessional === "any"
                          ? "Sem preferência"
                          : selectedProfessional.name}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      <User className="h-3.5 w-3.5" />
                      <span>Os teus dados</span>
                    </div>

                    <input
                      type="text"
                      placeholder="Nome Completo *"
                      autoComplete="name"
                      enterKeyHint="next"
                      onFocus={handleInputFocus}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full h-12 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder-zinc-500 transition-all backdrop-blur-md focus:border-white/30 focus:bg-white/[0.07] focus:outline-none focus:ring-1 focus:ring-white/30"
                      required
                    />

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <input
                        type="tel"
                        inputMode="tel"
                        placeholder="Telemóvel *"
                        autoComplete="tel"
                        enterKeyHint="next"
                        onFocus={handleInputFocus}
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full h-12 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder-zinc-500 transition-all backdrop-blur-md focus:border-white/30 focus:bg-white/[0.07] focus:outline-none focus:ring-1 focus:ring-white/30"
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
                        className="w-full h-12 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder-zinc-500 transition-all backdrop-blur-md focus:border-white/30 focus:bg-white/[0.07] focus:outline-none focus:ring-1 focus:ring-white/30"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* PASSO 4 */}
              {step === 4 && (
                <div className="flex flex-col items-center justify-center space-y-4 py-2 text-center animate-in zoom-in-95 duration-200">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-xl shadow-black/20">
                    <Check className="h-8 w-8 stroke-[3]" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-bold tracking-tight text-white">
                      Tudo pronto e reservado!
                    </h3>
                    <p className="text-xs text-zinc-400">
                      O teu horário foi garantido com sucesso.
                    </p>
                  </div>

                  <div className="flex w-full items-start gap-3 rounded-2xl border border-white/15 bg-white/[0.04] p-3.5 text-left backdrop-blur-md">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-zinc-300" />
                    <div className="text-xs leading-relaxed text-zinc-300">
                      Enviámos o comprovativo de agendamento para{" "}
                      <strong className="text-white break-all">
                        {customerEmail}
                      </strong>
                      .
                    </div>
                  </div>

                  <div className="w-full space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left text-xs backdrop-blur-md">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-400">Barbearia:</span>
                      <span className="font-semibold text-zinc-200">
                        {shop.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-400">Serviço:</span>
                      <span className="font-semibold text-zinc-200">
                        {selectedService?.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-400">Data:</span>
                      <span className="font-semibold text-zinc-200 capitalize">
                        {currentDay.fullDateFormatted}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-400">Horário:</span>
                      <span className="font-black text-white text-sm">
                        {selectedSlot}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-zinc-400">Profissional:</span>
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

        {/* FOOTER */}
        <DrawerFooter className="relative z-10 shrink-0 flex-row items-center justify-between border-t border-white/10 px-0 pt-4 pb-1 gap-3">
          {hasError ? (
            <div className="flex w-full gap-2.5">
              <DrawerClose asChild>
                <Button
                  variant="outline"
                  className="h-12 w-1/2 border-white/10 bg-white/[0.05] text-xs text-zinc-300 hover:bg-white/10 active:scale-[0.98]"
                >
                  Fechar
                </Button>
              </DrawerClose>
              <Button
                onClick={() => {
                  setHasError(false);
                  setStep(1);
                }}
                className="h-12 w-1/2 bg-white text-xs font-bold text-zinc-950 hover:bg-zinc-200 active:scale-[0.98] shadow-lg shadow-black/20"
              >
                <RotateCcw className="mr-2 h-3.5 w-3.5" /> Tentar de Novo
              </Button>
            </div>
          ) : step === 4 ? (
            <Button
              onClick={onClose}
              className="h-12 w-full bg-white font-bold text-zinc-950 hover:bg-zinc-200 active:scale-[0.98] shadow-lg shadow-black/20"
            >
              Concluir
            </Button>
          ) : (
            <>
              {step === 1 ? (
                <DrawerClose asChild>
                  <Button
                    variant="ghost"
                    className="h-12 text-xs text-zinc-400 hover:bg-white/5 hover:text-zinc-200 active:scale-[0.98]"
                  >
                    Cancelar
                  </Button>
                </DrawerClose>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                  className="h-12 border-white/10 bg-white/[0.05] px-4 text-xs font-semibold text-zinc-300 hover:bg-white/10 active:scale-[0.98]"
                >
                  <ChevronLeft className="mr-1.5 h-4 w-4" /> Voltar
                </Button>
              )}

              {step < 3 ? (
                <Button
                  disabled={!selectedService || !selectedSlot || isClosed}
                  onClick={() => setStep((s) => (s + 1) as 2 | 3)}
                  className="h-12 bg-white px-6 font-bold text-zinc-950 hover:bg-zinc-200 disabled:opacity-40 active:scale-[0.98] shadow-lg shadow-black/20"
                >
                  Próximo <ChevronRight className="ml-1.5 h-4 w-4" />
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
                  className="h-12 bg-white px-6 font-bold text-zinc-950 hover:bg-zinc-200 disabled:opacity-40 active:scale-[0.98] shadow-lg shadow-black/20"
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
