'use server';

import { createClient } from '@/lib/supabase/server';
import { SaleWithItems } from '@/types';

export async function getAllSales(): Promise<SaleWithItems[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('sales')
    .select('*, sale_items(*, product:products(*, category:categories(*)))')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getSaleById(id: string): Promise<SaleWithItems | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('sales')
    .select('*, sale_items(*, product:products(*, category:categories(*)))')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getSalesByDateRange(start: string, end: string): Promise<SaleWithItems[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('sales')
    .select('*, sale_items(*, product:products(*, category:categories(*)))')
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
