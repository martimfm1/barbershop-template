import type { BookingDayOption } from '@/types/marketplace/booking';

/**
  Gera uma lista com os próximos N dias a partir de hoje
 */
export function generateNextDays(count = 5): BookingDayOption[] {
  const days: BookingDayOption[] = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const isoDate = `${year}-${month}-${day}`;

    const rawWeekday = d.toLocaleDateString('pt-PT', { weekday: 'short' });
    const fullDate = d.toLocaleDateString('pt-PT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    days.push({
      dateStr: isoDate,
      weekdayShort: rawWeekday.replace('.', '').toUpperCase(),
      dayNumeric: d.getDate(),
      fullDateFormatted: fullDate.charAt(0).toUpperCase() + fullDate.slice(1),
      isToday: i === 0,
    });
  }

  return days;
}

/**
 * Algoritmo determinístico para gerar intervalos de 30 minutos
 */
export function generateTimeSlots(
  openingTime: string,
  closingTime: string,
  intervalMinutes = 30,
): string[] {
  const slots: string[] = [];

  const [startH, startM] = openingTime.split(':').map(Number);
  const [endH, endM] = closingTime.split(':').map(Number);

  const cursor = new Date();
  cursor.setHours(startH || 9, startM || 0, 0, 0);

  const end = new Date();
  end.setHours(endH || 19, endM || 0, 0, 0);

  while (cursor < end) {
    const hh = String(cursor.getHours()).padStart(2, '0');
    const mm = String(cursor.getMinutes()).padStart(2, '0');
    slots.push(`${hh}:${mm}`);
    cursor.setMinutes(cursor.getMinutes() + intervalMinutes);
  }

  return slots;
}
