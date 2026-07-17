import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DASHBOARD_METRIC_DESCRIPTORS, MetricKey } from "@/app/dashboard/_constants";

interface DashboardMetricsProps {
  metricsData: Record<MetricKey, number | string>;
}

export function DashboardMetrics({ metricsData }: DashboardMetricsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Object.entries(DASHBOARD_METRIC_DESCRIPTORS).map(([key, descriptor]) => {
        const value = metricsData[key as MetricKey] ?? 0;
        const Icon = descriptor.icon;

        return (
          <Card key={key} className="bg-zinc-900 border-white/5 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">
                {descriptor.label}
              </CardTitle>
              <Icon className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}