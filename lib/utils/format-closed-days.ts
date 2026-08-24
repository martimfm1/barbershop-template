const MAPA_DIAS_EXIBICAO: Record<string, string> = {
  domingo: 'Domingo',
  segunda: 'Segunda-feira',
  'segunda-feira': 'Segunda-feira',
  terca: 'Terça-feira',
  terça: 'Terça-feira',
  'terca-feira': 'Terça-feira',
  'terça-feira': 'Terça-feira',
  quarta: 'Quarta-feira',
  'quarta-feira': 'Quarta-feira',
  quinta: 'Quinta-feira',
  'quinta-feira': 'Quinta-feira',
  sexta: 'Sexta-feira',
  'sexta-feira': 'Sexta-feira',
  sabado: 'Sábado',
  sábado: 'Sábado',

  '0': 'Domingo',
  '1': 'Segunda-feira',
  '2': 'Terça-feira',
  '3': 'Quarta-feira',
  '4': 'Quinta-feira',
  '5': 'Sexta-feira',
  '6': 'Sábado',
};

export function formatClosedDays(diasBrutos?: string | null): string {
  if (!diasBrutos || typeof diasBrutos !== 'string') return '';

  const termos = diasBrutos
    .split(',')
    .map((termo) => termo.trim().toLowerCase())
    .filter(Boolean);

  const diasFormatados = termos
    .map((termo) => MAPA_DIAS_EXIBICAO[termo] || capitalize(termo))
    .filter(Boolean);

  return Array.from(new Set(diasFormatados)).join(', ');
}

function capitalize(texto: string): string {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
