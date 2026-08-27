'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useBarbershop } from '@/context/BarbershopContext';
import { SettingsAmenitiesPanel } from '@/components/dashboard/settings-amenities-panel';

export function SettingsAmenitiesIntegration({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { barbershopId } = useBarbershop();

  const showAmenities = pathname === '/dashboard/settings';

  return (
    <>
      {showAmenities && barbershopId ? (
        <section
          id="settings-establishment"
          aria-labelledby="settings-establishment-heading"
          className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"
        >
          <div className="sr-only" id="settings-establishment-heading">
            Informações do estabelecimento
          </div>
          <SettingsAmenitiesPanel barbershopId={barbershopId} />
        </section>
      ) : null}
      {children}
    </>
  );
}
