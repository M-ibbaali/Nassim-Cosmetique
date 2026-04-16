'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createSale(items: { product_id: string; quantity: number; price: number }[], notes: string = '') {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  try {
    const { data: saleId, error } = await supabase.rpc('create_sale_atomic', {
      p_notes: notes,
      p_user_id: user.id,
      p_items: items
    });

    if (error) throw new Error(error.message);

    revalidatePath('/sales');
    revalidatePath('/history');
    revalidatePath('/'); // dashboard
    
    return { success: true, saleId, error: null };
  } catch (err: any) {
    console.error('Create sale error:', err);
    return { success: false, error: err.message, saleId: null };
  }
}

export async function deleteSale(saleId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase.rpc('void_sale', {
    p_sale_id: saleId
  });

  if (error) {
    console.error('Delete sale error:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/history');
  revalidatePath('/'); // dashboard
  revalidatePath('/analytics');

  return { success: true };
}

export async function filterSales(start: string, end: string) {
  const { getSalesByDateRange } = await import("@/services/sales");
  try {
    const data = await getSalesByDateRange(start, end);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
