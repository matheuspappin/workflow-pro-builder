import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkSuperAdminDetailed } from '@/lib/actions/super-admin'

/**
 * GET /api/admin/metrics
 * Retorna métricas de uso por módulo e por tenant para o Super Admin.
 */
export async function GET(request: NextRequest) {
  const { isAdmin } = await checkSuperAdminDetailed()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    // 1. Contagem de uso por módulo (quantos studios tem cada módulo ativo)
    const { data: allSettings } = await supabaseAdmin
      .from('organization_settings')
      .select('studio_id, enabled_modules')

    const moduleUsage: Record<string, number> = {}
    for (const setting of allSettings || []) {
      const modules = setting.enabled_modules || {}
      for (const [key, enabled] of Object.entries(modules)) {
        if (enabled) {
          moduleUsage[key] = (moduleUsage[key] || 0) + 1
        }
      }
    }

    // 2. Distribuição por plano
    const { data: studios } = await supabaseAdmin
      .from('studios')
      .select('id, plan, status, subscription_status, created_at')

    const planDistribution: Record<string, { active: number; inactive: number; trialing: number }> = {}
    const statusCounts = { active: 0, inactive: 0, trialing: 0 }

    for (const studio of studios || []) {
      const plan = studio.plan || 'gratuito'
      if (!planDistribution[plan]) {
        planDistribution[plan] = { active: 0, inactive: 0, trialing: 0 }
      }

      if (studio.status === 'active') {
        planDistribution[plan].active++
        statusCounts.active++
      } else {
        planDistribution[plan].inactive++
        statusCounts.inactive++
      }

      if (studio.subscription_status === 'trialing') {
        planDistribution[plan].trialing++
        statusCounts.trialing++
      }
    }

    // 3. Crescimento: novos studios nos últimos 30 dias (por semana)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recentStudios } = await supabaseAdmin
      .from('studios')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: true })

    const weeklyGrowth: Record<string, number> = {}
    for (const s of recentStudios || []) {
      const date = new Date(s.created_at)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const weekKey = weekStart.toISOString().slice(0, 10)
      weeklyGrowth[weekKey] = (weeklyGrowth[weekKey] || 0) + 1
    }

    // 4. Top tenants por entidades (students + professionals) - Otimizado com Promise.all
    let topTenants: Array<{ studio_id: string; name: string; students: number; professionals: number }> = []
    {
      const { data: studioList } = await supabaseAdmin
        .from('studios')
        .select('id, name')
        .eq('status', 'active')
        .limit(20)

      if (studioList) {
        // Otimização: Buscar todos os counts em paralelo
        const tenantCounts = await Promise.all(
          studioList.map(async (studio) => {
            // Usar uma única query agregada por studio_id para melhor performance
            const { data: studentCounts } = await supabaseAdmin
              .from('students')
              .select('studio_id', { count: 'exact', head: true })
              .eq('studio_id', studio.id)
              .eq('status', 'active')
            
            const { data: professionalCounts } = await supabaseAdmin
              .from('professionals')
              .select('studio_id', { count: 'exact', head: true })
              .eq('studio_id', studio.id)
              .eq('status', 'active')

            return {
              studio_id: studio.id,
              name: studio.name,
              students: studentCounts?.length || 0,
              professionals: professionalCounts?.length || 0
            }
          })
        )
        
        topTenants = tenantCounts
          .sort((a, b) => (b.students + b.professionals) - (a.students + a.professionals))
          .slice(0, 10)
      }
    }

    return NextResponse.json({
      moduleUsage: Object.entries(moduleUsage)
        .map(([module, count]) => ({ module, count }))
        .sort((a, b) => b.count - a.count),
      planDistribution,
      statusCounts,
      weeklyGrowth,
      topTenants,
      totalStudios: studios?.length || 0,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
