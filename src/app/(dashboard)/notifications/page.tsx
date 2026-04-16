"use client";

import { useState, useEffect } from "react";
import { getLowStockProducts } from "@/services/products";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  ArrowRight, 
  ShieldAlert,
  CheckCircle2,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, cn } from "@/lib/utils";
import { ProductImage } from "@/components/ui/ProductImage";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Product } from "@/types";

export default function NotificationsPage() {
  const { t, isRTL } = useLanguage();
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getLowStockProducts(100); // Get more for the alerts page
        setLowStockProducts(data);
      } catch (err) {
        console.error("Failed to load alerts", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="p-8 text-center animate-pulse">{t.common.loading}</div>;

  const outOfStock = lowStockProducts.filter(p => (p.stock_quantity || 0) === 0);
  const criticalStock = lowStockProducts.filter(p => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) <= 2);

  return (
    <div className="space-y-8 pb-12" dir={isRTL ? "rtl" : "ltr"}>
      <div className={cn("flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4", isRTL && "sm:flex-row-reverse")}>
        <div className={isRTL ? "text-right" : "text-left"}>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">{t.notifications.title}</h2>
          <p className="text-sm text-muted-foreground font-medium">{t.notifications.subtitle}</p>
        </div>
      </div>

      <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6", isRTL && "flex-row-reverse")}>
        <Card className="bg-red-500/5 border-red-500/10 shadow-none rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
              <div className={isRTL ? "text-right" : "text-left"}>
                <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-1">{t.notifications.outOfStock}</p>
                <h3 className="text-3xl font-black text-red-700">{outOfStock.length}</h3>
              </div>
              <ShieldAlert className="w-10 h-10 text-red-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-amber-500/5 border-amber-500/10 shadow-none rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
              <div className={isRTL ? "text-right" : "text-left"}>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">{t.notifications.criticalLevel}</p>
                <h3 className="text-3xl font-black text-amber-700">{criticalStock.length}</h3>
              </div>
              <AlertTriangle className="w-10 h-10 text-amber-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-500/5 border-emerald-500/10 shadow-none rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
              <div className={isRTL ? "text-right" : "text-left"}>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">{t.notifications.monitored}</p>
                <h3 className="text-3xl font-black text-emerald-700">{lowStockProducts.length}</h3>
              </div>
              <TrendingUp className="w-10 h-10 text-emerald-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {lowStockProducts.length === 0 ? (
        <Card className="border-dashed border-2 bg-transparent py-24 rounded-3xl">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-8 shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-black">{t.notifications.healthy}</h3>
            <p className="max-w-[340px] text-muted-foreground mt-2 font-medium">
              {t.notifications.healthySub}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm border-none bg-white rounded-3xl overflow-hidden">
          <CardHeader className={cn("bg-accent/10 border-b px-8 py-6", isRTL ? "text-right" : "text-left")}>
            <CardTitle className="text-lg font-black uppercase tracking-tight">{isRTL ? "تنبيهات المخزون الحرجة" : "Critical Inventory Alerts"}</CardTitle>
            <CardDescription className="font-medium">{isRTL ? "الأصناف التالية تتطلب اهتماماً فورياً بإعادة التزويد." : "The following items require immediate restocking attention."}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-accent/30">
              {lowStockProducts.map((product) => (
                <div key={product.id} className={cn("p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between hover:bg-accent/10 transition-colors group gap-6", isRTL && "md:flex-row-reverse")}>
                  <div className={cn("flex items-center gap-4 md:gap-6", isRTL && "flex-row-reverse")}>
                    <div className="w-14 h-14 md:w-16 md:h-16 flex-shrink-0">
                      <ProductImage src={product.image_url} alt={product.name} />
                    </div>
                    <div className={isRTL ? "text-right" : "text-left"}>
                      <h4 className="font-black text-foreground truncate max-w-[200px] sm:max-w-[240px] group-hover:text-primary transition-colors text-base md:text-lg">{product.name}</h4>
                      <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest opacity-60">
                        {product.category?.name || (isRTL ? "بدون فئة" : "No Category")}
                      </p>
                    </div>
                  </div>

                  <div className={cn("flex flex-wrap items-center gap-4 sm:gap-12", isRTL && "flex-row-reverse")}>
                    <div className="text-center sm:text-left min-w-[80px]">
                       <p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase mb-1 tracking-widest">{isRTL ? "المخزون" : "Stock"}</p>
                       <span className={`text-lg md:text-xl font-black px-3 py-1 rounded-xl ${
                         product.stock_quantity === 0 ? 'bg-red-100 text-red-600' : 
                         product.stock_quantity <= 2 ? 'bg-amber-100 text-amber-600' : 
                         'bg-blue-100 text-blue-600'
                       }`}>
                         {product.stock_quantity}
                       </span>
                    </div>

                    <div className={cn("text-right hidden sm:block", isRTL && "text-left")}>
                        <p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase mb-1 tracking-widest">{isRTL ? "الإيرادات" : "Revenue"}</p>
                        <p className="text-sm md:text-md font-black text-foreground whitespace-nowrap">
                            {formatCurrency(product.selling_price * 10)}
                        </p>
                    </div>

                    <div className="flex-1 sm:flex-none flex justify-end">
                      <Button variant="outline" size="sm" asChild className="w-full sm:w-auto rounded-xl font-black bg-white text-[10px] uppercase shadow-sm h-10 px-6 border hover:bg-primary hover:text-white hover:border-primary transition-all">
                        <Link href={`/products/${product.id}/edit`}>
                          {t.notifications.restockNow} <ArrowRight className={cn("w-3.5 h-3.5", isRTL ? "mr-2 rotate-180" : "ml-2")} />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
