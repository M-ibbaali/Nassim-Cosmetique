'use server';

import { createClient } from '@/lib/supabase/server';
import { Product } from '@/types';

export async function getAllProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getLowStockProducts(threshold: number = 5): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_active', true)
    .lte('stock_quantity', threshold)
    .order('stock_quantity');

  if (error) throw error;
  return data || [];
}

export async function getLowStockCount(threshold: number = 5): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .lte('stock_quantity', threshold);

  if (error) throw error;
  return count || 0;
}
