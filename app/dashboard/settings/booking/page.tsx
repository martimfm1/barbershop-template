import { redirect } from 'next/navigation';

export default function LegacyBookingSettingsRoute() {
  redirect('/dashboard/settings#settings-hours');
}
