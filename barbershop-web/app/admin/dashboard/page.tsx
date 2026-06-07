"use client";
import { SiteNavbar } from "@/components/site-navbar";
import { Area, AreaChart, CartesianGrid, Line, XAxis, YAxis } from "recharts";
import {
  Activity,
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  MessageCircle,
  RefreshCcw,
  Scissors,
  TrendingUp,
  Users,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react";

import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { Spotlight } from "@/components/aceternity/spotlight";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const metrics = [
  {
    label: "Total Revenue",
    value: "2 840 EUR",
    change: "+12.4%",
    icon: CircleDollarSign,
  },
  {
    label: "Total Bookings",
    value: "148",
    change: "+18 this week",
    icon: CalendarCheck,
  },
  {
    label: "New Clients",
    value: "32",
    change: "+8.2%",
    icon: Users,
  },
  {
    label: "Occupancy Rate",
    value: "86%",
    change: "Goal 90%",
    icon: Activity,
  },
];

const chartData = [
  { day: "Mon", bookings: 12, revenue: 220 },
  { day: "Tue", bookings: 18, revenue: 340 },
  { day: "Wed", bookings: 15, revenue: 310 },
  { day: "Thu", bookings: 24, revenue: 480 },
  { day: "Fri", bookings: 31, revenue: 660 },
  { day: "Sat", bookings: 36, revenue: 820 },
  { day: "Sun", bookings: 10, revenue: 180 },
];

const chartConfig = {
  bookings: {
    label: "Bookings",
    color: "rgba(250,250,250,0.9)",
  },
  revenue: {
    label: "Revenue",
    color: "rgba(161,161,170,0.65)",
  },
} satisfies ChartConfig;

const todayCuts = [
  {
    name: "Rafael Costa",
    time: "10:30",
    service: "Signature Graham",
    status: "Confirmed",
  },
  {
    name: "Joao Martins",
    time: "12:00",
    service: "Classic Cut",
    status: "En route",
  },
  {
    name: "Tiago Alves",
    time: "15:45",
    service: "Beard Ritual",
    status: "Pending",
  },
  {
    name: "Marco Reis",
    time: "17:15",
    service: "Cut + Styling",
    status: "Confirmed",
  },
];

const appointments = [
  {
    client: "Rafael Costa",
    phone: "+351 912 345 111",
    service: "Signature Graham",
    date: "Today",
    time: "10:30",
    status: "Confirmed",
  },
  {
    client: "Joao Martins",
    phone: "+351 934 222 871",
    service: "Classic Cut",
    date: "Today",
    time: "12:00",
    status: "En route",
  },
  {
    client: "Tiago Alves",
    phone: "+351 966 414 209",
    service: "Beard Ritual",
    date: "Today",
    time: "15:45",
    status: "Pending",
  },
  {
    client: "Andre Lopes",
    phone: "+351 925 771 008",
    service: "Classic Cut",
    date: "Tomorrow",
    time: "11:00",
    status: "Confirmed",
  },
  {
    client: "Pedro Maia",
    phone: "+351 913 994 312",
    service: "Cut + Beard",
    date: "Tomorrow",
    time: "16:30",
    status: "Pending",
  },
];

const quickActions = [
  {
    label: "New booking",
    description: "Add client manually",
    icon: CalendarCheck,
  },
  {
    label: "Send reminders",
    description: "Confirm upcoming slots",
    icon: MessageCircle,
  },
  {
    label: "View clients",
    description: "Check history and preferences",
    icon: Users,
  },
];

const priorities = [
  {
    title: "2 pending bookings",
    description: "Confirm before 11:00 to avoid gaps in the schedule.",
    icon: AlertCircle,
  },
  {
    title: "Occupancy near goal",
    description: "4 percentage points away from 90% this week.",
    icon: TrendingUp,
  },
  {
    title: "Healthy bot",
    description: "WhatsApp connected and ready to respond to clients.",
    icon: Wifi,
  },
];

function StatusBadge({ status }: { status: string }) {
  const styles = {
    Confirmed: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    "En route": "border-zinc-400/20 bg-zinc-400/10 text-zinc-200",
    Pending: "border-white/15 bg-white/5 text-zinc-300",
    Completed: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    Cancelled: "border-red-400/20 bg-red-400/10 text-red-200",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
        styles[status as keyof typeof styles] ?? styles.Pending,
      )}
    >
      {status}
    </span>
  );
}

export default function AdminDashboardPage() {
  const botConnected = true;

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <SiteNavbar />
      <BackgroundBeams className="opacity-35" />
      <Spotlight className="opacity-70" />
      {/* Content Section */}
      <div className="relative px-3 pb-8 pt-8 text-foreground sm:px-5 md:px-8 md:pb-12">
        <div className="relative mx-auto grid w-full max-w-7xl gap-8">
          <section className="grid gap-3 md:gap-4 md:grid-cols-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                className="interactive-card rounded-[var(--radius-4xl)] border border-white/10 bg-white/[0.04] p-3 md:p-5 text-left shadow-none"
              >
                <span className="mb-3 md:mb-4 flex size-9 md:size-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-100">
                  <action.icon className="size-4 md:size-5" />
                </span>
                <span className="block font-heading text-base md:text-lg lg:text-2xl font-semibold text-zinc-50">
                  {action.label}
                </span>
                <span className="mt-1 block text-xs md:text-sm text-zinc-500">
                  {action.description}
                </span>
              </button>
            ))}
          </section>

          <section className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <Card
                key={metric.label}
                className="interactive-card border border-white/10 bg-white/[0.04] shadow-none"
              >
                <CardHeader className="flex-row items-start justify-between p-3 md:p-4">
                  <div>
                    <CardDescription className="text-xs md:text-sm">
                      {metric.label}
                    </CardDescription>
                    <CardTitle className="mt-2 md:mt-3 font-heading text-xl md:text-2xl lg:text-4xl text-zinc-50">
                      {metric.value}
                    </CardTitle>
                  </div>
                  <span className="flex size-8 md:size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-200 flex-shrink-0">
                    <metric.icon className="size-4 md:size-5" />
                  </span>
                </CardHeader>
                <CardContent className="p-3 md:p-4 pt-0 md:pt-0">
                  <p className="text-xs md:text-sm text-zinc-400">
                    {metric.change}
                  </p>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="grid gap-3 md:gap-4 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_380px]">
            <Card className="interactive-card border border-white/10 bg-white/[0.04] shadow-none">
              <CardHeader className="p-3 md:p-4 md:pb-3">
                <CardTitle className="font-heading text-lg md:text-2xl lg:text-3xl text-zinc-50">
                  Weekly progress
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Bookings and revenue simulated over the last 7 days.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 md:p-4">
                <ChartContainer
                  config={chartConfig}
                  className="h-[250px] md:h-[300px] w-full"
                  initialDimension={{ width: 700, height: 300 }}
                >
                  <AreaChart data={chartData} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid vertical={false} strokeDasharray="4 4" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} width={32} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      dataKey="revenue"
                      type="monotone"
                      fill="var(--color-revenue)"
                      fillOpacity={0.12}
                      stroke="var(--color-revenue)"
                      strokeWidth={2}
                    />
                    <Line
                      dataKey="bookings"
                      type="monotone"
                      stroke="var(--color-bookings)"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "var(--color-bookings)" }}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="interactive-card border border-white/10 bg-white/[0.04] shadow-none">
              <CardHeader className="p-3 md:p-4 md:pb-3">
                <CardTitle className="font-heading text-lg md:text-2xl lg:text-3xl text-zinc-50">
                  Upcoming cuts
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Real-time daily schedule.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 md:p-4 grid gap-2 md:gap-3">
                {todayCuts.map((cut) => (
                  <div
                    key={`${cut.time}-${cut.name}`}
                    className="interactive-item rounded-xl md:rounded-2xl border border-white/10 bg-black/20 p-2.5 md:p-4"
                  >
                    <div className="flex items-start justify-between gap-2 md:gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-xs md:text-sm text-zinc-100 truncate">
                          {cut.name}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500 truncate">
                          {cut.service}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 md:px-3 py-1 text-xs md:text-sm text-zinc-200 flex-shrink-0">
                        <Clock className="size-3 md:size-3.5" />
                        {cut.time}
                      </span>
                    </div>
                    <div className="mt-2 md:mt-3">
                      <StatusBadge status={cut.status} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-3 md:gap-4 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_380px]">
            <Card className="interactive-card border border-white/10 bg-white/[0.04] shadow-none">
              <CardHeader className="p-3 md:p-4 md:pb-3">
                <CardTitle className="font-heading text-lg md:text-2xl lg:text-3xl text-zinc-50">
                  Booking management
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Operational list with quick actions for each booking.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 md:p-4 overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-xs md:text-sm">
                  <thead className="text-xs uppercase tracking-wide text-zinc-500 text-[10px] md:text-xs">
                    <tr className="border-b border-white/10">
                      <th className="py-2 md:py-3 pr-2 md:pr-4 font-medium">
                        Client
                      </th>
                      <th className="py-2 md:py-3 pr-2 md:pr-4 font-medium">
                        Service
                      </th>
                      <th className="py-2 md:py-3 pr-2 md:pr-4 font-medium">
                        Date
                      </th>
                      <th className="py-2 md:py-3 pr-2 md:pr-4 font-medium">
                        Status
                      </th>
                      <th className="py-2 md:py-3 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appointment) => (
                      <tr
                        key={`${appointment.client}-${appointment.time}`}
                        className="border-b border-white/5"
                      >
                        <td className="py-2 md:py-4 pr-2 md:pr-4">
                          <p className="font-semibold text-xs md:text-sm text-zinc-100">
                            {appointment.client}
                          </p>
                          <p className="mt-0.5 md:mt-1 text-[9px] md:text-xs text-zinc-500 hidden md:block">
                            {appointment.phone}
                          </p>
                        </td>
                        <td className="py-2 md:py-4 pr-2 md:pr-4 text-xs md:text-sm text-zinc-300">
                          {appointment.service}
                        </td>
                        <td className="py-2 md:py-4 pr-2 md:pr-4 text-xs md:text-sm text-zinc-300">
                          {appointment.date} - {appointment.time}
                        </td>
                        <td className="py-2 md:py-4 pr-2 md:pr-4">
                          <StatusBadge status={appointment.status} />
                        </td>
                        <td className="py-2 md:py-4">
                          <div className="flex justify-end gap-1 md:gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 md:h-8 px-2 md:px-3 text-xs md:text-sm border-emerald-400/20 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/15"
                            >
                              <CheckCircle2 className="size-3 md:size-4" />
                              <span className="hidden md:inline">Complete</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 md:h-8 px-2 md:px-3 text-xs md:text-sm border-red-400/20 bg-red-400/10 text-red-200 hover:bg-red-400/15"
                            >
                              <XCircle className="size-3 md:size-4" />
                              <span className="hidden md:inline">Cancel</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card className="interactive-card border border-white/10 bg-white/[0.04] shadow-none">
              <CardHeader className="p-3 md:p-4 md:pb-3">
                <CardTitle className="font-heading text-lg md:text-2xl lg:text-3xl text-zinc-50">
                  WhatsApp Bot
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Bot status and maintenance tools.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 md:p-4 grid gap-3 md:gap-5">
                <div className="rounded-xl md:rounded-2xl border border-white/10 bg-black/20 p-3 md:p-4">
                  <div className="flex items-center justify-between gap-2 md:gap-3">
                    <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                      <span
                        className={cn(
                          "size-2.5 md:size-3 rounded-full flex-shrink-0",
                          botConnected ? "bg-emerald-400" : "bg-red-400",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-xs md:text-sm text-zinc-100">
                          {botConnected
                            ? "WhatsApp Connected"
                            : "Waiting for connection"}
                        </p>
                        <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs text-zinc-500">
                          Last check 2 minutes ago
                        </p>
                      </div>
                    </div>
                    {botConnected ? (
                      <Wifi className="size-4 md:size-5 text-emerald-300 flex-shrink-0" />
                    ) : (
                      <WifiOff className="size-4 md:size-5 text-red-300 flex-shrink-0" />
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-xs md:text-sm">
                    <span className="text-zinc-400">Bot health</span>
                    <span className="font-medium text-zinc-100">92%</span>
                  </div>
                  <Progress value={92} className="bg-white/10 h-1.5 md:h-2" />
                </div>

                <Separator className="bg-white/10" />

                <div className="grid gap-2 md:gap-3">
                  <Button className="h-9 md:h-11 rounded-full bg-zinc-50 text-xs md:text-sm text-zinc-950 hover:bg-white">
                    <RefreshCcw className="size-3 md:size-4" />
                    Restart Bot
                  </Button>
                  <Button
                    variant="outline"
                    className="h-9 md:h-11 rounded-full border-white/10 bg-white/5 text-xs md:text-sm text-zinc-100 hover:bg-white/10"
                  >
                    Generate New QR Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {priorities.map((priority) => (
              <Card
                key={priority.title}
                className="interactive-card border border-white/10 bg-white/[0.035] shadow-none"
              >
                <CardHeader className="p-3 md:p-4">
                  <span className="mb-2 md:mb-3 flex size-8 md:size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-100">
                    <priority.icon className="size-4 md:size-5" />
                  </span>
                  <CardTitle className="font-heading text-base md:text-lg lg:text-2xl text-zinc-50">
                    {priority.title}
                  </CardTitle>
                  <CardDescription className="leading-5 md:leading-6 text-xs md:text-sm">
                    {priority.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
