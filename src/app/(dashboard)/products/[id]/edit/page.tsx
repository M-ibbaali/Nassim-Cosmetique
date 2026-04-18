"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { updateProduct } from "@/actions/product.actions";
import { getAllCategories } from "@/services/categories";
import { getProductById } from "@/services/products";
import { Category, Product } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Package, Sparkles } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { cn } from "@/lib/utils";

export default function EditProductPage() {
  const { t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, prod] = await Promise.all([
          getAllCategories(),
          getProductById(productId)
        ]);
        setCategories(cats);
        setProduct(prod);
        if (prod?.image_url) setImagePreview(prod.image_url);
        if (prod) {
          setPrice(prod.selling_price.toString());
          setPurchasePrice(prod.purchase_price.toString());
        }
      } catch (err) {
        toast.error(isRTL ? "فشل تحميل بيانات المنتج" : "Failed to load product data");
      } finally {
        setFetching(false);
      }
    }
    loadData();
  }, [productId, isRTL]);

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
    const sellingPrice = parseFloat(formData.get("price") as string);
    const costPrice = parseFloat(formData.get("purchase_price") as string);

    if (sellingPrice <= costPrice) {
      toast.error(isRTL ? "يجب أن يكون سعر البيع أكبر من سعر الشراء" : "Selling price must be greater than purchase price (Profit required)");
      setLoading(false);
      return;
    }
    
    try {
      const result = await updateProduct(productId, formData);
      if (result.success) {
        toast.success(isRTL ? "تم تحديث المنتج بنجاح! ✨" : "Product updated successfully! ✨");
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

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">
          {isRTL ? "جاري تحميل ملف المنتج..." : "Loading Product Profile..."}
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-24 bg-white rounded-3xl shadow-sm">
        <Package className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
        <h3 className="text-xl font-black">{isRTL ? "المنتج غير موجود" : "Product not found."}</h3>
        <Link href="/products" className="text-pink-500 font-bold hover:underline mt-4 inline-block">
          {isRTL ? "العودة للقائمة" : "Back to list"}
        </Link>
      </div>
    );
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
          <h2 className="text-3xl font-black tracking-tight">{isRTL ? "تعديل المنتج" : "Edit Product"}</h2>
          <p className="text-muted-foreground font-medium">{isRTL ? "تحديث تفاصيل المنتج في مجموعتك الاختيارية." : "Update product details in your curated collection."}</p>
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
                    defaultValue={product.name} 
                    placeholder={isRTL ? "اسم المنتج" : "Product Name"} 
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
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
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
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
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
                      defaultValue={product.stock_quantity} 
                      placeholder="0" 
                      className={cn("h-14 rounded-2xl bg-white border-white/40 shadow-inner font-bold", isRTL && "text-right")}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={cn("text-[10px] font-black uppercase tracking-widest text-muted-foreground block", isRTL && "text-right")}>{t.products.category}</label>
                    <select 
                      name="category_id" 
                      defaultValue={product.category_id || ""}
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
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
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
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              <Button type="submit" className="w-full h-14 bg-gradient-to-r from-pink-500 to-violet-500 hover:opacity-90 shadow-xl shadow-pink-500/20 rounded-2xl font-black uppercase tracking-widest" disabled={loading}>
                {loading ? (
                    <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {isRTL ? "جاري الحفظ..." : "Saving..."}
                    </div>
                ) : <><Save className={cn("w-5 h-5", isRTL ? "ml-2" : "mr-2")} /> {t.products.saveChanges || (isRTL ? "حفظ التغييرات" : "Save Changes")}</>}
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
