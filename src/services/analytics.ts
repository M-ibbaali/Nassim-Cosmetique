'use server';

import { createClient } from '@/lib/supabase/server';
import { DailyRevenue, BestProduct, AnalyticsSummary, ProfitTrend } from '@/types';
import { startOfDay, startOfWeek, startOfMonth, format } from 'date-fns';

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const supabase = await createClient();
  
  const { data: todayStats } = await supabase.from('v_sales_today').select('*').single();
  const { count: lowStockCount } = await supabase.from('v_low_stock').select('*', { count: 'exact', head: true });
  const { data: profitOverview } = await supabase.from('v_profit_margin_overview').select('*').single();

  const now = new Date();
  const weekStart = startOfWeek(now).toISOString();
  const monthStart = startOfMonth(now).toISOString();

  const { data: weekData } = await supabase.from('sales').select('total_revenue').gte('created_at', weekStart);
  const { data: monthData } = await supabase.from('sales').select('total_revenue').gte('created_at', monthStart);

  const weekRevenue = weekData?.reduce((acc, curr) => acc + Number(curr.total_revenue), 0) || 0;
  const monthRevenue = monthData?.reduce((acc, curr) => acc + Number(curr.total_revenue), 0) || 0;

  return {
    todayRevenue: todayStats?.revenue || 0,
    todaySalesCount: todayStats?.count || 0,
    todayProfit: todayStats?.profit || 0,
    weekRevenue,
    monthRevenue,
    netProfit: profitOverview?.total_profit || 0,
    profitMargin: profitOverview?.avg_profit_margin || 0,
    lowStockCount: lowStockCount || 0,
  };
}

export async function getDailyProfitTrend(): Promise<ProfitTrend[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('v_profit_trend_daily').select('*').limit(30);
  if (error) throw error;
  return data || [];
}

export async function getBestProductsProfit(): Promise<BestProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('v_product_profit_analysis').select('*').limit(20);
  if (error) throw error;
  return data || [];
}

export interface FilteredAnalytics {
  totalRevenue: number;
  totalProfit: number;
  totalSales: number;
  profitMargin: number;
  trend: { day: string; revenue: number; profit: number; cost: number }[];
}

export async function getFilteredAnalytics(startDate: string, endDate: string): Promise<FilteredAnalytics> {
  const supabase = await createClient();

  // Query sales in the date range
  const { data: sales, error } = await supabase
    .from('sales')
    .select('id, created_at, total_revenue, total_profit')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const salesData = sales || [];

  const totalRevenue = salesData.reduce((sum, s) => sum + Number(s.total_revenue || 0), 0);
  const totalProfit = salesData.reduce((sum, s) => sum + Number(s.total_profit || 0), 0);
  const totalSales = salesData.length;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Build daily trend from raw sales
  const dayMap: Record<string, { revenue: number; profit: number; cost: number }> = {};
  for (const sale of salesData) {
    const day = sale.created_at.slice(0, 10); // YYYY-MM-DD
    if (!dayMap[day]) dayMap[day] = { revenue: 0, profit: 0, cost: 0 };
    dayMap[day].revenue += Number(sale.total_revenue || 0);
    dayMap[day].profit += Number(sale.total_profit || 0);
    dayMap[day].cost += Number(sale.total_revenue || 0) - Number(sale.total_profit || 0);
  }
  const trend = Object.entries(dayMap).map(([day, vals]) => ({ day, ...vals }));

  return { totalRevenue, totalProfit, totalSales, profitMargin, trend };
}
