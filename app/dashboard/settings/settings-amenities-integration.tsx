'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useBarbershop } from '@/context/BarbershopContext';
import { SettingsAmenitiesPanel } from '@/components/dashboard/settings-amenities-panel';
import { SettingsAutomaticBookingPanel } from '@/components/dashboard/settings-automatic-booking-panel';

export function SettingsAmenitiesIntegration({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { barbershopId } = useBarbershop();
  const showSettingsExtras = pathname === '/dashboard/settings';

  return (
    <>
      {showSettingsExtras && barbershopId ? (
        <section
          id="settings-establishment"
          aria-label="Configurações avançadas da barbearia"
          className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"
        >
          <SettingsAmenitiesPanel barbershopId={barbershopId} />
          <SettingsAutomaticBookingPanel barbershopId={barbershopId} />
        </section>
      ) : null}
      {children}
    </>
  );
}
