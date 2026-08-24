import { useMemo } from 'react';
import { Appointment } from '@/types';

export function useDashboardStats(appointments: Appointment[]) {
  const todayCuts = useMemo(() => {
    const todayStr = new Date().toDateString();
    return appointments.filter((app) => {
      const appDateStr = new Date(app.date_hour).toDateString();
      return appDateStr === todayStr && app.status !== 'cancelled';
    });
  }, [appointments]);

  const pendingCount = useMemo(() => {
    return appointments.filter(
      (app) => app.status === 'scheduled' || app.status === 'pending',
    ).length;
  }, [appointments]);

  const totalRevenue = useMemo(() => {
    return appointments.reduce((acc, app) => {
      if (app.status === 'completed') {
        const servicePrice = Number(app.services?.price) || 0;
        const productValue = Number(app.value_products) || 0;
        return acc + servicePrice + productValue;
      }
      return acc;
    }, 0);
  }, [appointments]);

  const paymentStats = useMemo(() => {
    const stats: Record<string, number> = {
      Dinheiro: 0,
      'MB Way': 0,
      Cartão: 0,
    };
    appointments.forEach((app) => {
      if (app.status === 'completed') {
        let method = 'Dinheiro';
        if (app.payment_method === 'mbway') method = 'MB Way';
        if (app.payment_method === 'card') method = 'Cartão';

        const servicePrice = Number(app.services?.price) || 0;
        const productValue = Number(app.value_products) || 0;
        stats[method] += servicePrice + productValue;
      }
    });
    return Object.entries(stats).map(([name, value]) => ({ name, value }));
  }, [appointments]);

  const serviceStats = useMemo(() => {
    const stats: Record<string, { total: number; qty: number }> = {};
    appointments.forEach((app) => {
      if (app.status === 'completed') {
        const serviceName = app.services?.name || 'Serviço Padrão';
        if (!stats[serviceName]) {
          stats[serviceName] = { total: 0, qty: 0 };
        }
        stats[serviceName].total += Number(app.services?.price) || 0;
        stats[serviceName].qty += 1;
      }
    });
    return Object.entries(stats)
      .map(([name, d]) => ({ name, value: d.total, quantity: d.qty }))
      .sort((a, b) => b.value - a.value);
  }, [appointments]);

  const professionalStats = useMemo(() => {
    const stats: Record<string, number> = {};
    appointments.forEach((app) => {
      if (app.status === 'completed') {
        const profName = app.professionals?.name || 'Sem Barbeiro';
        const servicePrice = Number(app.services?.price) || 0;
        stats[profName] = (stats[profName] || 0) + servicePrice;
      }
    });
    return Object.entries(stats).map(([name, value]) => ({ name, value }));
  }, [appointments]);

  const insights = useMemo(() => {
    const completedApps = appointments.filter((a) => a.status === 'completed');
    const avgTicket =
      completedApps.length > 0 ? totalRevenue / completedApps.length : 0;
    const mostPopular =
      serviceStats.length > 0
        ? `${serviceStats[0].name} (${serviceStats[0].quantity}x)`
        : 'Nenhum';
    return { avgTicket, mostPopular };
  }, [appointments, serviceStats, totalRevenue]);

  const chartDataWeekly = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - i);
      const dayStr = targetDate.toDateString();

      const dayApps = appointments.filter(
        (a) => new Date(a.date_hour).toDateString() === dayStr,
      );

      const dayRevenue = dayApps
        .filter((a) => a.status === 'completed')
        .reduce(
          (acc, app) =>
            acc +
            (Number(app.services?.price) || 0) +
            (Number(app.value_products) || 0),
          0,
        );

      data.push({
        day: targetDate.toLocaleDateString('pt-PT', { weekday: 'short' }),
        bookings: dayApps.length,
        revenue: dayRevenue,
      });
    }
    return data;
  }, [appointments]);

  return {
    todayCuts,
    pendingCount,
    totalRevenue,
    paymentStats,
    serviceStats,
    professionalStats,
    insights,
    chartDataWeekly,
  };
}
