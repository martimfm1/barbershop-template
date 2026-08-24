/** Small, dependency-free guards for public API inputs. */
export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isValidDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

export function isValidTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

export function normalizeText(
  value: unknown,
  maxLength: number,
): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.length > 0 && normalized.length <= maxLength
    ? normalized
    : null;
}

export function isSafePublicBookingDate(value: string): boolean {
  if (!isValidDate(value)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = new Date(`${value}T00:00:00`);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 180);
  return selected >= today && selected <= maxDate;
}
