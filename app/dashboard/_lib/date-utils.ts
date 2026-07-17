export function combineDatetime(dateStr: string, timeStr: string): string {
  if (!dateStr || !timeStr) return "";
  const date = new Date(`${dateStr}T${timeStr}:00`);
  if (isNaN(date.getTime())) return "";
  return date.toISOString();
}

export function formatDisplayDate(dateInput: string | Date): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatDisplayTime(dateInput: string | Date): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatDisplayDateLong(dateInput: string | Date): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function getWeekDayIndex(dateInput: string | Date): number {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return -1;
  return date.getDay();
}

export function getWeekDayName(dateInput: string | Date): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-PT", { weekday: "long" }).format(date);
}

export function isPastDateTime(dateInput: string | Date): boolean {
  if (!dateInput) return true;
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return true;
  return date.getTime() < Date.now();
}

export function generateTimeSlots(
  openingTime: string,
  closingTime: string,
  intervalMinutes: number,
): string[] {
  if (!openingTime || !closingTime || intervalMinutes <= 0) return [];

  const slots: string[] = [];
  const [startHour, startMinute] = openingTime.split(":").map(Number);
  const [endHour, endMinute] = closingTime.split(":").map(Number);

  const start = new Date();
  start.setHours(startHour, startMinute, 0, 0);

  const end = new Date();
  end.setHours(endHour, endMinute, 0, 0);

  const current = new Date(start);

  while (current < end) {
    const hours = String(current.getHours()).padStart(2, "0");
    const minutes = String(current.getMinutes()).padStart(2, "0");
    slots.push(`${hours}:${minutes}`);
    current.setMinutes(current.getMinutes() + intervalMinutes);
  }

  return slots;
}

export function isOverlapping(
  startA: string | Date,
  endA: string | Date,
  startB: string | Date,
  endB: string | Date,
): boolean {
  const timeStartA = new Date(startA).getTime();
  const timeEndA = new Date(endA).getTime();
  const timeStartB = new Date(startB).getTime();
  const timeEndB = new Date(endB).getTime();

  if (
    isNaN(timeStartA) ||
    isNaN(timeEndA) ||
    isNaN(timeStartB) ||
    isNaN(timeEndB)
  ) {
    return false;
  }

  return timeStartA < timeEndB && timeStartB < timeEndA;
}
