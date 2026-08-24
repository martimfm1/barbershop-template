import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { inviteCode } = await request.json();
    if (typeof inviteCode !== 'string' || inviteCode.trim().length < 6)
      return NextResponse.json(
        { error: 'Introduz um código de convite válido.' },
        { status: 400 },
      );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user)
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { data, error } = await supabase.rpc('join_barbershop_with_invite', {
      p_code: inviteCode.trim(),
    });
    if (error) {
      console.error(
        '[ONBOARDING_JOIN_FAIL]',
        error.code ?? 'UNKNOWN',
        error.message ?? '',
      );
      if (
        error.code === 'P0001' &&
        error.message === 'TEAM_MEMBER_LIMIT_REACHED'
      ) {
        return NextResponse.json(
          {
            error:
              'Esta barbearia atingiu o limite de pessoas da equipa do plano atual.',
          },
          { status: 409 },
        );
      }
      if (error.code === '22023') {
        if (error.message === 'already_team_member')
          return NextResponse.json(
            { error: 'Já fazes parte da equipa desta barbearia.' },
            { status: 409 },
          );
        return NextResponse.json(
          { error: 'O código é inválido, já foi utilizado ou expirou.' },
          { status: 400 },
        );
      }
      if (error.code === '42501')
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      return NextResponse.json(
        { error: 'Não foi possível associar a tua conta à barbearia.' },
        { status: 500 },
      );
    }

    const membership = Array.isArray(data) ? data[0] : data;
    if (!membership?.barbershop_id || !membership?.role) {
      console.error(
        '[ONBOARDING_JOIN_INVALID_RESPONSE]',
        'INVALID_RPC_RESPONSE',
      );
      return NextResponse.json(
        { error: 'Não foi possível concluir a associação.' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      barbershopId: membership.barbershop_id,
      role: membership.role,
    });
  } catch (error) {
    console.error(
      '[ONBOARDING_JOIN_CRITICAL_ERROR]',
      error instanceof Error ? error.name : 'UNKNOWN',
    );
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
