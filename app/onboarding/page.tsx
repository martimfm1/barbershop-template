"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  PlusCircle,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  MapPin,
  Clock,
  Euro,
  Tag,
  Loader2,
  CheckCircle2,
  Hash,
} from "lucide-react";
import { StarfieldBackground } from "@/components/ui/starfield";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

type Step = "selection" | "create" | "join";

interface AddressSuggestion {
  id: string;
  streetWithNumber: string;
  fullAddress: string;
  city: string;
  postalCode: string;
  lat: number;
  lng: number;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Ocorreu um erro inesperado";
}

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("selection");
  const [loading, setLoading] = useState(false);

  const [shopName, setShopName] = useState("");
  const [address, setAddress] = useState("");
  const [doorNumber, setDoorNumber] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("19:00");
  const [price, setPrice] = useState<number | "">(15);
  const [tagsInput, setTagsInput] = useState("Corte, Barba");
  
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [inviteCode, setInviteCode] = useState("");

  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [isAddressSelected, setIsAddressSelected] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!address || address.length < 3 || isAddressSelected) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingAddress(true);
      try {
        const res = await fetch(`/api/address/search?q=${encodeURIComponent(address)}`);
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch (err) {
        console.error("Address search error", err);
      } finally {
        setSearchingAddress(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [address, isAddressSelected]);

  useEffect(() => {
    if (isAddressSelected || !postalCode || postalCode.length < 4) {
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingAddress(true);
      try {
        const params = new URLSearchParams({
          postalCode,
          houseNumber: doorNumber,
          city,
        });
        const res = await fetch(`/api/address/search?${params.toString()}`);
        const data = await res.json();
        const results = data.suggestions || [];

        if (results.length > 0) {
          const best = results[0];
          if (!address) setAddress(best.streetWithNumber || best.fullAddress);
          if (best.city) setCity(best.city);
          setLat(best.lat);
          setLng(best.lng);
          setIsAddressSelected(true);
        }
      } catch (err) {
        console.error("Postal search error", err);
      } finally {
        setSearchingAddress(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [postalCode, doorNumber, city, isAddressSelected, address]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectAddress = (item: AddressSuggestion) => {
    setAddress(item.streetWithNumber || item.fullAddress);
    if (item.city) setCity(item.city);
    if (item.postalCode) setPostalCode(item.postalCode);
    setLat(item.lat);
    setLng(item.lng);
    setIsAddressSelected(true);
    setSuggestions([]);
  };

  async function handleCreateShop(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const formattedTags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const fullAddressString = `${address}${doorNumber ? " " + doorNumber : ""}${
        postalCode ? ", " + postalCode : ""
      }`;

      const hoursString = `${openTime} - ${closeTime}`;

      const res = await fetch("/api/onboarding/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: shopName,
          address: fullAddressString,
          city,
          hours: hoursString,
          price: Number(price) || 0,
          tags: formattedTags,
          lat: lat || 0,
          lng: lng || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar barbearia");

      toast.success("Barbearia criada com sucesso!");
      window.location.href = `/dashboard`;
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error) || "Erro ao criar barbearia");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinShop(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/onboarding/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Código inválido");

      toast.success("Sincronizado com sucesso!");
      window.location.href = "/dashboard";
    } catch (error) {
      toast.error(getErrorMessage(error) || "Erro ao processar convite");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const parsedTags = tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden antialiased">
      <StarfieldBackground>
        <section className="flex flex-1 flex-col items-center justify-center px-4 py-12 w-full max-w-lg mx-auto">
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="w-full border border-white/10 bg-zinc-950/40 shadow-2xl shadow-black/80 backdrop-blur-xl rounded-2xl overflow-hidden p-6"
          >
            <AnimatePresence mode="wait">
              {step === "selection" && (
                <motion.div
                  key="selection"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <CardHeader className="p-0 text-center">
                    <div className="mx-auto size-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                      <Sparkles className="size-5 text-zinc-400" />
                    </div>
                    <CardTitle className="font-heading text-xl text-zinc-50 tracking-tight">
                      Configura o teu espaço
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      Escolha como deseja começar a gerir os seus agendamentos.
                    </CardDescription>
                  </CardHeader>

                  <div className="grid gap-3">
                    <button
                      onClick={() => setStep("create")}
                      className="cursor-pointer group flex items-center gap-4 w-full p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-left transition-all duration-300"
                    >
                      <div className="size-10 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-950 shadow-md">
                        <PlusCircle className="size-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xs font-semibold text-zinc-50">
                          Criar Nova Barbearia
                        </h3>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Serei o administrador principal do ecossistema.
                        </p>
                      </div>
                      <ArrowRight className="size-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                    </button>

                    <button
                      onClick={() => setStep("join")}
                      className="cursor-pointer group flex items-center gap-4 w-full p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-left transition-all duration-300"
                    >
                      <div className="size-10 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400">
                        <UserPlus className="size-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xs font-semibold text-zinc-50">
                          Associar a Barbearia Existente
                        </h3>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Introduzir um código de convite da minha equipa.
                        </p>
                      </div>
                      <ArrowRight className="size-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === "create" && (
                <motion.form
                  key="create"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleCreateShop}
                  className="space-y-4"
                >
                  <button
                    type="button"
                    onClick={() => setStep("selection")}
                    className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-2"
                  >
                    <ArrowLeft className="size-3.5" /> Voltar
                  </button>

                  <CardHeader className="p-0">
                    <CardTitle className="font-heading text-lg text-zinc-50">
                      Criar Novo Espaço
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      Preencha os dados do seu espaço para listagem no marketplace.
                    </CardDescription>
                  </CardHeader>

                  <div className="grid gap-3">
                    <div className="grid gap-1.5">
                      <Label htmlFor="shop-name" className="text-xs text-zinc-400">
                        Nome da Barbearia
                      </Label>
                      <div className="relative">
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                        <Input
                          id="shop-name"
                          required
                          value={shopName}
                          onChange={(e) => setShopName(e.target.value)}
                          placeholder="Ex: Barber Shop Central"
                          className="h-10 text-xs border-white/10 bg-white/5 pl-10 text-zinc-50 placeholder:text-zinc-600 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid gap-1.5 relative" ref={dropdownRef}>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="address" className="text-xs text-zinc-400">
                          Endereço / Rua
                        </Label>
                        {isAddressSelected && (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                            <CheckCircle2 className="size-3" /> Localização Confirmada
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                        <Input
                          id="address"
                          required
                          value={address}
                          onChange={(e) => {
                            setAddress(e.target.value);
                            setIsAddressSelected(false);
                            setLat(null);
                            setLng(null);
                          }}
                          placeholder="Ex: Rua Garrett"
                          className="h-10 text-xs border-white/10 bg-white/5 pl-10 pr-9 text-zinc-50 placeholder:text-zinc-600 rounded-xl"
                        />
                        {searchingAddress && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-zinc-400" />
                        )}
                      </div>

                      {suggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-white/15 bg-zinc-900 shadow-2xl p-1 backdrop-blur-xl">
                          {suggestions.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelectAddress(item)}
                              className="w-full flex flex-col items-start px-3 py-2 text-left rounded-lg hover:bg-white/10 transition text-xs"
                            >
                              <span className="font-semibold text-zinc-100 truncate w-full">
                                {item.streetWithNumber || item.fullAddress}
                              </span>
                              <span className="text-[10px] text-zinc-400 truncate w-full mt-0.5">
                                {item.fullAddress}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1.5">
                        <Label htmlFor="postal-code" className="text-xs text-zinc-400">
                          Código Postal
                        </Label>
                        <Input
                          id="postal-code"
                          value={postalCode}
                          onChange={(e) => {
                            setPostalCode(e.target.value);
                            setIsAddressSelected(false);
                          }}
                          placeholder="Ex: 1200-203"
                          className="h-10 text-xs border-white/10 bg-white/5 px-3 text-zinc-50 placeholder:text-zinc-600 rounded-xl"
                        />
                      </div>

                      <div className="grid gap-1.5">
                        <Label htmlFor="door-number" className="text-xs text-zinc-400">
                          Nº da Porta (Opcional)
                        </Label>
                        <div className="relative">
                          <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                          <Input
                            id="door-number"
                            value={doorNumber}
                            onChange={(e) => {
                              setDoorNumber(e.target.value);
                              setIsAddressSelected(false);
                            }}
                            placeholder="Ex: 12"
                            className="h-10 text-xs border-white/10 bg-white/5 pl-10 text-zinc-50 placeholder:text-zinc-600 rounded-xl"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1.5">
                        <Label htmlFor="city" className="text-xs text-zinc-400">
                          Cidade / Vila
                        </Label>
                        <Input
                          id="city"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Ex: Lisboa"
                          className="h-10 text-xs border-white/10 bg-white/5 px-3 text-zinc-50 placeholder:text-zinc-600 rounded-xl"
                        />
                      </div>

                      <div className="grid gap-1.5">
                        <Label htmlFor="price" className="text-xs text-zinc-400">
                          Preço Inicial (€)
                        </Label>
                        <div className="relative">
                          <Euro className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                          <Input
                            id="price"
                            type="number"
                            min="0"
                            step="0.5"
                            required
                            value={price}
                            onChange={(e) => setPrice(e.target.value !== "" ? Number(e.target.value) : "")}
                            placeholder="15"
                            className="h-10 text-xs border-white/10 bg-white/5 pl-10 text-zinc-50 placeholder:text-zinc-600 rounded-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1.5">
                        <Label htmlFor="open-time" className="text-xs text-zinc-400">
                          Hora de Abertura
                        </Label>
                        <div className="relative">
                          <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                          <Input
                            id="open-time"
                            type="time"
                            required
                            value={openTime}
                            onChange={(e) => setOpenTime(e.target.value)}
                            className="h-10 text-xs border-white/10 bg-white/5 pl-10 text-zinc-50 rounded-xl scheme-dark cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="grid gap-1.5">
                        <Label htmlFor="close-time" className="text-xs text-zinc-400">
                          Hora de Fecho
                        </Label>
                        <div className="relative">
                          <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                          <Input
                            id="close-time"
                            type="time"
                            required
                            value={closeTime}
                            onChange={(e) => setCloseTime(e.target.value)}
                            className="h-10 text-xs border-white/10 bg-white/5 pl-10 text-zinc-50 rounded-xl scheme-dark cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="tags" className="text-xs text-zinc-400">
                          Tags do Marketplace
                        </Label>
                        <span className="text-[10px] text-zinc-500">Separadas por vírgula</span>
                      </div>
                      <div className="relative">
                        <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                        <Input
                          id="tags"
                          required
                          value={tagsInput}
                          onChange={(e) => setTagsInput(e.target.value)}
                          placeholder="Corte, Barba, Toalha Quente"
                          className="h-10 text-xs border-white/10 bg-white/5 pl-10 text-zinc-50 placeholder:text-zinc-600 rounded-xl"
                        />
                      </div>

                      {parsedTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {parsedTags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-medium text-zinc-300 border border-white/5"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !shopName || !address || !city || price === ""}
                    className="cursor-pointer h-11 w-full rounded-full bg-zinc-50 text-xs font-bold text-zinc-950 hover:bg-zinc-300 active:scale-[0.98] transition-all mt-4"
                  >
                    {loading ? (
                      <Spinner className="size-4 text-zinc-950" />
                    ) : (
                      "Inicializar Barbearia"
                    )}
                  </Button>
                </motion.form>
              )}

              {step === "join" && (
                <motion.form
                  key="join"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleJoinShop}
                  className="space-y-4"
                >
                  <button
                    type="button"
                    onClick={() => setStep("selection")}
                    className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-2"
                  >
                    <ArrowLeft className="size-3.5" /> Voltar
                  </button>

                  <CardHeader className="p-0">
                    <CardTitle className="font-heading text-lg text-zinc-50">
                      Inserir Código de Convite
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      Peça o código de acesso gerado no painel de administração da sua barbearia.
                    </CardDescription>
                  </CardHeader>

                  <div className="grid gap-1.5">
                    <Label htmlFor="invite-code" className="text-xs text-zinc-400">
                      Código de Convite
                    </Label>
                    <Input
                      id="invite-code"
                      required
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="EX: BB-98X2"
                      maxLength={10}
                      className="h-11 text-center font-mono tracking-widest text-xs border-white/10 bg-white/5 text-zinc-50 placeholder:text-zinc-600 rounded-xl focus-visible:border-white/30"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !inviteCode}
                    className="h-11 w-full rounded-full bg-zinc-50 text-xs font-bold text-zinc-950 hover:bg-white active:scale-[0.98] transition-all mt-2"
                  >
                    {loading ? (
                      <Spinner className="size-4 text-zinc-950" />
                    ) : (
                      "Vincular à Equipa"
                    )}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </section>
      </StarfieldBackground>
    </main>
  );
}