"use client";

import { useState } from "react";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { 
  FileText, 
  ChevronRight, 
  Trash2, 
  Search, 
  RotateCcw,
  Calendar,
  Sparkles
} from "lucide-react";
import { useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { deleteSale, filterSales } from "@/actions/sale.actions";

interface SalesTableProps {
  initialSales: any[];
}

export function SalesTable({ initialSales }: SalesTableProps) {
  const { t, isRTL } = useLanguage();
  const [sales, setSales] = useState(initialSales);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);

  useEffect(() => {
    setSales(initialSales);
  }, [initialSales]);
  
  // Filter state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const openDeleteConfirm = (id: string) => {
    setSaleToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleFilter = async () => {
    if (!startDate || !endDate) {
      toast.error(isRTL ? "يرجى اختيار نطاق تاريخي" : "Please select a date range");
      return;
    }
    
    setIsLoading(true);
    try {
      const start = `${startDate}T00:00:00`;
      const end = `${endDate}T23:59:59`;
      
      const result = await filterSales(start, end);
      if (result.success) {
        setSales(result.data || []);
        toast.success(t.common.success);
      } else {
        toast.error(result.error);
      }
    } catch (err: any) {
      toast.error(t.common.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setSales(initialSales);
    toast.success(t.common.success);
  };

  const handleConfirmDelete = async () => {
    if (!saleToDelete) return;

    setIsDeleting(true);
    const toastId = toast.loading(t.pos.processing);

    try {
      const result = await deleteSale(saleToDelete);
      if (result.success) {
        setSales(prev => prev.filter(s => s.id !== saleToDelete));
        toast.success(t.common.success, { id: toastId });
      } else {
        toast.error(result.error || t.common.error, { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || t.common.error, { id: toastId });
    } finally {
      setIsDeleting(false);
      setIsConfirmOpen(false);
      setSaleToDelete(null);
    }
  };

  return (
    <>
      <div className={cn("p-4 md:p-6 border-b bg-accent/5 flex flex-col lg:flex-row lg:items-center justify-between gap-6", isRTL && "lg:flex-row-reverse")}>
        <div className={cn("flex flex-col sm:flex-row items-start sm:items-center gap-3 lg:gap-4 w-full lg:w-auto", isRTL && "sm:flex-row-reverse items-end")}>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative group flex-1 sm:flex-none">
                    <Calendar className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none group-focus-within:text-pink-500 transition-colors", isRTL ? "right-4" : "left-4")} />
                    <Input 
                        type="date" 
                        className={cn(
                            "h-12 w-full sm:w-44 text-xs font-black uppercase rounded-2xl border-none shadow-inner bg-white focus:ring-2 focus:ring-pink-500/20 transition-all",
                            isRTL ? "pr-12 pl-4 text-right" : "pl-12 pr-4 text-left"
                        )}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-30 px-1">{isRTL ? "إلى" : "to"}</span>
                <div className="relative group flex-1 sm:flex-none">
                    <Calendar className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none group-focus-within:text-pink-500 transition-colors", isRTL ? "right-4" : "left-4")} />
                    <Input 
                        type="date" 
                        className={cn(
                            "h-12 w-full sm:w-44 text-xs font-black uppercase rounded-2xl border-none shadow-inner bg-white focus:ring-2 focus:ring-pink-500/20 transition-all",
                            isRTL ? "pr-12 pl-4 text-right" : "pl-12 pr-4 text-left"
                        )}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <Button 
                    onClick={handleFilter} 
                    disabled={isLoading}
                    className="flex-1 sm:flex-none h-12 px-6 sm:px-8 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 hover:opacity-90 font-black text-xs uppercase tracking-widest shadow-xl shadow-pink-500/20 transition-all active:scale-95"
                >
                    {isLoading ? t.pos.processing : <><Search className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} /> {t.history.filter}</>}
                </Button>
                <Button 
                    variant="ghost" 
                    onClick={handleReset}
                    className="sm:flex-none h-12 px-4 sm:px-6 rounded-2xl font-black text-xs uppercase tracking-widest text-muted-foreground hover:bg-white transition-all"
                >
                    <RotateCcw className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} /> {t.history.reset}
                </Button>
            </div>
        </div>
        
        <div className="flex items-center justify-end w-full lg:w-auto">
            <span className="text-[10px] font-black uppercase text-pink-500 bg-pink-50 px-4 py-2 rounded-full border border-pink-100 shadow-sm flex items-center gap-2">
                <Sparkles className="w-3 h-3" />
                {sales.length} {t.history.transactions}
            </span>
        </div>
      </div>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className={cn("w-full border-collapse text-sm", isRTL ? "text-right" : "text-left")}>
            <thead>
              <tr className="border-b bg-accent/10 font-black text-muted-foreground uppercase tracking-[0.2em] text-[10px]">
                <th className="px-8 py-6">{t.history.reference}</th>
                <th className="px-8 py-6">{t.history.timestamp}</th>
                <th className="px-8 py-6 text-center">{t.history.volume}</th>
                <th className="px-8 py-6">{t.dashboard.revenue}</th>
                <th className="px-8 py-6">{t.dashboard.totalProfit}</th>
                <th className={cn("px-8 py-6", isRTL ? "text-left" : "text-right")}>{t.products.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-accent/30 font-medium">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center justify-center opacity-20">
                        <Search className="w-16 h-16 mb-6" />
                        <p className="font-black text-xl uppercase tracking-[0.3em]">{t.common.error}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-accent/5 transition-colors group">
                    <td className="px-8 py-5 font-mono text-[10px] text-muted-foreground/60">
                      #{sale.id.slice(0, 8)}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground/80">{formatDate(sale.created_at)}</span>
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
                          {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="px-4 py-1.5 rounded-full bg-violet-50 text-violet-600 text-[10px] font-black uppercase tracking-widest">
                        {sale.sale_items?.length || 0} {t.pos.units}
                      </span>
                    </td>
                    <td className="px-8 py-5 font-black text-pink-500 text-lg">
                      {formatCurrency(sale.total_revenue || sale.total)}
                    </td>
                    <td className="px-8 py-5">
                      <span className="font-black text-emerald-600 tracking-tight text-lg">
                        {formatCurrency(sale.total_profit || 0)}
                      </span>
                    </td>
                    <td className={cn("px-8 py-5", isRTL ? "text-left" : "text-right")}>
                      <div className={cn("flex gap-2 items-center", isRTL ? "justify-start" : "justify-end")}>
                        <Button variant="outline" size="sm" asChild className="h-10 text-[10px] font-black px-5 bg-white shadow-sm border rounded-2xl hover:bg-primary hover:text-white transition-all uppercase tracking-widest">
                          <a href={`/api/pdf/${sale.id}`} target="_blank">
                            <FileText className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} /> {t.history.pdf}
                          </a>
                        </Button>
                        <Button variant="ghost" size="sm" asChild className="h-10 text-[10px] font-black px-5 rounded-2xl hover:bg-white hover:shadow-md transition-all uppercase tracking-widest">
                          <Link href={`/history/${sale.id}`}>
                            {t.history.details} <ChevronRight className={cn("w-4 h-4 transition-transform group-hover:translate-x-1", isRTL ? "mr-2 rotate-180" : "ml-2")} />
                          </Link>
                        </Button>
                        <div className="w-px h-6 bg-accent/30 mx-2" />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10 text-destructive rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all"
                          onClick={() => openDeleteConfirm(sale.id)}
                          title={t.common.delete}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title={t.common.delete}
        description={t.common.confirm}
        confirmText={t.common.confirm}
        isLoading={isDeleting}
        variant="danger"
      />
    </>
  );
}
