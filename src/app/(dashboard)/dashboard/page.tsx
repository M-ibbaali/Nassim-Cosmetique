"use client";

import { useState, useEffect } from "react";
import { getAnalyticsSummary, getDailyProfitTrend, getBestProductsProfit } from "@/services/analytics";
import { getLowStockProducts } from "@/services/products";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, cn } from "@/lib/utils";
import { 
  ShoppingBag, 
  Search,
  Plus,
  Bell,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { AnalyticsSummary, ProfitTrend, BestProduct, Product } from "@/types";
import { ProductImage } from "@/components/ui/ProductImage";
import Link from "next/link";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DashboardPage() {
  const { t, locale, setLocale, isRTL } = useLanguage();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [dailyData, setDailyData] = useState<ProfitTrend[]>([]);
  const [bestProducts, setBestProducts] = useState<BestProduct[]>([]);
  const [userName, setUserName] = useState<string>("User");
  const [greeting, setGreeting] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [sum, daily, best] = await Promise.all([
          getAnalyticsSummary(),
          getDailyProfitTrend(),
          getBestProductsProfit(),
        ]);
        setSummary(sum);
        setDailyData(daily.reverse());
        setBestProducts(best);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      }
    }

    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name.split(' ')[0]);
      } else if (user?.email) {
        setUserName(user.email.split('@')[0]);
      }

      const hour = new Date().getHours();
      let key = "greeting";
      if (hour >= 12 && hour < 18) key = "afternoon";
      else if (hour >= 18) key = "evening";
      
      setGreeting((t.dashboard as any)[key].replace("{name}", ""));
    }

    Promise.all([loadDashboardData(), loadUser()]).finally(() => {
      setLoading(false);
    });
  }, [locale, t]);

  if (loading) return <div className="flex items-center justify-center h-screen text-muted-foreground animate-pulse font-black tracking-widest uppercase text-xs">{t.common.loading}</div>;

  const currentLang = locale === 'en' ? '🇺🇸 EN' : locale === 'fr' ? '🇫🇷 FR' : '🇲🇦 AR';

  return (
    <div className="space-y-6 pb-12 bg-[#F8FAFF] min-h-screen" dir={isRTL ? "rtl" : "ltr"}>
      {/* Top Header */}
      <div className={cn("flex flex-col lg:flex-row lg:items-center justify-between gap-6", isRTL && "lg:flex-row-reverse")}>
        <div className={isRTL ? "text-right" : "text-left"}>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[#111827]">{greeting} {userName}</h2>
          <p className="text-sm text-[#6B7280] font-medium">{t.dashboard.monitoring}</p>
        </div>
        <div className={cn("flex flex-wrap items-center gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
          <div className="flex-1 md:flex-none">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2 px-4 py-2 bg-white border rounded-full shadow-sm cursor-pointer hover:bg-accent transition-all">
                  <span className="text-xs font-black uppercase tracking-tighter">{currentLang}</span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? "start" : "end"} className="rounded-2xl border-none shadow-2xl p-2 bg-white/80 backdrop-blur-md">
                <DropdownMenuItem onClick={() => setLocale('en')} className="rounded-xl font-bold text-xs uppercase cursor-pointer py-3 hover:bg-primary hover:text-white transition-colors">🇺🇸 English</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocale('fr')} className="rounded-xl font-bold text-xs uppercase cursor-pointer py-3 hover:bg-primary hover:text-white transition-colors">🇫🇷 Français</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocale('ar')} className="rounded-xl font-bold text-xs uppercase cursor-pointer py-3 hover:bg-primary hover:text-white transition-colors">🇲🇦 العربية</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="relative flex-1 md:w-64">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
            <input 
              className={cn(
                "bg-white border rounded-full py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all w-full shadow-sm font-medium",
                isRTL ? "pr-9 pl-4" : "pl-9 pr-4"
              )}
              placeholder={t.dashboard.searchPlaceholder}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/notifications">
              <Button variant="outline" size="icon" className="rounded-full shadow-sm bg-white relative hover:bg-accent transition-all active:scale-95">
                <Bell className="w-4 h-4" />
                {summary && summary.lowStockCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                    {summary.lowStockCount}
                  </span>
                )}
              </Button>
            </Link>
            <Button className="rounded-full bg-primary hover:opacity-90 shadow-lg px-4 md:px-6 font-bold" asChild>
              <Link href="/sales">
                 <Plus className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} /> 
                 <span className="hidden xs:inline">{t.sidebar.pos}</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title={t.dashboard.totalRevenue} 
          value={formatCurrency(summary?.monthRevenue || 0)} 
          percentage={68} 
          color="bg-primary"
        />
        <StatCard 
          title={t.dashboard.totalProfit} 
          value={formatCurrency(summary?.netProfit || 0)} 
          percentage={45} 
          color="bg-[#10B981]" 
        />
        <StatCard 
          title={t.dashboard.todayProfit} 
          value={formatCurrency(summary?.todayProfit || 0)} 
          percentage={85} 
          color="bg-violet-500" 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-none bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between bg-accent/10 border-b">
            <CardTitle className="text-md font-black uppercase tracking-tight">Revenue Overview</CardTitle>
            <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest bg-white shadow-sm border">This Month</Button>
          </CardHeader>
          <CardContent className="h-[300px] pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  fontSize={10} 
                  tickFormatter={(val) => new Date(val).getDate().toString()}
                />
                <YAxis axisLine={false} tickLine={false} fontSize={10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(val: any) => [formatCurrency(val), 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none bg-white overflow-hidden">
          <CardHeader className="bg-accent/10 border-b">
            <CardTitle className="text-md font-black uppercase tracking-tight">Recent Sales</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData.slice(-7)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" hide />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products Gallery Style */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-black uppercase tracking-tight">Hottest Items</h3>
          <Button variant="ghost" size="sm" asChild className="text-[10px] font-black uppercase tracking-widest">
            <Link href="/products">View All <ChevronRight className="w-3 h-3 ml-1" /></Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {bestProducts.slice(0, 4).map((p) => (
            <Card key={p.id} className="border-none shadow-sm group hover:shadow-md transition-all rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-4 flex flex-col items-center">
                <div className="w-full aspect-square mb-4">
                   <ProductImage src={p.image_url} alt={p.name} />
                </div>
                <h4 className="font-bold text-sm text-center text-foreground line-clamp-1">{p.name}</h4>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">{p.total_sold} Sold</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom Insights */}
      <div className="w-full">
        <Card className="shadow-sm border-none bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between bg-accent/10 border-b p-6">
            <CardTitle className="text-md font-black uppercase tracking-tight">Top Performance Products</CardTitle>
            <Button size="sm" variant="outline" asChild className="text-[10px] font-black uppercase tracking-widest rounded-full bg-white shadow-sm">
                <Link href="/analytics">Detailed Analytics</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {bestProducts.slice(0, 4).map(p => (
                <div key={p.id} className="flex items-center gap-6 group cursor-default border-b border-accent/20 pb-4 last:border-0 last:pb-0">
                    <div className="w-20 h-20 flex-shrink-0">
                    <ProductImage src={p.image_url} alt={p.name} />
                    </div>
                    <div className="flex-1 text-left">
                    <h5 className="font-black text-lg line-clamp-1 group-hover:text-primary transition-colors">{p.name}</h5>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">Total Revenue : {formatCurrency(p.total_revenue)}</p>
                    <div className="mt-2 w-full h-1 bg-accent/30 rounded-full overflow-hidden">
                       <div className="h-full bg-primary" style={{ width: '70%' }} />
                    </div>
                    </div>
                    <div className="text-right ml-4">
                    <p className="text-xl font-black text-violet-600">{p.total_sold}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black opacity-60">Sold</p>
                    </div>
                </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, percentage, color }: any) {
  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-all group bg-white overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-[#F3F4F6] rounded-2xl group-hover:scale-110 transition-transform">
             <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-inner">
               <ShoppingBag className="w-5 h-5 text-primary" />
             </div>
          </div>
          <div className="text-right">
             <h3 className="text-2xl font-black text-[#111827]">{value}</h3>
             <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{title}</p>
          </div>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full ${color} transition-all duration-1000 ease-out`} 
            style={{ width: `${percentage}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressCircle({ value, label, subLabel, color }: any) {
  return (
    <div className="text-center group">
      <div className="relative w-20 h-20 mx-auto mb-3">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="40" cy="40" r="36" stroke="#f1f5f9" strokeWidth="8" fill="none" />
          <circle 
            cx="40" cy="40" r="36" stroke={color} strokeWidth="8" fill="none" strokeDasharray={`${2 * Math.PI * 36}`} 
            style={{ strokeDashoffset: (2 * Math.PI * 36) * (1 - value/100) }}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-black">{value}%</span>
      </div>
      <p className="text-sm font-black text-[#111827]">{subLabel}</p>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{label}</p>
    </div>
  );
}
