'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createProduct(formData: FormData) {
  try {
    const supabase = await createClient();
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return { success: false, error: 'Environment variable NEXT_PUBLIC_SUPABASE_URL is missing' };
    }

    const name = formData.get('name') as string;
    const price_raw = formData.get('price') as string;
    const purchase_raw = formData.get('purchase_price') as string;
    const stock_raw = formData.get('stock_quantity') as string;
    const category_id = formData.get('category_id') as string || null;
    const file = formData.get('image') as File;

    if (!name || !price_raw || !purchase_raw) {
      return { success: false, error: 'Name, Selling Price, and Purchase Price are required' };
    }

    const selling_price = parseFloat(price_raw);
    const purchase_price = parseFloat(purchase_raw);
    const stock_quantity = parseInt(stock_raw) || 0;

    if (selling_price <= purchase_price) {
      return { success: false, error: 'Selling price must be greater than purchase price (Profit required)' };
    }

    let image_url = null;

    if (file && file.size > 0) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: storageError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);

        if (storageError) {
          return { success: false, error: `Storage Error: ${storageError.message}` };
        }
        
        const { data: publicUrl } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
        
        image_url = publicUrl.publicUrl;
      } catch (storageErr: any) {
        return { success: false, error: `Storage Crash: ${storageErr.message}` };
      }
    }

    const { error: dbError } = await supabase
      .from('products')
      .insert([{ 
        name, 
        selling_price, 
        purchase_price,
        stock_quantity, 
        category_id: category_id === "" ? null : category_id, 
        image_url 
      }]);

    if (dbError) {
      return { success: false, error: `Database Error: ${dbError.message}` };
    }

    revalidatePath('/products');
    return { success: true };
  } catch (err: any) {
    console.error('Server Action Error:', err);
    return { success: false, error: `Critical Server Error: ${err.message}` };
  }
}

export async function updateProduct(id: string, formData: FormData) {
  try {
    const supabase = await createClient();
    
    const name = formData.get('name') as string;
    const price_raw = formData.get('price') as string;
    const purchase_raw = formData.get('purchase_price') as string;
    const stock_raw = formData.get('stock_quantity') as string;
    const category_id = formData.get('category_id') as string || null;
    const file = formData.get('image') as File;

    if (!name || !price_raw || !purchase_raw) {
      return { success: false, error: 'Name, Selling Price, and Purchase Price are required' };
    }

    const selling_price = parseFloat(price_raw);
    const purchase_price = parseFloat(purchase_raw);
    const stock_quantity = parseInt(stock_raw) || 0;

    if (selling_price <= purchase_price) {
      return { success: false, error: 'Selling price must be greater than purchase price (Profit required)' };
    }

    const updateData: any = { 
      name, 
      selling_price, 
      purchase_price,
      stock_quantity, 
      category_id: category_id === "" ? null : category_id 
    };

    if (file && file.size > 0) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: storageError } = await supabase.storage.from('product-images').upload(fileName, file);
      
      if (storageError) {
        return { success: false, error: `Storage Error: ${storageError.message}` };
      }

      const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(fileName);
      updateData.image_url = publicUrl.publicUrl;
    }

    const { error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id);

    if (error) {
      return { success: false, error: `Database Error: ${error.message}` };
    }

    revalidatePath('/products');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: `Critical Error: ${err.message}` };
  }
}

export async function deleteProduct(id: string) {
  try {
    const supabase = await createClient();
    // Perform SOFT DELETE (Archive) instead of hard delete
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      return { success: false, error: `Database Error: ${error.message}` };
    }

    revalidatePath('/products');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: `Critical Error: ${err.message}` };
  }
}
