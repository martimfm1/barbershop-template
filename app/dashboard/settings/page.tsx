import SettingsPage from './settings-page';
import { SettingsCancellationPolicyPanel } from '@/components/dashboard/settings-cancellation-policy-panel';

export default function SettingsRoute() {
  return (
    <>
      <SettingsPage />
      <div className="bg-zinc-950 px-4 pb-28 text-zinc-50 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl lg:pl-[272px]">
          <SettingsCancellationPolicyPanel />
        </div>
      </div>
    </>
  );
}
