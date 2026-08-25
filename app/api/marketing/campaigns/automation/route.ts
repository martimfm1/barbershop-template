import { NextRequest, NextResponse } from 'next/server';
import {
  requireModuleContext,
  moduleErrorResponse,
} from '@/services/modules/authorization';

const EVENTS = [
  'booking_created',
  'booking_completed',
  'booking_cancelled',
] as const;
const MODES = ['manual', 'interval', 'event', 'birthday'] as const;

export async function GET() {
  try {
    const { admin, barbershopId } = await requireModuleContext(
      'marketing_campaigns',
      'marketing',
    );
    const { data, error } = await admin
      .from('marketing_campaigns')
      .select(
        'id,name,channel,trigger_type,interval_value,interval_unit,next_run_at,event_name,birthday_offset_days,active,status',
      )
      .eq('barbershop_id', barbershopId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({
      ok: true,
      campaigns: data ?? [],
      events: EVENTS,
    });
  } catch (error) {
    const response = moduleErrorResponse(error);
    if (response) return response;
    return NextResponse.json(
      { ok: false, error: 'Unable to load campaign automation settings.' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { admin, barbershopId } = await requireModuleContext(
      'marketing_campaigns',
      'marketing',
    );
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const id = typeof body?.id === 'string' ? body.id : '';
    const mode = typeof body?.triggerType === 'string' ? body.triggerType : 'manual';

    if (!id || !MODES.includes(mode as (typeof MODES)[number])) {
      return NextResponse.json(
        { error: 'Invalid automation configuration.' },
        { status: 400 },
      );
    }

    const patch: Record<string, unknown> = {
      trigger_type: mode,
      updated_at: new Date().toISOString(),
    };

    if (mode === 'interval') {
      const value = Number(body?.intervalValue);
      const unit = body?.intervalUnit;
      if (
        !Number.isInteger(value) ||
        value < 1 ||
        value > 3650 ||
        !['hours', 'days'].includes(String(unit))
      ) {
        return NextResponse.json({ error: 'Interval inválido.' }, { status: 400 });
      }
      patch.interval_value = value;
      patch.interval_unit = unit;
      patch.event_name = null;
      patch.birthday_offset_days = 0;
      patch.active = true;
      patch.next_run_at = new Date(
        Date.now() + (unit === 'days' ? value * 86400000 : value * 3600000),
      ).toISOString();
      patch.status = 'scheduled';
    } else if (mode === 'event') {
      const eventName = typeof body?.eventName === 'string' ? body.eventName : '';
      if (!EVENTS.includes(eventName as (typeof EVENTS)[number])) {
        return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
      }
      patch.interval_value = null;
      patch.interval_unit = null;
      patch.next_run_at = null;
      patch.event_name = eventName;
      patch.birthday_offset_days = 0;
      patch.active = true;
      patch.status = 'draft';
    } else if (mode === 'birthday') {
      const offset = Number(body?.birthdayOffsetDays ?? 0);
      if (!Number.isInteger(offset) || offset < -365 || offset > 365) {
        return NextResponse.json(
          { error: 'O desvio do aniversário deve estar entre -365 e 365 dias.' },
          { status: 400 },
        );
      }
      patch.interval_value = null;
      patch.interval_unit = null;
      patch.next_run_at = null;
      patch.event_name = null;
      patch.birthday_offset_days = offset;
      patch.active = true;
      patch.status = 'scheduled';
    } else {
      patch.interval_value = null;
      patch.interval_unit = null;
      patch.next_run_at = null;
      patch.event_name = null;
      patch.birthday_offset_days = 0;
      patch.active = true;
      patch.status = 'draft';
    }

    const { data, error } = await admin
      .from('marketing_campaigns')
      .update(patch)
      .eq('id', id)
      .eq('barbershop_id', barbershopId)
      .select(
        'id,name,channel,trigger_type,interval_value,interval_unit,next_run_at,event_name,birthday_offset_days,active,status',
      )
      .maybeSingle();

    if (error) throw error;
    if (!data)
      return NextResponse.json({ error: 'Campanha não encontrada.' }, { status: 404 });
    return NextResponse.json({ ok: true, campaign: data });
  } catch (error) {
    const response = moduleErrorResponse(error);
    if (response) return response;
    console.error('[MARKETING_AUTOMATION_PATCH]', error);
    return NextResponse.json(
      { ok: false, error: 'Não foi possível atualizar a automação.' },
      { status: 500 },
    );
  }
}
