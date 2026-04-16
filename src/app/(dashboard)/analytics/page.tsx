"use client";

import { useState, useEffect, useCallback } from "react";
import { getDailyProfitTrend, getBestProductsProfit, getAnalyticsSummary, getFilteredAnalytics, FilteredAnalytics } from "@/services/analytics";
import { ProfitTrend, BestProduct, AnalyticsSummary } from "@/types";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, AreaChart, Area
} from "recharts";
import { formatCurrency, cn } from "@/lib/utils";
import { 
  TrendingUp, DollarSign, Percent, Package, ArrowUpRight, ArrowDownRight,
  Target, Calendar, Search, RotateCcw, ShoppingBag, Sparkles, Filter, BarChart3
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { toast } from "sonner";

type Preset = "today" | "last7" | "last30" | "last3m" | "allTime" | "custom";

function getPresetDates(preset: Preset): { start: string; end: string } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  let start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (preset === "today") {
    // already set
  } else if (preset === "last7") {
    start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else if (preset === "last30") {
    start = new Date(now);
    start.setDate(now.getDate() - 29);
    start.setHours(0, 0, 0, 0);
  } else if (preset === "last3m") {
    start = new Date(now);
    start.setMonth(now.getMonth() - 3);
    start.setHours(0, 0, 0, 0);
  } else if (preset === "allTime") {
    start = new Date("2020-01-01T00:00:00.000Z");
  }

  return { start: start.toISOString(), end: end.toISOString() };
}

export default function AnalyticsPage() {
  const { t, isRTL } = useLanguage();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [profitTrend, setProfitTrend] = useState<ProfitTrend[]>([]);
  const [productProfit, setProductProfit] = useState<BestProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [activePreset, setActivePreset] = useState<Preset>("last30");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [filtered, setFiltered] = useState<FilteredAnalytics | null>(null);
  const [filtering, setFiltering] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [sum, trend, products] = await Promise.all([
          getAnalyticsSummary(),
          getDailyProfitTrend(),
          getBestProductsProfit()
        ]);
        setSummary(sum);
        setProfitTrend(trend);
        setProductProfit(products);
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const applyFilter = useCallback(async (preset: Preset, cStart?: string, cEnd?: string) => {
    setFiltering(true);
    try {
      let start: string, end: string;
      if (preset === "custom") {
        if (!cStart || !cEnd) {
          toast.error(isRTL ? "يرجى اختيار نطاق تاريخي" : "Please select a date range");
          setFiltering(false);
          return;
        }
        start = `${cStart}T00:00:00.000Z`;
        end = `${cEnd}T23:59:59.999Z`;
      } else {
        const dates = getPresetDates(preset);
        start = dates.start;
        end = dates.end;
      }
      const result = await getFilteredAnalytics(start, end);
      setFiltered(result);
      setIsFiltered(true);
      toast.success(isRTL ? `✨ تم تطبيق الفلتر — ${result.totalSales} مبيعات` : `✨ Filter applied — ${result.totalSales} sales found`);
    } catch (err: any) {
      toast.error(t.common.error);
    } finally {
      setFiltering(false);
    }
  }, [isRTL, t.common.error]);

  const resetFilter = () => {
    setFiltered(null);
    setIsFiltered(false);
    setActivePreset("last30");
    setCustomStart("");
    setCustomEnd("");
    toast.success(isRTL ? "تم إعادة تعيين الفلتر" : "Filter reset");
  };

  const handlePreset = (preset: Preset) => {
    setActivePreset(preset);
    if (preset !== "custom") applyFilter(preset);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">{t.common.loading}</p>
    </div>
  );

  // Display data — filtered or default
  const displayTrend = isFiltered && filtered ? filtered.trend : profitTrend;

  const presets: { key: Preset; label: string }[] = [
    { key: "today", label: t.analytics.today },
    { key: "last7", label: t.analytics.last7 },
    { key: "last30", label: t.analytics.last30 },
    { key: "last3m", label: t.analytics.last3m },
    { key: "allTime", label: t.analytics.allTime },
    { key: "custom", label: t.analytics.customRange },
  ];

  const metrics = [
    {
      title: t.analytics.netProfit,
      value: isFiltered && filtered ? formatCurrency(filtered.totalProfit) : formatCurrency(summary?.netProfit || 0),
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      badge: isFiltered && filtered ? `${filtered.profitMargin.toFixed(1)}%` : "+12%",
    },
    {
      title: t.dashboard.revenue,
      value: isFiltered && filtered ? formatCurrency(filtered.totalRevenue) : formatCurrency(summary?.monthRevenue || 0),
      icon: DollarSign,
      color: "text-blue-600",
      bg: "bg-blue-50",
      badge: isFiltered && filtered ? `${filtered.totalSales} ${t.analytics.totalSales}` : "+12%",
    },
    {
      title: t.analytics.margin,
      value: isFiltered && filtered ? `${filtered.profitMargin.toFixed(1)}%` : `${summary?.profitMargin.toFixed(1)}%`,
      icon: Percent,
      color: "text-violet-600",
      bg: "bg-violet-50",
      badge: "+12%",
    },
    {
      title: isFiltered ? t.analytics.totalSales : t.dashboard.todayProfit,
      value: isFiltered && filtered ? `${filtered.totalSales}` : formatCurrency(summary?.todayProfit || 0),
      icon: isFiltered ? ShoppingBag : Target,
      color: "text-pink-600",
      bg: "bg-pink-50",
      badge: isFiltered && filtered ? `${t.analytics.filteredResults}` : "+12%",
    }
  ];

  return (
    <div className="space-y-8 pb-12" dir={isRTL ? "rtl" : "ltr"}>
      {/* Page Header */}
      <div className={cn("flex flex-col gap-1", isRTL && "text-right")}>
        <h2 className="text-2xl md:text-3xl font-black tracking-tight">{t.analytics.title}</h2>
        <p className="text-sm text-muted-foreground font-medium">{t.analytics.subtitle}</p>
      </div>

      {/* ── DATE FILTER BAR ── */}
      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className={cn("flex flex-col gap-4", isRTL && "items-end")}>
            {/* Preset shortcuts */}
            <div className={cn("flex items-center gap-2 flex-wrap", isRTL && "flex-row-reverse")}>
              <div className={cn("flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 w-full mb-1 sm:w-auto sm:mb-0", isRTL && "flex-row-reverse")}>
                <Filter className="w-3.5 h-3.5" />
                {t.analytics.dateRange}:
              </div>
              <div className={cn("flex flex-wrap gap-2", isRTL && "flex-row-reverse")}>
                {presets.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => handlePreset(p.key)}
                    className={cn(
                      "px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                      activePreset === p.key
                        ? "bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-lg shadow-pink-500/20"
                        : "bg-accent/30 text-muted-foreground hover:bg-accent/60"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom date range */}
            {activePreset === "custom" && (
              <div className={cn("flex items-center gap-3 flex-wrap", isRTL && "flex-row-reverse")}>
                <div className="relative group">
                  <Calendar className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none", isRTL ? "right-4" : "left-4")} />
                  <Input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className={cn("h-12 w-44 text-xs font-black rounded-2xl border-none shadow-inner bg-accent/10 focus:ring-2 focus:ring-pink-500/20", isRTL ? "pr-12 pl-4 text-right" : "pl-12 pr-4")}
                  />
                </div>
                <span className="text-[10px] font-black text-muted-foreground opacity-40 uppercase tracking-widest">{isRTL ? "إلى" : "to"}</span>
                <div className="relative group">
                  <Calendar className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none", isRTL ? "right-4" : "left-4")} />
                  <Input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className={cn("h-12 w-44 text-xs font-black rounded-2xl border-none shadow-inner bg-accent/10 focus:ring-2 focus:ring-pink-500/20", isRTL ? "pr-12 pl-4 text-right" : "pl-12 pr-4")}
                  />
                </div>
                <Button
                  onClick={() => applyFilter("custom", customStart, customEnd)}
                  disabled={filtering}
                  className="h-12 px-8 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-pink-500/20"
                >
                  {filtering ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t.analytics.apply}
                    </div>
                  ) : (
                    <><Search className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} /> {t.analytics.apply}</>
                  )}
                </Button>
              </div>
            )}

            {/* Active filter banner */}
            {isFiltered && (
              <div className={cn("flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-pink-500/10 to-violet-500/10 rounded-2xl border border-pink-500/10", isRTL && "flex-row-reverse")}>
                <Sparkles className="w-4 h-4 text-pink-500" />
                <span className="text-xs font-black text-pink-600 uppercase tracking-widest">
                  {t.analytics.filteredResults}: {filtered?.totalSales} {t.analytics.totalSales}
                </span>
                <button
                  onClick={resetFilter}
                  className={cn("flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors", isRTL ? "mr-auto" : "ml-auto")}
                >
                  <RotateCcw className="w-3.5 h-3.5" /> {t.analytics.reset}
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Global Metrics */}
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", isRTL && "flex-row-reverse")}>
        {metrics.map((m) => (
          <Card key={m.title} className="border-none shadow-sm overflow-hidden bg-white rounded-2xl">
            <CardContent className="p-6">
              <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                <div className={`p-2 rounded-lg ${m.bg}`}>
                  <m.icon className={`w-5 h-5 ${m.color}`} />
                </div>
                <div className="flex items-center text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">
                  <ArrowUpRight className={cn("w-3 h-3", isRTL ? "ml-0.5" : "mr-0.5")} /> {m.badge}
                </div>
              </div>
              <div className={cn("mt-4", isRTL && "text-right")}>
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{m.title}</p>
                <h3 className="text-2xl font-black tracking-tight mt-1">{m.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-7">
        {/* Profit Trend Chart */}
        <Card className="lg:col-span-4 border-none shadow-sm bg-white rounded-2xl">
          <CardHeader className={isRTL ? "text-right" : "text-left"}>
            <CardTitle className="font-black">{t.analytics.profitTrend}</CardTitle>
            <CardDescription>{isRTL ? "مقارنة يومية بين الإيرادات وصافي الأرباح." : "Daily comparison of revenue vs net profit."}</CardDescription>
          </CardHeader>
          <CardContent className="h-[380px]">
            {displayTrend.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-20">
                <TrendingUp className="w-16 h-16 mb-4" />
                <p className="font-black text-sm uppercase tracking-widest">{isRTL ? "لا توجد بيانات في هذا النطاق" : "No data for this range"}</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayTrend}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#db2777" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#db2777" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="day" 
                    tickFormatter={(val) => new Date(val).toLocaleDateString(isRTL ? 'ar-MA' : undefined, { day: 'numeric', month: 'short' })}
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                    reversed={isRTL}
                  />
                  <YAxis 
                    fontSize={11} 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(val) => `${val}`}
                    orientation={isRTL ? "right" : "left"}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px -10px rgb(0 0 0 / 0.15)' }}
                    formatter={(val: any) => [formatCurrency(Number(val))]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString(isRTL ? 'ar-MA' : undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#db2777" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2.5} name={t.dashboard.revenue} />
                  <Area type="monotone" dataKey="profit" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={2.5} name={t.analytics.netProfit} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue vs Cost */}
        <Card className="lg:col-span-3 border-none shadow-sm bg-white rounded-2xl">
          <CardHeader className={isRTL ? "text-right" : "text-left"}>
            <CardTitle className="font-black">{t.analytics.revenueVsCost}</CardTitle>
            <CardDescription>{isRTL ? "تفصيل مفصل للتكاليف العامة." : "Detailed overhead breakdown."}</CardDescription>
          </CardHeader>
          <CardContent className="h-[380px]">
            {displayTrend.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-20">
                <BarChart3 className="w-16 h-16 mb-4" />
                <p className="font-black text-sm uppercase tracking-widest">{isRTL ? "لا توجد بيانات" : "No data"}</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayTrend.slice(-7)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="day" 
                    tickFormatter={(val) => new Date(val).toLocaleDateString(isRTL ? 'ar-MA' : undefined, { weekday: 'short' })}
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                    reversed={isRTL}
                  />
                  <YAxis fontSize={11} axisLine={false} tickLine={false} hide orientation={isRTL ? "right" : "left"} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px -10px rgb(0 0 0 / 0.15)' }}
                    formatter={(val: any) => [formatCurrency(Number(val))]}
                  />
                  <Legend iconType="circle" verticalAlign="top" height={36}/>
                  <Bar dataKey="revenue" name={t.dashboard.revenue} fill="#db2777" radius={[6, 6, 0, 0]} barSize={22} />
                  <Bar dataKey="cost" name={isRTL ? "التكلفة" : "Cost"} fill="#94a3b8" radius={[6, 6, 0, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product Profitability Table */}
      <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className={isRTL ? "text-right" : "text-left"}>
          <CardTitle className="font-black">{t.analytics.profitabilityAnalysis}</CardTitle>
          <CardDescription>{isRTL ? "تحليل عميق لأداء كل صنف والهوامش." : "Deep dive into individual item performance and margins."}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className={cn("w-full text-sm", isRTL ? "text-right" : "text-left")}>
              <thead className="text-[10px] text-muted-foreground uppercase bg-accent/30 font-black tracking-widest">
                <tr>
                  <th className="px-8 py-5">{t.products.product}</th>
                  <th className="px-8 py-5 text-center">{t.analytics.unitsSold}</th>
                  <th className="px-8 py-5">{t.dashboard.revenue}</th>
                  <th className="px-8 py-5">{isRTL ? "التكلفة" : "Cost"}</th>
                  <th className="px-8 py-5">{isRTL ? "الربح" : "Profit"}</th>
                  <th className="px-8 py-5">{t.analytics.margin}</th>
                  <th className={cn("px-8 py-5", isRTL ? "text-left" : "text-right")}>{t.analytics.performance}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accent/20">
                {productProfit.map((product) => {
                  const margin = (product.total_profit / product.total_revenue) * 100;
                  return (
                    <tr key={product.id} className="hover:bg-accent/10 transition-colors group">
                      <td className="px-8 py-5">
                        <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                           <div className="w-10 h-10 rounded-xl bg-accent overflow-hidden border shadow-inner flex-shrink-0">
                              {product.image_url ? (
                                <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                              ) : (
                                <div className="flex items-center justify-center h-full opacity-20"><Package className="w-5 h-5" /></div>
                              )}
                           </div>
                           <span className="font-black text-foreground/80">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className="px-3 py-1 bg-violet-50 text-violet-600 text-[10px] font-black rounded-full">{product.total_sold}</span>
                      </td>
                      <td className="px-8 py-5 font-black text-pink-500">{formatCurrency(product.total_revenue)}</td>
                      <td className="px-8 py-5 text-muted-foreground font-medium">{formatCurrency(product.total_cost)}</td>
                      <td className="px-8 py-5 font-black text-emerald-600">{formatCurrency(product.total_profit)}</td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                          margin > 40 ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {margin.toFixed(1)}%
                        </span>
                      </td>
                      <td className={cn("px-8 py-5", isRTL ? "text-left" : "text-right")}>
                        <div className={cn("flex items-center gap-1", isRTL ? "justify-start" : "justify-end")}>
                          {margin > 30 ? <ArrowUpRight className="w-5 h-5 text-emerald-500" /> : <ArrowDownRight className="w-5 h-5 text-amber-500" />}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
