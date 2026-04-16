"use client";

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { ArrowLeft, FileText, Package, Sparkles, HelpCircle, ReceiptText } from "lucide-react";
import Link from "next/link";
import { PrintButton } from "@/components/PrintButton";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface SaleDetailsClientProps {
  sale: any;
}

export function SaleDetailsClient({ sale }: SaleDetailsClientProps) {
  const { t, isRTL } = useLanguage();

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12" dir={isRTL ? "rtl" : "ltr"}>
      <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-6", isRTL && "sm:flex-row-reverse")}>
        <div className={cn("flex items-center gap-4 sm:gap-6", isRTL && "flex-row-reverse")}>
          <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-white hover:shadow-md transition-all h-10 w-10 shrink-0">
            <Link href="/history">
              <ArrowLeft className={cn("w-5 h-5", isRTL && "rotate-180")} />
            </Link>
          </Button>
          <div className={isRTL ? "text-right" : "text-left"}>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">{t.history.details}</h2>
            <p className="text-sm text-muted-foreground font-medium">{isRTL ? "مراجعة تفاصيل المعاملة والبنود المشتراة." : "Reviewing transaction details and items purchased."}</p>
          </div>
        </div>
        <div className={cn("flex items-center gap-3 w-full sm:w-auto", isRTL && "flex-row-reverse")}>
          <Button variant="outline" asChild className="flex-1 sm:flex-none h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest px-6 bg-white shadow-sm border-white/60">
            <a href={`/api/pdf/${sale.id}`} target="_blank">
              <FileText className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} /> {t.history.pdf}
            </a>
          </Button>
          <div className="flex-1 sm:flex-none">
            <PrintButton />
          </div>
        </div>
      </div>
Line 20 to 40.

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="overflow-hidden border-none shadow-sm bg-white/70 backdrop-blur-sm rounded-[2rem]">
            <CardHeader className={cn("bg-accent/5 border-b px-8 py-6", isRTL ? "text-right" : "text-left")}>
              <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                <ReceiptText className="w-5 h-5 text-pink-500" />
                {t.history.itemsPurchased}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className={cn("w-full text-sm", isRTL ? "text-right" : "text-left")}>
                  <thead>
                    <tr className="text-[10px] text-muted-foreground uppercase font-black tracking-widest bg-accent/20 border-b">
                      <th className="px-8 py-5">{t.products.product}</th>
                      <th className="px-8 py-5 text-center">{isRTL ? "الكمية" : "Qty"}</th>
                      <th className={cn("px-8 py-5", isRTL ? "text-left" : "text-right")}>{t.pos.sellingPrice}</th>
                      <th className={cn("px-8 py-5 text-emerald-600", isRTL ? "text-left" : "text-right")}>{isRTL ? "الربح" : "Profit"}</th>
                      <th className={cn("px-8 py-5", isRTL ? "text-left" : "text-right")}>{isRTL ? "المجموع" : "Total"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-accent/10 font-medium">
                    {sale.sale_items.map((item: any) => (
                      <tr key={item.id} className="hover:bg-accent/5 transition-colors group">
                        <td className="px-8 py-5">
                          <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                            <div className="w-12 h-12 rounded-xl bg-accent/20 overflow-hidden flex-shrink-0 border shadow-inner">
                              {item.product.image_url ? (
                                <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                              ) : (
                                <div className="flex items-center justify-center h-full opacity-20">
                                  <Package className="w-6 h-6" />
                                </div>
                              )}
                            </div>
                            <span className="font-bold text-foreground/80">{item.product.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center font-black">
                             <span className="px-3 py-1 bg-accent/30 rounded-lg text-xs">{item.quantity}</span>
                        </td>
                        <td className={cn("px-8 py-5 font-bold text-xs text-muted-foreground", isRTL ? "text-left" : "text-right")}>{formatCurrency(item.price)}</td>
                        <td className={cn("px-8 py-5 font-black text-emerald-600 text-sm", isRTL ? "text-left" : "text-right")}>
                           {formatCurrency((item.price - (item.purchase_price_snapshot || 0)) * item.quantity)}
                        </td>
                        <td className={cn("px-8 py-5 font-black text-foreground text-md", isRTL ? "text-left" : "text-right")}>{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="bg-gradient-to-br from-pink-50/50 to-violet-50/50 flex flex-col gap-4 p-8 border-t">
              <div className={cn("flex justify-between w-full text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60", isRTL && "flex-row-reverse")}>
                <span>{isRTL ? "إجمالي الإيرادات" : "Total Revenue"}</span>
                <span className="text-foreground">{formatCurrency(sale.total_revenue || sale.total)}</span>
              </div>
              <div className={cn("flex justify-between w-full text-xs font-black uppercase tracking-[0.2em] text-emerald-600/60", isRTL && "flex-row-reverse")}>
                <span>{isRTL ? "صافي الربح" : "Net Profit"}</span>
                <span className="text-emerald-600 text-sm font-black">{formatCurrency(sale.total_profit || 0)}</span>
              </div>
              <div className={cn("flex justify-between items-center w-full pt-6 border-t mt-2", isRTL && "flex-row-reverse")}>
                <span className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground">{isRTL ? "المبلغ الإجمالي" : "Total Amount"}</span>
                <span className="text-4xl font-black text-pink-500">{formatCurrency(sale.total_revenue || sale.total)}</span>
              </div>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white/70 backdrop-blur-sm">
            <CardHeader className={cn("bg-accent/5 border-b px-8 py-6", isRTL ? "text-right" : "text-left")}>
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                {t.history.transactionInfo}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className={cn("flex flex-col gap-1", isRTL && "items-end")}>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{t.history.orderId}</p>
                <p className="font-mono text-xs font-bold text-foreground/60">#{sale.id.toUpperCase()}</p>
              </div>
              <div className={cn("flex flex-col gap-1", isRTL && "items-end")}>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{isRTL ? "التاريخ" : "Date"}</p>
                <p className="font-black text-foreground italic">{formatDate(sale.created_at)}</p>
              </div>
              <div className={cn("flex flex-col gap-1", isRTL && "items-end")}>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{isRTL ? "الوقت" : "Time"}</p>
                <p className="font-black text-foreground italic">{new Date(sale.created_at).toLocaleTimeString()}</p>
              </div>
              <div className={cn("flex flex-col gap-1", isRTL && "items-end")}>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{t.history.status}</p>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest w-fit">
                  {t.history.completed}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-gradient-to-br from-violet-500 to-pink-500 text-white shadow-xl shadow-pink-500/10">
            <CardHeader className="pb-3 px-8 pt-8">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] opacity-80 flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                {t.history.helpSupport}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <p className="text-xs font-medium opacity-90 leading-relaxed">
                {isRTL ? "إذا كانت لديك أي أسئلة بخصوص هذه الفاتورة، يرجى الاتصال بالدعم الفني." : "If you have any questions regarding this invoice, please contact support."}
              </p>
              <Button variant="link" className="p-0 h-auto text-[10px] mt-4 text-white font-black uppercase tracking-widest hover:opacity-80" asChild>
                <Link href="/support">{t.history.contactSupport}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
