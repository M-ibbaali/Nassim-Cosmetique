"use client";

import { useState, useEffect } from "react";
import { Product, CartItem } from "@/types";
import { getAllProducts } from "@/services/products";
import { createSale } from "@/actions/sale.actions";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency, cn } from "@/lib/utils";
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard,
  ShoppingCart
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ProductImage } from "@/components/ui/ProductImage";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function POSPage() {
  const { t, isRTL } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCartMobile, setShowCartMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await getAllProducts();
        setProducts(data);
      } catch (err) {
        toast.error(t.common.error);
      }
    };
    loadProducts();
  }, [t.common.error]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) {
      toast.error(t.pos.soldOut);
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          toast.warning(`${t.pos.inStock}: ${product.stock_quantity}`);
          return prev;
        }
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      toast.success(`${product.name} +1`, { duration: 1000, position: isRTL ? "bottom-right" : "bottom-left" });
      return [...prev, { product, quantity: 1, price: product.selling_price }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(1, Math.min(item.product.stock_quantity, item.quantity + delta));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const items = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.price
      }));
      
      const result = await createSale(items);
      if (result.success) {
        setCart([]);
        const data = await getAllProducts();
        setProducts(data);
        toast.success(t.common.success);
        router.push("/history");
      } else {
        toast.error(result.error || t.common.error);
      }
    } catch (err: any) {
      toast.error(err.message || t.common.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-[calc(100vh-100px)] lg:h-[calc(100vh-140px)]" dir={isRTL ? "rtl" : "ltr"}>
      <div className={cn("grid grid-cols-1 lg:grid-cols-12 gap-6 h-full", isRTL && "lg:flex-row-reverse")}>
        {/* Product Selection */}
        <div className={cn(
          "lg:col-span-8 flex flex-col gap-6 h-full transition-all duration-300", 
          isRTL && "lg:order-2",
          showCartMobile ? "hidden lg:flex" : "flex"
        )}>
        <div className="relative">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground", isRTL ? "right-4" : "left-4")} />
          <Input 
            placeholder={t.pos.searchProducts} 
            className={cn(
              "h-14 rounded-2xl bg-white border-none shadow-sm font-medium text-lg focus:ring-primary/20",
              isRTL ? "pr-12 pl-4 text-right" : "pl-12 pr-4 text-left"
            )}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 overflow-y-auto pr-2 pb-6 custom-scrollbar">
          {filteredProducts.map((product) => (
            <Card 
              key={product.id} 
              className={cn(
                "group cursor-pointer hover:shadow-xl transition-all rounded-3xl overflow-hidden border-none bg-white",
                product.stock_quantity <= 0 && "opacity-50 grayscale"
              )}
              onClick={() => addToCart(product)}
            >
              <div className="aspect-square relative flex items-center justify-center">
                <ProductImage 
                    src={product.image_url} 
                    alt={product.name} 
                    containerClassName="rounded-none border-none shadow-none"
                    className="group-hover:scale-110 transition-transform duration-700" 
                />
                
                {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-amber-500 text-white text-[10px] font-black rounded-full shadow-lg shadow-amber-500/20">
                    {t.pos.lowStock}
                  </div>
                )}
                {product.stock_quantity <= 0 && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="px-4 py-1.5 bg-red-600 text-white text-xs font-black uppercase tracking-widest rounded-full">{t.pos.soldOut}</span>
                  </div>
                )}
              </div>
              <CardContent className="p-3 md:p-5">
                <p className={cn("font-bold text-sm md:text-lg text-foreground truncate", isRTL && "text-right")}>{product.name}</p>
                <div className={cn("flex justify-between items-end mt-2", isRTL && "flex-row-reverse")}>
                  <div className={cn("flex flex-col", isRTL && "items-end")}>
                    <p className="text-sm md:text-xl font-black text-pink-500">{formatCurrency(product.selling_price)}</p>
                    <p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mt-1">{t.pos.sellingPrice}</p>
                  </div>
                  <div className={isRTL ? "text-left" : "text-right"}>
                    <span className={cn(
                        "text-xs font-black px-2 py-0.5 rounded-lg",
                        product.stock_quantity <= 5 ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                    )}>
                        {product.stock_quantity}
                    </span>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">{t.pos.inStock}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

        {/* Shopping Cart */}
        <Card className={cn(
          "lg:col-span-4 flex flex-col h-full shadow-2xl border-none bg-white rounded-3xl lg:rounded-3xl overflow-hidden transition-all duration-300", 
          isRTL && "lg:order-1",
          !showCartMobile ? "hidden lg:flex" : "flex"
        )}>
        <CardHeader className="border-b bg-accent/10 px-6 py-6">
          <CardTitle className={cn("flex items-center gap-3 text-xl font-black tracking-tight uppercase", isRTL && "flex-row-reverse text-right")}>
            <div className="p-2 bg-pink-500 text-white rounded-xl shadow-lg shadow-pink-500/20">
                <ShoppingCart className="w-5 h-5" />
            </div>
            {t.pos.orderTitle}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-0">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-12 text-center">
              <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center mb-6">
                <ShoppingCart className="w-10 h-10 opacity-20" />
              </div>
              <p className="text-lg font-bold">{t.pos.emptyCart}</p>
              <p className="text-sm opacity-60">{t.pos.emptyCartSub}</p>
            </div>
          ) : (
            <div className="divide-y divide-accent/30">
              {cart.map((item) => (
                <div key={item.product.id} className={cn("p-5 flex gap-4 group", isRTL && "flex-row-reverse text-right")}>
                  <div className="w-16 h-16 flex-shrink-0">
                    <ProductImage src={item.product.image_url} alt={item.product.name} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{item.product.name}</p>
                    <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest mt-0.5">{formatCurrency(item.price)} {t.pos.perUnit}</p>
                    <div className={cn("flex items-center gap-3 mt-3", isRTL && "flex-row-reverse")}>
                      <button 
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-10 h-8 rounded-xl bg-accent/50 flex items-center justify-center hover:bg-pink-100 hover:text-pink-600 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-black w-6 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="w-10 h-8 rounded-xl bg-accent/50 flex items-center justify-center hover:bg-pink-100 hover:text-pink-600 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className={cn("text-right flex flex-col justify-between", isRTL && "text-left items-start")}>
                    <p className="text-md font-black text-foreground">{formatCurrency(item.price * item.quantity)}</p>
                    <button 
                      onClick={() => removeFromCart(item.product.id)}
                      className={cn("p-2 text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all rounded-lg", isRTL ? "self-start" : "self-end")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex-col gap-6 border-t bg-accent/5 p-6 shadow-[-4px_0_20px_rgba(0,0,0,0.02)]">
          <div className="w-full space-y-2">
            <div className={cn("flex justify-between items-center px-1", isRTL && "flex-row-reverse")}>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t.pos.subtotal}</span>
                <span className="text-xs font-black uppercase text-foreground">{cart.length} {t.products.title}</span>
            </div>
            <div className={cn("w-full flex justify-between items-center", isRTL && "flex-row-reverse")}>
                <span className="text-md font-bold text-muted-foreground uppercase tracking-tighter">{t.pos.grandTotal}</span>
                <span className="text-3xl font-black text-pink-500">{formatCurrency(total)}</span>
            </div>
          </div>
          <Button 
            className="w-full h-14 text-lg font-black tracking-widest uppercase bg-gradient-to-r from-pink-500 to-violet-500 hover:opacity-90 shadow-2xl shadow-pink-500/30 rounded-2xl"
            disabled={cart.length === 0 || loading}
            onClick={handleCheckout}
          >
            {loading ? (
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t.pos.processing}
                </div>
            ) : (
                <><CreditCard className={cn("w-5 h-5", isRTL ? "ml-3" : "mr-3")} /> {t.pos.completeSale}</>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Mobile Cart Toggle FAB */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2">
        <Button 
          onClick={() => setShowCartMobile(!showCartMobile)}
          className={cn(
            "h-14 px-8 rounded-full shadow-2xl transition-all active:scale-95 font-black uppercase tracking-widest text-sm",
            showCartMobile 
              ? "bg-white text-foreground border border-accent/20" 
              : "bg-gradient-to-r from-pink-500 to-violet-500 text-white"
          )}
        >
          {showCartMobile ? (
            <div className="flex items-center gap-2">
               <Plus className="w-4 h-4" /> {isRTL ? "إضافة منتجات" : "Add Products"}
            </div>
          ) : (
            <div className="flex items-center gap-2">
               <ShoppingCart className="w-4 h-4" /> {t.pos.orderTitle} ({cart.length})
            </div>
          )}
        </Button>
      </div>
        </div>
      </div>
    );
}
