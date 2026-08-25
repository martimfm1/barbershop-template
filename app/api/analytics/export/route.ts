import { NextResponse } from 'next/server';
import { requireModuleContext } from '@/services/modules/authorization';
import { PLANS } from '@/lib/stripe/constants';

const CSV_SEPARATOR = ';';
const CSV_BOM = '\ufeff';

type ExportType = 'appointments' | 'clients' | 'pos';

type RowRecord = Record<string, unknown>;

function csvEscape(value: unknown) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function csv(rows: unknown[][]) {
  return `${CSV_BOM}${rows.map((row) => row.map(csvEscape).join(CSV_SEPARATOR)).join('\r\n')}\r\n`;
}

function date(value: string | null, fallback: Date) {
  const parsed = value ? new Date(value) : fallback;
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function start(value: Date) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

function end(value: Date) {
  const d = new Date(value);
  d.setHours(23, 59, 59, 999);
  return d;
}

function formatDateTime(value: unknown) {
  if (!value) return '';
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return '';
  return new Intl.DateTimeFormat('pt-PT', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(parsed);
}

function formatDate(value: unknown) {
  if (!value) return '';
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return '';
  return new Intl.DateTimeFormat('pt-PT', {
    dateStyle: 'short',
  }).format(parsed);
}

function money(value: unknown) {
  if (value === null || value === undefined || value === '') return '';
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toFixed(2).replace('.', ',') : '';
}

function relationRecord(value: unknown): RowRecord | null {
  if (Array.isArray(value)) {
    const first = value[0];
    return first && typeof first === 'object' ? (first as RowRecord) : null;
  }
  return value && typeof value === 'object' ? (value as RowRecord) : null;
}

function response(filename: string, rows: unknown[][]) {
  return new NextResponse(csv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

export async function GET(request: Request) {
  try {
    const { admin, barbershopId, plan } = await requireModuleContext(
      'advanced_analytics',
      'analytics',
    );
    const url = new URL(request.url);
    const type = (url.searchParams.get('type') ?? 'appointments') as ExportType;
    const now = new Date();
    const from = start(
      date(url.searchParams.get('from'), new Date(now.getTime() - 29 * 86400000)),
    );
    const to = end(date(url.searchParams.get('to'), now));

    if (to < from || to.getTime() - from.getTime() > 366 * 86400000) {
      return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
    }

    const fromLabel = from.toISOString().slice(0, 10);
    const toLabel = to.toISOString().slice(0, 10);

    if (type === 'clients') {
      const { data, error } = await admin
        .from('users')
        .select('name_complete,email,num_phone,birth_date,created_at')
        .eq('barbershop_id', barbershopId)
        .eq('role', 'client')
        .order('created_at', { ascending: false })
        .limit(10000);
      if (error) throw error;

      return response(`silentra-clientes-${fromLabel}-${toLabel}.csv`, [
        ['Relatório', 'Clientes'],
        ['Período', `${fromLabel} a ${toLabel}`],
        [],
        ['Nome', 'Email', 'Telefone', 'Data de nascimento', 'Cliente desde'],
        ...(data ?? []).map((row) => [
          row.name_complete,
          row.email,
          row.num_phone,
          formatDate(row.birth_date),
          formatDate(row.created_at),
        ]),
      ]);
    }

    if (type === 'appointments') {
      const { data, error } = await admin
        .from('appointments')
        .select(
          'date_hour,status,manual_name,manual_email,manual_phone,value_products,payment_method,service:services(name,price),professional:professionals(name)',
        )
        .eq('barbershop_id', barbershopId)
        .gte('date_hour', from.toISOString())
        .lte('date_hour', to.toISOString())
        .order('date_hour', { ascending: true })
        .limit(20000);
      if (error) throw error;

      return response(`silentra-marcacoes-${fromLabel}-${toLabel}.csv`, [
        ['Relatório', 'Marcações'],
        ['Período', `${fromLabel} a ${toLabel}`],
        [],
        [
          'Data e hora',
          'Estado',
          'Cliente',
          'Email',
          'Telefone',
          'Serviço',
          'Preço do serviço (€)',
          'Produtos (€)',
          'Total (€)',
          'Pagamento',
          'Profissional',
        ],
        ...(data ?? []).map((row: RowRecord) => {
          const service = relationRecord(row.service);
          const servicePrice = Number(service?.price ?? 0);
          const products = Number(row.value_products ?? 0);
          return [
            formatDateTime(row.date_hour),
            row.status,
            row.manual_name,
            row.manual_email,
            row.manual_phone,
            service?.name,
            money(servicePrice),
            money(products),
            money(servicePrice + products),
            row.payment_method,
            relationRecord(row.professional)?.name,
          ];
        }),
      ]);
    }

    if (type === 'pos') {
      if (plan !== PLANS.ENTERPRISE) {
        return NextResponse.json(
          { error: 'POS export requires Enterprise.' },
          { status: 403 },
        );
      }

      const { data, error } = await admin
        .from('pos_transactions')
        .select('created_at,subtotal,discount,total,payment_method,status')
        .eq('barbershop_id', barbershopId)
        .gte('created_at', from.toISOString())
        .lte('created_at', to.toISOString())
        .order('created_at', { ascending: true })
        .limit(20000);
      if (error) throw error;

      return response(`silentra-financeiro-pos-${fromLabel}-${toLabel}.csv`, [
        ['Relatório', 'POS / Financeiro'],
        ['Período', `${fromLabel} a ${toLabel}`],
        [],
        ['Data e hora', 'Subtotal (€)', 'Desconto (€)', 'Total (€)', 'Pagamento', 'Estado'],
        ...(data ?? []).map((row) => [
          formatDateTime(row.created_at),
          money(row.subtotal),
          money(row.discount),
          money(row.total),
          row.payment_method,
          row.status,
        ]),
      ]);
    }

    return NextResponse.json({ error: 'Unsupported export type' }, { status: 400 });
  } catch (error) {
    console.error('[ANALYTICS_EXPORT]', error);
    return NextResponse.json(
      { error: 'Unable to export analytics' },
      { status: 500 },
    );
  }
}
