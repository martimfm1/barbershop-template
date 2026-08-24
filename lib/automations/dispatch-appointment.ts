import { createAdminClient } from '@/lib/supabase/admin';
import { sendBrevoEmail } from '@/lib/email/brevo';

type Trigger = 'booking_created' | 'booking_completed' | 'booking_cancelled';

type AppointmentEvent = {
  appointmentId: string;
  barbershopId: string;
  clientId?: string | null;
  manualEmail?: string | null;
  manualName?: string | null;
  serviceName?: string | null;
};

function token(value: string, vars: { nome: string; barbearia: string }) {
  return value
    .replaceAll('{{nome}}', vars.nome)
    .replaceAll('{{barbearia}}', vars.barbearia)
    .replaceAll(
      '{{booking_url}}',
      `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://barbers.silentra.me'}/barbershops`,
    );
}

function html(value: string) {
  return value
    .replace(
      /[&<>\"']/g,
      (char) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[char] ?? char,
    )
    .replace(/\n/g, '<br />');
}

export async function dispatchAppointmentAutomations(
  trigger: Trigger,
  event: AppointmentEvent,
): Promise<void> {
  try {
    const admin = createAdminClient();
    const [{ data: rules, error: rulesError }, { data: shop }] =
      await Promise.all([
        admin
          .from('automation_rules')
          .select('id,name,actions,conditions')
          .eq('barbershop_id', event.barbershopId)
          .eq('trigger_type', trigger)
          .eq('active', true),
        admin
          .from('barbershops')
          .select('name')
          .eq('id', event.barbershopId)
          .maybeSingle(),
      ]);
    if (rulesError) throw rulesError;

    let email = event.manualEmail?.trim().toLowerCase() ?? '';
    let name = event.manualName?.trim() ?? 'Cliente';
    if ((!email || !name) && event.clientId) {
      const { data: client } = await admin
        .from('users')
        .select('email,name_complete')
        .eq('id', event.clientId)
        .eq('barbershop_id', event.barbershopId)
        .maybeSingle();
      email = email || client?.email?.trim().toLowerCase() || '';
      name = name || client?.name_complete?.trim() || 'Cliente';
    }
    if (!email) return;

    for (const rule of rules ?? []) {
      const action = Array.isArray(rule.actions)
        ? (rule.actions as Array<Record<string, unknown>>).find(
            (item) => item.type === 'email',
          )
        : null;
      if (!action || typeof action.body !== 'string') continue;

      const { data: existing } = await admin
        .from('automation_runs')
        .select('id,status')
        .eq('rule_id', rule.id)
        .eq('entity_id', event.appointmentId)
        .limit(1)
        .maybeSingle();
      if (existing) continue;

      const { data: run, error: runError } = await admin
        .from('automation_runs')
        .insert({
          rule_id: rule.id,
          barbershop_id: event.barbershopId,
          entity_id: event.appointmentId,
          status: 'running',
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (runError || !run) continue;

      const variables = {
        nome: name || 'Cliente',
        barbearia: shop?.name?.trim() || 'A tua barbearia',
      };
      const subject =
        typeof action.subject === 'string'
          ? token(action.subject, variables)
          : `${rule.name} — ${variables.barbearia}`;
      const body = token(action.body, variables);
      const result = await sendBrevoEmail({
        to: email,
        toName: name,
        subject,
        htmlContent: `<div style="font-family:Arial,sans-serif;line-height:1.6">${html(body)}</div>`,
      });
      await admin
        .from('automation_runs')
        .update({
          status: result.success ? 'completed' : 'failed',
          error_message: result.success ? null : result.error,
          completed_at: new Date().toISOString(),
        })
        .eq('id', run.id);
    }
  } catch (error) {
    console.error('[AUTOMATION_APPOINTMENT_DISPATCH]', {
      trigger,
      appointmentId: event.appointmentId,
      error,
    });
  }
}
