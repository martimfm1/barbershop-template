import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DASHBOARD_METRIC_DESCRIPTORS,
  MetricKey,
} from '@/app/dashboard/_constants';

interface DashboardMetricsProps {
  metricsData: Record<MetricKey, number | string>;
}

export function DashboardMetrics({ metricsData }: DashboardMetricsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Object.entries(DASHBOARD_METRIC_DESCRIPTORS).map(([key, descriptor]) => {
        const value = metricsData[key as MetricKey] ?? 0;
        const Icon = descriptor.icon;

        return (
          <Card
            key={key}
            className="group border-white/[0.08] bg-white/[0.025] transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-white/[0.14] hover:bg-white/[0.035]"
          >
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 px-5 pb-2 pt-5 sm:px-6 sm:pt-6">
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                {descriptor.label}
              </CardTitle>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] text-zinc-400 transition-colors group-hover:border-emerald-400/15 group-hover:bg-emerald-400/[0.06] group-hover:text-emerald-300">
                <Icon className="size-4" aria-hidden="true" />
              </span>
            </CardHeader>
            <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
              <div className="text-2xl font-semibold tracking-[-0.035em] text-zinc-50 sm:text-3xl">
                {value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
