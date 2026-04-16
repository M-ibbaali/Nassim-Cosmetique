"use client";

import { MobileNav } from "./MobileNav";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { cn } from "@/lib/utils";

export function MobileHeader() {
  const { isRTL } = useLanguage();

  return (
    <header className={cn(
      "lg:hidden sticky top-0 z-40 w-full h-16 bg-white/80 backdrop-blur-md border-b px-4 flex items-center justify-between",
      isRTL && "flex-row-reverse"
    )}>
      <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
        <MobileNav />
        <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
          BeautyPOS
        </h1>
      </div>
      
      {/* Space for user avatar or language switcher if needed on mobile header */}
      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-[10px] font-black text-primary">
        BP
      </div>
    </header>
  );
}
