import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { addYears } from 'date-fns'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  
  const { qrCode, action } = await request.json()

  if (!qrCode || !action) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  // Buscar Asset
  const { data: asset, error: assetError } = await supabase
    .from('assets')
    .select('*')
    .eq('qr_code', qrCode)
    .single()

  if (!asset || assetError) {
     return NextResponse.json({ error: 'Equipamento não encontrado' }, { status: 404 })
  }

  let updates: any = {};
  let message = '';

  if (action === 'pickup') {
      updates = {
          status: 'maintenance',
          location: 'Em Manutenção - Oficina'
      }
      message = 'Retirado para manutenção.'
  } else if (action === 'delivery') {
      const nextYear = addYears(new Date(), 1);
      updates = {
          status: 'ok',
          expiration_date: nextYear.toISOString(),
          last_inspection_date: new Date().toISOString(),
          location: 'Entregue ao Cliente'
      }
      message = 'Entregue e validado por 1 ano.'
  } else if (action === 'inspection') {
      updates = {
          last_inspection_date: new Date().toISOString(),
          status: 'ok'
      }
      message = 'Inspeção técnica registrada com sucesso.'
  }

  const { error: updateError } = await supabase
    .from('assets')
    .update(updates)
    .eq('id', asset.id)

  if (updateError) {
      return NextResponse.json({ error: 'Erro ao atualizar equipamento: ' + updateError.message }, { status: 500 })
  }

  return NextResponse.json({
      success: true,
      assetName: asset.name,
      message: message,
      details: action === 'delivery' ? `Vence em: ${new Date(updates.expiration_date).toLocaleDateString('pt-BR')}` : ''
  })
}
