import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { FeatureKey } from '@/lib/billing/plan-features';
import { FeatureAccessService } from './feature-access.service';

/**
 * Reusable guard for API routes that require a specific plan feature.
 *
 * Usage:
 *   const guard = await requireFeature(request, "professionals");
 *   if (!guard.ok) return guard.response;
 *   // guard.userId, guard.plan available
 */
export async function requireFeature(
  request: Request,
  feature: FeatureKey,
): Promise<
  | { ok: true; userId: string; plan: string }
  | { ok: false; response: NextResponse }
> {
  const {
    data: { user },
    error,
  } = await (await createClient()).auth.getUser();
  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Não autenticado.' },
        { status: 401 },
      ),
    };
  }

  const hasFeature = await FeatureAccessService.hasFeature(user.id, feature);
  if (!hasFeature) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            'Esta funcionalidade requer um plano pago ativo. Faz upgrade para continuar a usar.',
        },
        { status: 403 },
      ),
    };
  }

  return { ok: true, userId: user.id, plan: 'paid' };
}
