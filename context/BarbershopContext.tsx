'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface BarbershopContextType {
  barbershopId: string | null;
  barbershopAvatarUrl: string | null;
  loading: boolean;
}

const BarbershopContext = createContext<BarbershopContextType>({
  barbershopId: null,
  barbershopAvatarUrl: null,
  loading: true,
});

export function BarbershopProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [barbershopId, setBarbershopId] = useState<string | null>(null);
  const [barbershopAvatarUrl, setBarbershopAvatarUrl] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function loadBarbershopData() {
      try {
        // Never trust the non-httpOnly barbershop cookie as the source of truth.
        // Resolve the tenant from the authenticated Supabase session first.
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          if (!cancelled) router.replace('/login');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('barbershop_id')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error(
            '[DASHBOARD_PROFILE_LOOKUP_FAIL]',
            profileError.message,
          );
          if (!cancelled) router.replace('/login?error=profile');
          return;
        }

        const resolvedBarbershopId = profile?.barbershop_id ?? null;

        if (!resolvedBarbershopId) {
          if (!cancelled) router.replace('/onboarding');
          return;
        }

        if (cancelled) return;

        setBarbershopId(resolvedBarbershopId);

        const { data: barbershop, error: barbershopError } = await supabase
          .from('barbershops')
          .select('avatar_url')
          .eq('id', resolvedBarbershopId)
          .maybeSingle();

        if (barbershopError) {
          console.error(
            '[DASHBOARD_BARBERSHOP_LOOKUP_FAIL]',
            barbershopError.message,
          );
        }

        if (barbershop?.avatar_url) {
          setBarbershopAvatarUrl(barbershop.avatar_url);
        } else {
          const { data: publicUrl } = supabase.storage
            .from('avatar')
            .getPublicUrl(`${resolvedBarbershopId}/avatar.webp`);

          setBarbershopAvatarUrl(publicUrl.publicUrl || null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('[DASHBOARD_CONTEXT_ERROR]', error);
          router.replace('/login');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadBarbershopData();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <BarbershopContext.Provider
      value={{ barbershopId, barbershopAvatarUrl, loading }}
    >
      {children}
    </BarbershopContext.Provider>
  );
}

export function useBarbershop() {
  const context = useContext(BarbershopContext);
  if (!context) {
    throw new Error(
      'useBarbershop deve ser usado dentro de um BarbershopProvider',
    );
  }
  return context;
}
