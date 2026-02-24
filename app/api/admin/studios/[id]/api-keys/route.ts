import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Busca chaves de API de um estúdio
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data, error } = await supabase
      .from('studio_api_keys')
      .select('*')
      .eq('studio_id', id)

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Salva ou atualiza chaves de API
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { whatsapp_api_key, whatsapp_instance_id, gemini_api_key } = body

    const upserts = []

    // WhatsApp
    if (whatsapp_api_key || whatsapp_instance_id) {
      upserts.push({
        studio_id: id,
        service_name: 'whatsapp',
        api_key: whatsapp_api_key,
        instance_id: whatsapp_instance_id,
        updated_at: new Date().toISOString()
      })
    }

    // Gemini
    if (gemini_api_key) {
      upserts.push({
        studio_id: id,
        service_name: 'gemini',
        api_key: gemini_api_key,
        updated_at: new Date().toISOString()
      })
    }

    if (upserts.length > 0) {
      const { error } = await supabase
        .from('studio_api_keys')
        .upsert(upserts, { onConflict: 'studio_id, service_name' })

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
