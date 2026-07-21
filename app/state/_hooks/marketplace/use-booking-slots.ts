import { useState, useEffect, useMemo } from "react";
import { generateNextDays } from "@/app/barbershops/utils/booking-slots";
import type { UseBookingSlotsReturn } from "@/_types/marketplace/booking";

export function useBookingSlots(shopId: string | null, isOpen: boolean): UseBookingSlotsReturn {
  const nextDays = useMemo(() => generateNextDays(5), []);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [slots, setSlots] = useState<string[]>([]);
  const [isClosed, setIsClosed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const currentDay = nextDays[selectedDayIndex];

  useEffect(() => {
    if (!isOpen || !shopId) return;

    let isMounted = true;

    async function fetchSlots() {
      setIsLoading(true);
      setSelectedSlot(null);

      try {
        const response = await fetch(`/api/shops/${shopId}/slots?date=${currentDay.dateStr}`);
        const data = await response.json();

        if (!isMounted) return;

        if (data.isClosed) {
          setIsClosed(true);
          setSlots([]);
        } else {
          setIsClosed(false);
          setSlots(data.slots || []);
        }
      } catch (err) {
        console.error("Erro ao carregar slots:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchSlots();

    return () => {
      isMounted = false;
    };
  }, [shopId, isOpen, currentDay.dateStr]);

  return {
    nextDays,
    selectedDayIndex,
    setSelectedDayIndex,
    currentDay,
    slots,
    isClosed,
    isLoading,
    selectedSlot,
    setSelectedSlot,
  };
}
