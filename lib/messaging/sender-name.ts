export function getBarbershopSenderName(name: string): string {
  const normalized = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized.slice(0, 11).trim() || 'SILENTRA';
}
