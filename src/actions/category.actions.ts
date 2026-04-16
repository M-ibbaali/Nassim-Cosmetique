'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createCategory(formData: FormData) {
  try {
    const supabase = await createClient();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!name) {
      return { success: false, error: 'Category name is required' };
    }

    const { error } = await supabase
      .from('categories')
      .insert([{ name, description }]);

    if (error) {
      return { success: false, error: `Database Error: ${error.message}` };
    }

    revalidatePath('/categories');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: `Critical Error: ${err.message}` };
  }
}

export async function updateCategory(id: string, formData: FormData) {
  try {
    const supabase = await createClient();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!name) {
      return { success: false, error: 'Category name is required' };
    }

    const { error } = await supabase
      .from('categories')
      .update({ name, description })
      .eq('id', id);

    if (error) {
      return { success: false, error: `Database Error: ${error.message}` };
    }

    revalidatePath('/categories');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: `Critical Error: ${err.message}` };
  }
}

export async function deleteCategory(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) {
      return { success: false, error: `Database Error: ${error.message}` };
    }

    revalidatePath('/categories');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: `Critical Error: ${err.message}` };
  }
}
