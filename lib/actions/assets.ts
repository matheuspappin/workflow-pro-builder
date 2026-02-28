import { createClient } from '@/lib/supabase/server';
import { Asset, CreateAssetDTO, UpdateAssetDTO, AssetStatus } from '@/types/assets';
import { addDays, isBefore, isAfter, parseISO } from 'date-fns';

export async function getAssets(studentId?: string) {
  const supabase = await createClient();
  let query = supabase.from('assets').select('*');
  
  if (studentId) {
    query = query.eq('student_id', studentId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching assets:', error);
    throw new Error('Failed to fetch assets');
  }

  return data as Asset[];
}

export async function getAssetById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('assets')
    .select('*, student:students(name, email)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching asset:', error);
    return null;
  }

  return data as Asset & { student?: { name: string, email: string } };
}

export async function getAssetByQrCode(qrCode: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('assets')
    .select('*, student:students(name, email)')
    .eq('qr_code', qrCode)
    .single();

  if (error) {
    console.error('Error fetching asset by QR:', error);
    return null;
  }

  return calculateAssetStatus(data as Asset & { student?: { name: string, email: string } });
}

export async function createAsset(data: CreateAssetDTO) {
  const supabase = await createClient();
  
  // Gerar QR Code hash se não existir (simples uuid ou hash)
  const qr_code = crypto.randomUUID();

  const { data: newAsset, error } = await supabase
    .from('assets')
    .insert({
      ...data,
      qr_code,
      studio_id: (await supabase.auth.getUser()).data.user?.user_metadata?.studio_id // Assumindo contexto
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating asset:', error);
    throw new Error('Failed to create asset');
  }

  return newAsset as Asset;
}

export async function updateAsset(id: string, data: Partial<UpdateAssetDTO>) {
  const supabase = await createClient();
  const { data: updatedAsset, error } = await supabase
    .from('assets')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating asset:', error);
    throw new Error('Failed to update asset');
  }

  return updatedAsset as Asset;
}

export function calculateAssetStatus(asset: Asset): Asset {
  if (!asset.expiration_date) return asset;
  
  const now = new Date();
  const expiration = new Date(asset.expiration_date);
  const warningDate = addDays(now, 30);

  let status: AssetStatus = 'ok';

  if (isBefore(expiration, now)) {
    status = 'expired';
  } else if (isBefore(expiration, warningDate)) {
    status = 'warning';
  }

  // Se o status calculado for diferente do armazenado, poderíamos atualizar no banco, 
  // mas por enquanto retornamos o calculado para exibição imediata.
  return { ...asset, status };
}
