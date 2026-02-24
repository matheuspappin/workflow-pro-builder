import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import logger from '@/lib/logger'

/**
 * CRON: Lembretes de Vendas (Fire Protection)
 * - Pagamento pendente: envia lembrete para clientes com vendas não pagas
 * - Lembretes agendados: processa sale_reminders com scheduled_at <= now
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    const todayStr = now.toISOString()

    let messagesSent = 0

    // 1. Processar lembretes agendados em sale_reminders
    const { data: pendingReminders } = await supabaseAdmin
      .from('sale_reminders')
      .select(`
        id,
        studio_id,
        service_order_id,
        customer_id,
        reminder_type,
        channel,
        service_orders(tracking_code, total_amount, title),
        students(name, phone)
      `)
      .is('sent_at', null)
      .lte('scheduled_at', todayStr)

    for (const rem of pendingReminders || []) {
      const customer = (rem as any).students as { name?: string; phone?: string } | null
      const sale = (rem as any).service_orders as { tracking_code?: string; total_amount?: number; title?: string } | null
      if (!customer?.phone) continue

      const formatCurrency = (v: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)

      let message = ''
      if (rem.reminder_type === 'payment_pending') {
        message = `Olá ${customer.name?.split(' ')[0] || 'Cliente'}! 🔔\n\nLembrete: você possui um pagamento pendente da venda *${sale?.tracking_code || 'N/A'}* no valor de *${formatCurrency(sale?.total_amount ?? 0)}*.\n\nEntre em contato para regularizar. Obrigado!`
      } else if (rem.reminder_type === 'follow_up') {
        message = `Olá ${customer.name?.split(' ')[0] || 'Cliente'}! 👋\n\nPassando para lembrar que realizamos recentemente o serviço: *${sale?.title || 'Venda PDV'}*.\n\nSe precisar de recarga, vistoria ou manutenção, estamos à disposição!`
      } else {
        message = `Olá ${customer.name?.split(' ')[0] || 'Cliente'}! 📅\n\nLembrete: está na hora de agendar a próxima recarga ou vistoria dos seus extintores.\n\nEntre em contato conosco para agendarmos.`
      }

      const result = await sendWhatsAppMessage({
        to: customer.phone,
        message,
        studioId: rem.studio_id,
      })

      if (result.success) {
        await supabaseAdmin
          .from('sale_reminders')
          .update({ sent_at: todayStr, message_sent: message })
          .eq('id', rem.id)
        messagesSent++
      }
    }

    // 2. Criar lembretes automáticos para vendas com pagamento pendente (sem reminder nos últimos 7 dias)
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: pendingSales } = await supabaseAdmin
      .from('service_orders')
      .select(`
        id,
        studio_id,
        tracking_code,
        total_amount,
        customer_id,
        customer:students(name, phone)
      `)
      .eq('project_type', 'pdv')
      .eq('payment_status', 'pending')
      .not('customer_id', 'is', null)
      .gte('created_at', sevenDaysAgo.toISOString())

    for (const sale of pendingSales || []) {
      const customer = sale.customer as { id?: string; name?: string; phone?: string } | null
      if (!customer?.phone) continue

      // Verificar se já existe reminder para esta venda
      const { data: existing } = await supabaseAdmin
        .from('sale_reminders')
        .select('id')
        .eq('service_order_id', sale.id)
        .eq('reminder_type', 'payment_pending')
        .maybeSingle()

      if (existing) continue

      // Criar reminder para daqui 1 dia (será processado no próximo cron)
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)

      await supabaseAdmin.from('sale_reminders').insert({
        studio_id: sale.studio_id,
        service_order_id: sale.id,
        customer_id: sale.customer_id,
        reminder_type: 'payment_pending',
        scheduled_at: tomorrow.toISOString(),
        channel: 'whatsapp',
      })
    }

    return NextResponse.json({
      success: true,
      messagesSent,
      remindersProcessed: messagesSent,
    })
  } catch (error: unknown) {
    logger.error('💥 Erro no Cron de Lembretes de Vendas:', error)
    const msg = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
