"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createProduct } from "@/actions/product.actions";
import { getAllCategories } from "@/services/categories";
import { Category } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Package, Sparkles } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { cn } from "@/lib/utils";

export default function NewProductPage() {
  const { t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    getAllCategories().then(setCategories);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const result = await createProduct(formData);
      if (result.success) {
        toast.success(isRTL ? "تم إنشاء المنتج بنجاح! 📦" : "Product created successfully! 📦");
        router.push("/products");
      } else {
        toast.error(result.error);
      }
    } catch (err: any) {
      toast.error(t.common.error + ": " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12" dir={isRTL ? "rtl" : "ltr"}>
      <div className={cn("flex items-center gap-6", isRTL && "flex-row-reverse")}>
        <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-white hover:shadow-md transition-all">
          <Link href="/products">
            <ArrowLeft className={cn("w-5 h-5", isRTL && "rotate-180")} />
          </Link>
        </Button>
        <div className={isRTL ? "text-right" : "text-left"}>
          <h2 className="text-3xl font-black tracking-tight">{t.products.addProduct}</h2>
          <p className="text-muted-foreground font-medium">{isRTL ? "أضف صنفاً جديداً إلى مجموعتك الفاخرة." : "Add a new item to your luxury collection."}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white/70 backdrop-blur-sm">
              <CardHeader className={cn("bg-accent/5 border-b px-8 py-6", isRTL ? "text-right" : "text-left")}>
                <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-500" />
                  {isRTL ? "المعلومات الأساسية" : "Basic Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-8">
                <div className="space-y-2">
                  <label className={cn("text-[10px] font-black uppercase tracking-widest text-muted-foreground block", isRTL && "text-right")}>{t.products.productName}</label>
                  <Input 
                    name="name" 
                    placeholder={isRTL ? "مثال: أحمر شفاه مخملي - ياقوتي" : "e.g. Matte Lipstick - Ruby Red"} 
                    className={cn("h-14 rounded-2xl bg-white border-white/40 shadow-inner font-medium", isRTL && "text-right")}
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className={cn("text-[10px] font-black uppercase tracking-widest text-pink-600 block", isRTL && "text-right")}>{t.products.sellingPrice} {isRTL ? "(درهم)" : "(Dh)"}</label>
                    <Input 
                      name="price" 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      className={cn("h-14 rounded-2xl bg-white border-pink-100 shadow-inner font-black text-lg", isRTL && "text-right")}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={cn("text-[10px] font-black uppercase tracking-widest text-blue-600 block", isRTL && "text-right")}>{t.products.purchasePrice} {isRTL ? "(درهم)" : "(Dh)"}</label>
                    <Input 
                      name="purchase_price" 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      className={cn("h-14 rounded-2xl bg-white border-blue-100 shadow-inner font-black text-lg", isRTL && "text-right")}
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className={cn("text-[10px] font-black uppercase tracking-widest text-muted-foreground block", isRTL && "text-right")}>{t.products.stock}</label>
                    <Input 
                      name="stock_quantity" 
                      type="number" 
                      placeholder="0" 
                      className={cn("h-14 rounded-2xl bg-white border-white/40 shadow-inner font-bold", isRTL && "text-right")}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={cn("text-[10px] font-black uppercase tracking-widest text-muted-foreground block", isRTL && "text-right")}>{t.products.category}</label>
                    <select 
                      name="category_id" 
                      className={cn("flex h-14 w-full rounded-2xl border border-white/40 bg-white px-4 py-2 text-sm shadow-inner transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500/20 font-bold", isRTL && "text-right")}
                      required
                    >
                      <option value="">{isRTL ? "اختر فئة" : "Select a category"}</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white/70 backdrop-blur-sm">
              <CardHeader className={cn("bg-accent/5 border-b px-8 py-6", isRTL ? "text-right" : "text-left")}>
                <CardTitle className="text-lg font-black uppercase tracking-widest">{t.products.image}</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="flex flex-col items-center gap-6">
                  <div className="w-full aspect-square rounded-[2rem] border-2 border-dashed border-accent/40 flex flex-col items-center justify-center relative overflow-hidden bg-accent/5 hover:bg-accent/10 transition-colors group">
                    {imagePreview ? (
                      <img src={imagePreview} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                          <Package className="w-8 h-8 text-pink-500 opacity-40" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center px-4">
                          {isRTL ? "اضغط لرفع صورة المنتج" : "Click to upload product photo"}
                        </p>
                      </>
                    )}
                    <input 
                      type="file" 
                      name="image" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </div>
                  {imagePreview && (
                    <Button type="button" variant="ghost" size="sm" className="rounded-xl font-bold uppercase text-[10px] tracking-widest text-destructive" onClick={() => setImagePreview(null)}>
                      {isRTL ? "حذف الصورة" : "Remove Image"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              <Button type="submit" className="w-full h-14 bg-gradient-to-r from-pink-500 to-violet-500 hover:opacity-90 shadow-xl shadow-pink-500/20 rounded-2xl font-black uppercase tracking-widest" disabled={loading}>
                {loading ? (isRTL ? "جاري الحفظ..." : "Saving...") : <><Save className={cn("w-5 h-5", isRTL ? "ml-2" : "mr-2")} /> {t.products.addProduct}</>}
              </Button>
              <Button variant="outline" type="button" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] border-white/60 bg-white/40" asChild>
                <Link href="/products">{t.common.cancel}</Link>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
