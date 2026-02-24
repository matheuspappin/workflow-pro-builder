import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studioId')

    if (!studioId) {
      return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })
    }

    const { data: reminders, error } = await supabaseAdmin
      .from('sale_reminders')
      .select(`
        id,
        service_order_id,
        customer_id,
        reminder_type,
        scheduled_at,
        sent_at,
        channel,
        created_at,
        service_orders(tracking_code, total_amount, title),
        students(name, phone)
      `)
      .eq('studio_id', studioId)
      .order('scheduled_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ reminders: reminders || [] })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studio_id, service_order_id, customer_id, reminder_type, days = 1 } = body

    if (!studio_id || !service_order_id || !customer_id || !reminder_type) {
      return NextResponse.json({ error: 'studio_id, service_order_id, customer_id e reminder_type são obrigatórios' }, { status: 400 })
    }

    const scheduledAt = new Date()
    scheduledAt.setDate(scheduledAt.getDate() + days)

    const { data, error } = await supabaseAdmin
      .from('sale_reminders')
      .insert({
        studio_id,
        service_order_id,
        customer_id,
        reminder_type,
        scheduled_at: scheduledAt.toISOString(),
        channel: 'whatsapp',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, reminder: data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao agendar lembrete'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
