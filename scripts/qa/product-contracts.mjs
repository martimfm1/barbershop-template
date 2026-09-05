import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();

async function read(path) {
  return readFile(resolve(root, path), 'utf8');
}

const checks = [
  {
    name: 'Final booking migration uses appointment_status',
    file: 'supabase/migrations/20260905150000_finalize_atomic_booking_contract.sql',
    test: (source) =>
      source.includes('v_status public.appointment_status') &&
      source.includes("'pending'::public.appointment_status") &&
      source.includes("'scheduled'::public.appointment_status"),
  },
  {
    name: 'Final booking migration enforces closed days',
    file: 'supabase/migrations/20260905150000_finalize_atomic_booking_contract.sql',
    test: (source) =>
      source.includes('BARBERSHOP_CLOSED_DAY') &&
      source.includes("at time zone 'Europe/Lisbon'") &&
      source.includes('unnest(string_to_array'),
  },
  {
    name: 'Final booking migration links existing clients',
    file: 'supabase/migrations/20260905150000_finalize_atomic_booking_contract.sql',
    test: (source) =>
      source.includes('v_client_id uuid') &&
      source.includes("u.role = 'client'") &&
      source.includes('= v_phone'),
  },
  {
    name: 'Canonical onboarding join route uses invite RPC',
    file: 'app/api/onboarding/join-v2/route.ts',
    test: (source) =>
      source.includes("rpc('join_barbershop_with_invite'") &&
      source.includes('BARB-7K4P-9X2M'),
  },
  {
    name: 'Legacy onboarding join delegates to the canonical route',
    file: 'app/api/onboarding/join/route.ts',
    test: (source) =>
      source.includes("from '@/app/api/onboarding/join-v2/route'") &&
      source.includes('export { POST }'),
  },
  {
    name: 'Invite generator migration creates BARB formatted codes',
    file: 'supabase/migrations/20260905121500_standardize_team_invite_codes.sql',
    test: (source) =>
      source.includes("v_code := 'BARB-'") &&
      source.includes('ABCDEFGHJKLMNPQRSTUVWXYZ23456789'),
  },
  {
    name: 'Marketplace lifecycle has durable order events',
    file: 'supabase/migrations/20260905133000_marketplace_order_lifecycle.sql',
    test: (source) =>
      source.includes('marketplace_order_events') &&
      source.includes('record_marketplace_order_status_event'),
  },
  {
    name: 'Marketplace lifecycle validates transitions',
    file: 'supabase/migrations/20260905133000_marketplace_order_lifecycle.sql',
    test: (source) =>
      source.includes('update_marketplace_order_status_atomic') &&
      source.includes('invalid_order_transition'),
  },
  {
    name: 'Manual customer email is scoped to the barbershop',
    file: 'app/api/marketplace/orders/[orderId]/email/route.ts',
    test: (source) =>
      source.includes("requireModuleContext('pos', 'pos')") &&
      source.includes(".eq('barbershop_id', barbershopId)") &&
      source.includes('sendBrevoEmail'),
  },
  {
    name: 'Public booking has mobile-safe horizontal overflow rules',
    file: 'app/silentra-responsive.css',
    test: (source) =>
      source.includes('overflow-x: clip') &&
      source.includes('safe-area-inset-bottom') &&
      source.includes("nav[aria-label='Navegação rápida']"),
  },
];

let failed = 0;
for (const check of checks) {
  try {
    const source = await read(check.file);
    const ok = check.test(source);
    if (!ok) {
      failed += 1;
      console.error(`FAIL ${check.name}`);
    } else {
      console.log(`PASS ${check.name}`);
    }
  } catch (error) {
    failed += 1;
    console.error(
      `FAIL ${check.name}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

if (failed > 0) {
  console.error(`\n${failed} product contract check(s) failed.`);
  process.exit(1);
}

console.log(`\nAll ${checks.length} product contract checks passed.`);
