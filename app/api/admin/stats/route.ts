import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { checkSuperAdminDetailed } from '@/lib/actions/super-admin'
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  // Verificação de segurança - apenas super admins
  const { isAdmin } = await checkSuperAdminDetailed()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    // 1. Total de Estúdios
    const { count: totalStudios } = await supabase
      .from('studios')
      .select('*', { count: 'exact', head: true })

    // 2. Total de Alunos (Global)
    const { count: totalStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })

    // 3. Receita Mensal Recorrente (MRR) - SaaS da Plataforma
    // Baseado no preço dos planos dos estúdios ativos
    const { data: activeStudiosData } = await supabase
      .from('studios')
      .select('plan, created_at')
      .eq('subscription_status', 'active')

    const { data: plans } = await supabase
      .from('system_plans')
      .select('id, price')

    const planPrices = plans?.reduce((acc: any, p) => {
      acc[p.id] = parseFloat(p.price)
      return acc
    }, {}) || {}

    // MRR Atual
    const mrr = activeStudiosData?.reduce((sum, s) => sum + (planPrices[s.plan] || 0), 0) || 0

    // 4. Assinantes Ativos
    const activeSubscribers = activeStudiosData?.length || 0

    // 5. Taxa de Conversão (Ativos / Total)
    const conversionRate = totalStudios ? (activeSubscribers / totalStudios) * 100 : 0

    // 6. Últimos Estúdios Cadastrados
    const { data: recentStudios } = await supabase
      .from('studios')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    // 7. Dados de Hoje para Cards em Tempo Real
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Check-ins de Hoje
    const { count: checkinsToday } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())
      .eq('status', 'present')

    // Vendas Marketplace/PDV de Hoje
    const { data: pdvToday } = await supabase
      .from('inventory_transactions')
      .select('total_value, type')
      .eq('type', 'sale')
      .gte('created_at', today.toISOString())

    const totalSalesToday = pdvToday?.reduce((sum, t) => sum + parseFloat(t.total_value || 0), 0) || 0
    const salesCountToday = pdvToday?.length || 0

    // Métricas WhatsApp e IA (Totais)
    const { count: totalMessages } = await supabase
      .from('whatsapp_messages')
      .select('*', { count: 'exact', head: true })

    const { count: aiMessages } = await supabase
      .from('whatsapp_messages')
      .select('*', { count: 'exact', head: true })
      .eq('is_ai', true)

    // 8. GERAÇÃO DE DADOS REAIS PARA O GRÁFICO (Últimos 7 dias)
    const chartData = []
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
    
    // Data de 7 dias atrás
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    // Buscar Vendas (PDV) dos últimos 7 dias
    const { data: lastWeekSales } = await supabase
      .from('inventory_transactions')
      .select('created_at, total_value')
      .eq('type', 'sale')
      .gte('created_at', sevenDaysAgo.toISOString())

    // Buscar Pagamentos (Mensalidades) dos últimos 7 dias
    const { data: lastWeekPayments } = await supabase
      .from('payments')
      .select('payment_date, amount')
      .eq('status', 'paid')
      .gte('payment_date', sevenDaysAgo.toISOString().split('T')[0]) // payment_date é DATE

    // Agregar dados por dia
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo)
      d.setDate(d.getDate() + i)
      const dayStr = days[d.getDay()]
      const dateStr = d.toISOString().split('T')[0] // YYYY-MM-DD

      // Somar vendas do dia (PDV)
      const dailySales = lastWeekSales
        ?.filter(s => s.created_at.startsWith(dateStr))
        .reduce((sum, s) => sum + parseFloat(s.total_value || 0), 0) || 0

      // Somar pagamentos do dia (Mensalidades)
      const dailyPayments = lastWeekPayments
        ?.filter(p => p.payment_date === dateStr)
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0

      // Total transacionado no dia (GMV da plataforma)
      const totalVolume = dailySales + dailyPayments

      // Para MRR no gráfico, como não temos histórico diário, usamos o atual projetado
      // ou poderíamos calcular baseado em quando as assinaturas começaram, mas para simplicidade e performance
      // vamos manter o MRR atual como linha de base, talvez com uma leve variação baseada em novos estúdios naquele dia
      // Mas para ser "real", vamos plotar o VOLUME DE TRANSAÇÕES (Sales) vs MRR (que é o faturamento da plataforma)
      
      chartData.push({
        name: dayStr,
        date: dateStr, // Útil para tooltip se precisar
        mrr: mrr, // MRR é uma métrica de estado, tende a ser estável na semana
        sales: totalVolume // Volume transacionado nos estúdios (GMV)
      })
    }

    return NextResponse.json({
      stats: {
        totalStudios: totalStudios || 0,
        totalStudents: totalStudents || 0,
        mrr: mrr,
        activeSubscribers: activeSubscribers,
        conversionRate: conversionRate,
        pdvStats: {
          salesToday: totalSalesToday,
          countToday: salesCountToday
        },
        ecosystemStats: {
          checkinsToday: checkinsToday || 0,
          totalMessages: totalMessages || 0,
          aiMessages: aiMessages || 0,
        },
        chartData: chartData,
        activePlans: {
          free: activeStudiosData?.filter(s => s.plan === 'gratuito').length || 0,
          pro: activeStudiosData?.filter(s => s.plan === 'pro').length || 0,
          enterprise: activeStudiosData?.filter(s => s.plan === 'enterprise').length || 0
        }
      },
      recentStudios: recentStudios || []
    })

  } catch (error: any) {
    logger.error('💥 Erro na API Admin Stats:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
