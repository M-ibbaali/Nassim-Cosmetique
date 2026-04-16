"use client";

import { useState, useEffect } from "react";
import { getAllCategories } from "@/services/categories";
import { deleteCategory } from "@/actions/category.actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Tags } from "lucide-react";
import Link from "next/link";
import { Category } from "@/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/ConfirmModal";


export default function CategoriesPage() {
  const { t, isRTL } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);
    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories", err);
    } finally {
      setLoading(false);
    }
  }

  const openDeleteConfirm = (id: string) => {
    setCategoryToDelete(id);
    setIsConfirmOpen(true);
  };

  async function handleDelete() {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      const result = await deleteCategory(categoryToDelete);
      if (result.success) {
        setCategories(prev => prev.filter(c => c.id !== categoryToDelete));
        toast.success(t.common.success);
      } else {
        toast.error(result.error);
      }
    } catch (err: any) {
      toast.error(t.common.error + ": " + err.message);
    } finally {
      setIsDeleting(false);
      setIsConfirmOpen(false);
      setCategoryToDelete(null);
    }
  }

  return (
    <div className="space-y-8 pb-12" dir={isRTL ? "rtl" : "ltr"}>
      <div className={cn("flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4", isRTL && "sm:flex-row-reverse")}>
        <div className={isRTL ? "text-right" : "text-left"}>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">{t.categories.title}</h2>
          <p className="text-sm text-muted-foreground font-medium">{t.categories.subtitle}</p>
        </div>
        <Button asChild className="w-full sm:w-auto bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90 shadow-lg rounded-xl font-bold px-6 h-12">
          <Link href="/categories/new">
            <Plus className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} /> {t.categories.addCategory}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse h-40 bg-accent/10 border-none rounded-2xl" />
          ))
        ) : categories.length === 0 ? (
          <div className="col-span-full py-24 text-center text-muted-foreground border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center opacity-50 bg-accent/5">
             <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-4">
                <Plus className="w-8 h-8" />
             </div>
             <p className="font-black uppercase tracking-widest">{t.categories.noCategories}</p>
          </div>
        ) : (
          categories.map((category) => (
            <Card key={category.id} className="hover:shadow-xl transition-all duration-300 border-none bg-white rounded-2xl overflow-hidden group">
              <CardHeader className={cn("flex flex-row items-center justify-between space-y-0 pb-2", isRTL && "flex-row-reverse")}>
                <CardTitle className="text-xl font-black">{category.name}</CardTitle>
                <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-violet-50 hover:text-violet-600" asChild>
                    <Link href={`/categories/${category.id}/edit`}>
                      <Edit className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive rounded-lg hover:bg-red-50 hover:text-red-600"
                    onClick={() => openDeleteConfirm(category.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className={isRTL ? "text-right" : "text-left"}>
                <p className="text-sm font-medium text-muted-foreground line-clamp-2 min-h-[40px]">
                  {category.description || (isRTL ? "لا يوجد وصف." : "No description provided.")}
                </p>
                <div className={cn("mt-4 pt-4 border-t border-accent/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 flex items-center", isRTL && "flex-row-reverse")}>
                  {t.categories.createdOn} {new Date(category.created_at).toLocaleDateString(isRTL ? 'ar-MA' : undefined)}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title={t.common.delete}
        description={t.common.confirm}
        confirmText={t.common.confirm}
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
