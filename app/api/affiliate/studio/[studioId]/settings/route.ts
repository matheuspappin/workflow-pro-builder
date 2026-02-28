
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { normalizeModules } from '@/config/modules';
import logger from '@/lib/logger';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ studioId: string }> }
) {
  const { studioId } = await params
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { data: partnerData, error: partnerError } = await supabase
    .from('partners')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (partnerError || !partnerData) {
    return NextResponse.json({ error: 'Forbidden: User is not a partner' }, { status: 403 });
  }

  const partnerId = partnerData.id;

  const { count: studioCount, error: studioError } = await supabase
    .from('studios')
    .select('id', { count: 'exact' })
    .eq('id', studioId)
    .eq('partner_id', partnerId);

  if (studioError || studioCount === null || studioCount === 0) {
    return NextResponse.json({ error: 'Forbidden: Studio not associated with this partner' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('organization_settings')
    .select('enabled_modules')
    .eq('studio_id', studioId)
    .maybeSingle();

  if (error) {
    logger.error('Error fetching organization settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }

  // Retorna as configurações normalizadas ou as padrão se não houver
  const enabledModules = data?.enabled_modules ? normalizeModules(data.enabled_modules) : normalizeModules({});

  return NextResponse.json(enabledModules);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ studioId: string }> }
) {
  const { studioId } = await params
  const supabase = await createClient();
  const { enabledModules } = await request.json();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { data: partnerData, error: partnerError } = await supabase
    .from('partners')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (partnerError || !partnerData) {
    return NextResponse.json({ error: 'Forbidden: User is not a partner' }, { status: 403 });
  }

  const partnerId = partnerData.id;

  const { count: studioCount, error: studioError } = await supabase
    .from('studios')
    .select('id', { count: 'exact' })
    .eq('id', studioId)
    .eq('partner_id', partnerId);

  if (studioError || studioCount === null || studioCount === 0) {
    return NextResponse.json({ error: 'Forbidden: Studio not associated with this partner' }, { status: 403 });
  }

  const { error } = await supabase
    .from('organization_settings')
    .upsert(
      { studio_id: studioId, enabled_modules: enabledModules },
      { onConflict: 'studio_id' }
    );

  if (error) {
    logger.error('Error updating organization settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Settings updated successfully' });
}
