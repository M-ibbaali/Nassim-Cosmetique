"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCategory } from "@/actions/category.actions";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Sparkles } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function NewCategoryPage() {
  const { t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await createCategory(formData);
      toast.success(isRTL ? "تم إنشاء الفئة بنجاح! 📂" : "Category created successfully! 📂");
      router.push("/categories");
    } catch (err: any) {
      toast.error(err.message || t.common.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12" dir={isRTL ? "rtl" : "ltr"}>
      <div className={cn("flex items-center gap-6", isRTL && "flex-row-reverse")}>
        <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-white hover:shadow-md transition-all">
          <Link href="/categories">
            <ArrowLeft className={cn("w-5 h-5", isRTL && "rotate-180")} />
          </Link>
        </Button>
        <div className={isRTL ? "text-right" : "text-left"}>
          <h2 className="text-3xl font-black tracking-tight">{t.categories.addCategory}</h2>
          <p className="text-muted-foreground font-medium">{isRTL ? "حدد تصنيفاً جديداً لتنظيم منتجاتك." : "Define a new classification to organize your products."}</p>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white/70 backdrop-blur-sm">
        <form onSubmit={handleSubmit}>
          <CardHeader className={cn("bg-accent/5 border-b px-8 py-6", isRTL ? "text-right" : "text-left")}>
            <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-500" />
              {isRTL ? "تفاصيل الفئة" : "Category Details"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            <div className="space-y-2">
              <label className={cn("text-[10px] font-black uppercase tracking-widest text-muted-foreground block px-1", isRTL && "text-right")}>{isRTL ? "اسم الفئة" : "Category Name"}</label>
              <Input 
                name="name" 
                placeholder={isRTL ? "مثال: أحمر الشفاه، العناية بالبشرة" : "e.g. Lipsticks, Skincare"} 
                className={cn("h-14 rounded-2xl bg-white border-white/40 shadow-inner font-bold text-lg", isRTL && "text-right")}
                required 
              />
            </div>
            <div className="space-y-2">
              <label className={cn("text-[10px] font-black uppercase tracking-widest text-muted-foreground block px-1", isRTL && "text-right")}>{isRTL ? "الوصف" : "Description"}</label>
              <textarea 
                name="description" 
                className={cn("flex min-h-[140px] w-full rounded-2xl border border-white/40 bg-white px-4 py-3 text-sm shadow-inner placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/20 font-medium", isRTL && "text-right")}
                placeholder={isRTL ? "وصف قصير للفئة..." : "Brief description of the category..."}
              />
            </div>
          </CardContent>
          <CardFooter className={cn("flex gap-4 p-8 border-t bg-accent/5", isRTL ? "flex-row-reverse" : "flex-row")}>
            <Button variant="outline" type="button" className="h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest px-8 bg-white/50" asChild>
              <Link href="/categories">{t.common.cancel}</Link>
            </Button>
            <Button type="submit" disabled={loading} className="h-12 bg-gradient-to-r from-violet-500 to-pink-500 shadow-xl shadow-violet-500/20 rounded-xl font-black uppercase tracking-widest px-8">
              {loading ? (isRTL ? "جاري الحفظ..." : "Saving...") : <><Save className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} /> {isRTL ? "حفظ الفئة" : "Save Category"}</>}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
