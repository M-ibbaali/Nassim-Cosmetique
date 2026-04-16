"use client";

import { useState, useEffect } from "react";
import { getAllSales } from "@/services/sales";
import { Card } from "@/components/ui/card";
import { SalesTable } from "@/components/history/SalesTable";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { cn } from "@/lib/utils";

export default function HistoryPage() {
  const { t, isRTL } = useLanguage();
  const [sales, setSales] = useState<any[]>([]);

  useEffect(() => {
    getAllSales().then(setSales);
  }, []);

  return (
    <div className="space-y-8 pb-12" dir={isRTL ? "rtl" : "ltr"}>
      <div className={cn("flex flex-col gap-1", isRTL ? "text-right" : "text-left")}>
        <h2 className="text-3xl font-black tracking-tight">{t.sidebar.history}</h2>
        <p className="text-muted-foreground font-medium opacity-70">
          {isRTL ? "راجع ودقق في المعاملات السابقة لإمبراطورية الجمال الخاصة بك." : "Review and audit your beauty empire's past transactions."}
        </p>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white/70 backdrop-blur-sm rounded-[2rem]">
        <SalesTable initialSales={sales} />
      </Card>
    </div>
  );
}
