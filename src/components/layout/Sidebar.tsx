"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Tags, 
  ShoppingCart, 
  History, 
  BarChart3, 
  Settings,
  LogOut,
  Bell
} from "lucide-react";
import { getLowStockCount } from "@/services/products";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { t, isRTL } = useLanguage();
  const [mounted, setMounted] = (require("react") as typeof import("react")).useState(false);
  const [lowStockCount, setLowStockCount] = (require("react") as typeof import("react")).useState(0);

  const navigation = [
    { name: t.sidebar.dashboard, href: '/dashboard', icon: LayoutDashboard },
    { name: t.sidebar.pos, href: '/sales', icon: ShoppingCart },
    { name: t.sidebar.products, href: '/products', icon: ShoppingBag },
    { name: t.sidebar.categories, href: '/categories', icon: Tags },
    { name: t.sidebar.history, href: '/history', icon: History },
    { name: t.sidebar.analytics, href: '/analytics', icon: BarChart3 },
  ];

  (require("react") as typeof import("react")).useEffect(() => {
    setMounted(true);
    getLowStockCount().then(setLowStockCount);
    const interval = setInterval(() => {
        getLowStockCount().then(setLowStockCount);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [pathname]);

  if (!mounted) {
    return (
      <div className={cn(
        "flex flex-col w-64 h-screen sticky top-0 bg-card",
        isRTL ? "border-l" : "border-r",
        className
      )}>
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
            BeautyPOS
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col w-64 h-full bg-card transition-all duration-300",
      isRTL ? "border-l" : "border-r",
      className
    )}>
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
          BeautyPOS
        </h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}

        <Link
          href="/notifications"
          className={cn(
            "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            pathname === "/notifications"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4" />
            {t.sidebar.notifications}
          </div>
          {lowStockCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
              {lowStockCount}
            </span>
          )}
        </Link>
      </nav>

      <div className="p-4 border-t space-y-1">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            pathname === "/settings"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Settings className="w-4 h-4" />
          {t.sidebar.settings}
        </Link>
        <button className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
          <LogOut className="w-4 h-4" />
          {t.sidebar.signOut}
        </button>
      </div>
    </div>
  );
}
