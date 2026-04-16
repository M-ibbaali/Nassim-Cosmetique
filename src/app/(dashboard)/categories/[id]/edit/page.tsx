"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { updateCategory } from "@/actions/category.actions";
import { getCategoryById } from "@/services/categories";
import { Category } from "@/types";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Sparkles, FolderEdit } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function EditCategoryPage() {
  const { t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [category, setCategory] = useState<Category | null>(null);
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getCategoryById(categoryId);
        setCategory(data);
      } catch (err) {
        toast.error(isRTL ? "فشل تحميل بيانات الفئة" : "Failed to load category data");
      } finally {
        setFetching(false);
      }
    }
    loadData();
  }, [categoryId, isRTL]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const result = await updateCategory(categoryId, formData);
      if (result.success) {
        toast.success(isRTL ? "تم تحديث الفئة بنجاح! ✨" : "Category updated successfully! ✨");
        router.push("/categories");
      } else {
        toast.error(result.error);
      }
    } catch (err: any) {
      toast.error(t.common.error + ": " + err.message);
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">
          {isRTL ? "جاري تحميل تفاصيل الفئة..." : "Loading category details..."}
        </p>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="text-center py-24 bg-white rounded-3xl shadow-sm">
        <FolderEdit className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
        <h3 className="text-xl font-black">{isRTL ? "الفئة غير موجودة" : "Category not found."}</h3>
        <Link href="/categories" className="text-violet-500 font-bold hover:underline mt-4 inline-block">
          {isRTL ? "العودة للقائمة" : "Back to list"}
        </Link>
      </div>
    );
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
          <h2 className="text-3xl font-black tracking-tight">{isRTL ? "تعديل الفئة" : "Edit Category"}</h2>
          <p className="text-muted-foreground font-medium">{isRTL ? "تحديث تفاصيل تصنيف منتجاتك." : "Update details for your product classification."}</p>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white/70 backdrop-blur-sm">
        <form onSubmit={handleSubmit}>
          <CardHeader className={cn("bg-accent/5 border-b px-8 py-6", isRTL ? "text-right" : "text-left")}>
            <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-500" />
              {isRTL ? "معلومات الفئة" : "Category Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            <div className="space-y-2">
              <label className={cn("text-[10px] font-black uppercase tracking-widest text-muted-foreground block px-1", isRTL && "text-right")}>{isRTL ? "اسم الفئة" : "Category Name"}</label>
              <Input 
                name="name" 
                defaultValue={category.name} 
                placeholder={isRTL ? "اسم الفئة" : "Category Name"} 
                className={cn("h-14 rounded-2xl bg-white border-white/40 shadow-inner font-bold text-lg", isRTL && "text-right")}
                required 
              />
            </div>
            <div className="space-y-2">
              <label className={cn("text-[10px] font-black uppercase tracking-widest text-muted-foreground block px-1", isRTL && "text-right")}>{isRTL ? "الوصف" : "Description"}</label>
              <textarea 
                name="description" 
                defaultValue={category.description || ""}
                className={cn("flex min-h-[140px] w-full rounded-2xl border border-white/40 bg-white px-4 py-3 text-sm shadow-inner placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/20 font-medium", isRTL && "text-right")}
                placeholder={isRTL ? "وصف الفئة..." : "Brief description of the category..."}
              />
            </div>
          </CardContent>
          <CardFooter className={cn("flex gap-4 p-8 border-t bg-accent/5", isRTL ? "flex-row-reverse" : "flex-row")}>
            <Button variant="outline" type="button" className="h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest px-8 bg-white/50" asChild>
              <Link href="/categories">{t.common.cancel}</Link>
            </Button>
            <Button type="submit" disabled={loading} className="h-12 bg-gradient-to-r from-violet-500 to-pink-500 shadow-xl shadow-violet-500/20 rounded-xl font-black uppercase tracking-widest px-8">
              {loading ? (isRTL ? "جاري التحديث..." : "Updating...") : <><Save className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} /> {isRTL ? "حفظ التغييرات" : "Save Changes"}</>}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
