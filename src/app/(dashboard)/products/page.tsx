"use client";

import { useState, useEffect } from "react";
import { getAllProducts } from "@/services/products";
import { deleteProduct } from "@/actions/product.actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatCurrency, cn } from "@/lib/utils";
import { Product } from "@/types";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { ProductImage } from "@/components/ui/ProductImage";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function ProductsPage() {
  const { t, isRTL } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [productToArchive, setProductToArchive] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const data = await getAllProducts();
      setProducts(data);
    } catch (err) {
      toast.error(t.common.error);
    } finally {
      setLoading(false);
    }
  }

  const openConfirmModal = (id: string) => {
    setProductToArchive(id);
    setIsConfirmOpen(true);
  };

  async function handleConfirmArchive() {
    if (!productToArchive) return;
    
    setIsArchiving(true);
    try {
      const result = await deleteProduct(productToArchive);
      if (result.success) {
        setProducts(prev => prev.filter(p => p.id !== productToArchive));
        toast.success(t.common.success);
      } else {
        toast.error(result.error);
      }
    } catch (err: any) {
      toast.error(t.common.error + ": " + err.message);
    } finally {
      setIsArchiving(false);
      setIsConfirmOpen(false);
      setProductToArchive(null);
    }
  }

  return (
    <div className="space-y-8 pb-12" dir={isRTL ? "rtl" : "ltr"}>
      <div className={cn("flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4", isRTL && "sm:flex-row-reverse")}>
        <div className={isRTL ? "text-right" : "text-left"}>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">{t.products.title}</h2>
          <p className="text-sm text-muted-foreground font-medium">{t.products.subtitle}</p>
        </div>
        <Button asChild className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-violet-500 hover:opacity-90 shadow-lg rounded-xl font-bold px-6 h-12">
          <Link href="/products/new">
            <Plus className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} /> {t.products.addProduct}
          </Link>
        </Button>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className={cn("w-full text-sm border-collapse", isRTL ? "text-right" : "text-left")}>
              <thead>
                <tr className="text-[10px] text-muted-foreground uppercase font-black tracking-widest bg-accent/30 border-b">
                  <th className="px-6 py-5 font-black">{t.products.product}</th>
                  <th className="px-6 py-5 font-black">{t.products.category}</th>
                  <th className="px-6 py-5 font-black">{t.products.pricing}</th>
                  <th className="px-6 py-5 font-black">{t.products.stock}</th>
                  <th className={cn("px-6 py-5 font-black", isRTL ? "text-left" : "text-right")}>{t.products.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accent/30">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-8 h-20 bg-accent/5" />
                    </tr>
                  ))
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center opacity-40">
                         <Plus className="w-12 h-12 mb-4" />
                         <p className="font-bold text-lg">{t.common.error}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-accent/10 transition-colors group">
                      <td className="px-6 py-4">
                        <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                          <div className="w-12 h-12 flex-shrink-0">
                            <ProductImage src={product.image_url} alt={product.name} />
                          </div>
                          <div className={cn("flex flex-col", isRTL && "text-right")}>
                             <span className="font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{product.name}</span>
                             <span className="text-[10px] text-muted-foreground font-medium opacity-60">ID: {product.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-600 text-[10px] font-black uppercase tracking-tight">
                          {product.category?.name || "Uncategorized"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        <div className={cn("flex flex-col", isRTL && "items-end")}>
                          <span className="text-emerald-600 font-black text-base">{formatCurrency(product.selling_price)}</span>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">{t.products.costLabel}: {formatCurrency(product.purchase_price)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn("flex flex-col", isRTL && "items-end")}>
                            <span className={cn(
                                "font-black text-lg",
                                product.stock_quantity === 0 ? "text-red-500" : 
                                product.stock_quantity <= 5 ? "text-amber-500" : "text-emerald-500"
                            )}>
                            {product.stock_quantity}
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                                {product.stock_quantity <= 5 ? t.products.reorderSoon : t.products.inStockTitle}
                            </span>
                        </div>
                      </td>
                      <td className={cn("px-6 py-4", isRTL ? "text-left" : "text-right")}>
                        <div className={cn("flex gap-1", isRTL ? "justify-start" : "justify-end")}>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white hover:shadow-md transition-all" asChild>
                            <Link href={`/products/${product.id}/edit`}>
                              <Edit className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-destructive rounded-xl hover:bg-destructive/10 transition-all"
                            onClick={() => openConfirmModal(product.id)}
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
      </Card>

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmArchive}
        title={t.common.delete}
        description={t.common.confirm}
        confirmText={t.common.confirm}
        isLoading={isArchiving}
        variant="danger"
      />
    </div>
  );
}
