"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogIn, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const { t, isRTL } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message || (isRTL ? "بيانات الاعتماد غير صالحة" : "Invalid credentials"));
      setLoading(false);
    } else {
      toast.success(isRTL ? "مرحباً بعودتك! ✨" : "Welcome back! ✨");
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#F8FAFF]">
      {/* Animated Design Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[120px] animate-pulse" />
      
      <Card className="w-full max-w-md shadow-2xl border border-white/20 bg-white/70 backdrop-blur-xl relative z-10 transition-all hover:shadow-pink-500/10 rounded-[2rem] overflow-hidden">
        <CardHeader className="space-y-4 text-center pb-8 pt-12">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-pink-500 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
             <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-4xl font-black bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
              BeautyPOS
            </CardTitle>
            <CardDescription className="text-muted-foreground/80 font-bold uppercase tracking-widest text-[10px]">
              {t.login.subtitle}
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleLogin} dir={isRTL ? "rtl" : "ltr"}>
          <CardContent className="space-y-6 px-8">
            <div className="space-y-2">
              <label className={cn("text-[10px] font-black uppercase tracking-widest text-muted-foreground block px-1", isRTL && "text-right")}>{t.login.email}</label>
              <Input 
                type="email" 
                placeholder="admin@beauty.com" 
                className={cn("bg-white border-white/40 h-14 rounded-2xl focus:ring-pink-500/20 shadow-inner font-medium", isRTL && "text-right")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <label className={cn("text-[10px] font-black uppercase tracking-widest text-muted-foreground block px-1", isRTL && "text-right")}>{t.login.password}</label>
              <Input 
                type="password" 
                placeholder="••••••••"
                className={cn("bg-white border-white/40 h-14 rounded-2xl focus:ring-pink-500/20 shadow-inner font-medium", isRTL && "text-right")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </CardContent>
          <CardFooter className="pt-8 pb-12 px-8">
            <Button 
                className="w-full h-14 text-md font-black bg-gradient-to-r from-pink-500 to-violet-500 hover:opacity-90 shadow-xl shadow-pink-500/20 rounded-2xl group uppercase tracking-widest" 
                type="submit" 
                disabled={loading}
            >
              {loading ? (
                  <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t.login.authenticating}
                  </div>
              ) : (
                <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                    <LogIn className={cn("w-5 h-5 transition-transform", isRTL ? "group-hover:-translate-x-1 rotate-180" : "group-hover:translate-x-1")} /> 
                    {t.login.enter}
                </div>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      {/* Footer Branding */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center w-full">
         <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] opacity-40">
           BeautyPOS © 2026 | {isRTL ? "إدارة المتاجر الاحترافية" : "Professional Shop Management"}
         </p>
      </div>
    </div>
  );
}
