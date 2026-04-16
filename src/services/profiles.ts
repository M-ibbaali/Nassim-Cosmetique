'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { Profile } from '@/types';
import { revalidatePath } from 'next/cache';

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) return null;
  return data;
}

export async function updateProfile(data: Partial<Profile>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: data.full_name,
      avatar_url: data.avatar_url,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) throw error;
  revalidatePath('/dashboard');
  revalidatePath('/settings');
  return { success: true };
}

export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function updateEmployeeRole(id: string, role: 'admin' | 'staff') {
  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id);

  if (error) throw error;
  revalidatePath('/settings');
  return { success: true };
}

export async function uploadAvatar(fileData: FormData) {
  const supabase = await createClient();
  const file = fileData.get('file') as File;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !file) throw new Error('Invalid request');

  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}-${Math.random()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('product-images') // Reusing existing bucket or assume 'avatars' exists
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath);

  return { publicUrl };
}

export async function createNewStaffUser(email: string, password: string, fullName: string, role: 'admin' | 'staff') {
  const adminClient = await createAdminClient();

  // 1. Create the user in Auth
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });

  if (authError) throw authError;

  // 2. The trigger `on_auth_user_created` will create the profile, 
  // but we use upsert to ensure we set the role correctly regardless of trigger timing
  const { error: profileError } = await adminClient
    .from('profiles')
    .upsert({ 
      id: authData.user.id,
      role, 
      full_name: fullName,
      updated_at: new Date().toISOString()
    });

  if (profileError) throw profileError;

  revalidatePath('/settings');
  return { success: true };
}
