import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkSuperAdminDetailed } from '@/lib/actions/super-admin'

interface Alert {
  id: string
  type: 'critical' | 'warning' | 'info'
  title: string
  description: string
  count?: number
  action?: string
}

/**
 * GET /api/admin/alerts
 * Retorna alertas proativos para o Super Admin baseados no estado real do sistema.
 */
export async function GET(request: NextRequest) {
  const { isAdmin } = await checkSuperAdminDetailed()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const alerts: Alert[] = []
  const now = new Date()

  try {
    // 1. Studios com trial expirando nos próximos 3 dias (ainda ativos)
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
    const { data: expiringTrials, count: expiringCount } = await supabaseAdmin
      .from('studios')
      .select('id, name, trial_ends_at', { count: 'exact' })
      .eq('status', 'active')
      .eq('subscription_status', 'trialing')
      .lt('trial_ends_at', threeDaysFromNow)
      .gt('trial_ends_at', now.toISOString())

    if (expiringCount && expiringCount > 0) {
      alerts.push({
        id: 'trials-expiring',
        type: 'warning',
        title: 'Trials expirando em breve',
        description: `${expiringCount} estúdio(s) com trial expirando nos próximos 3 dias.`,
        count: expiringCount,
        action: '/admin/studios'
      })
    }

    // 2. Studios com trial já expirado mas ainda marcados como active (CRON não rodou)
    const { count: expiredTrials } = await supabaseAdmin
      .from('studios')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('subscription_status', 'trialing')
      .lt('trial_ends_at', now.toISOString())

    if (expiredTrials && expiredTrials > 0) {
      alerts.push({
        id: 'trials-expired-not-deactivated',
        type: 'critical',
        title: 'Studios com trial expirado (não desativados)',
        description: `${expiredTrials} estúdio(s) com trial vencido ainda marcados como ativos. O CRON pode não ter rodado.`,
        count: expiredTrials,
        action: '/admin/studios'
      })
    }

    // 3. Studios inativos há mais de 10 dias (próximos da exclusão automática em 15 dias)
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString()
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString()
    const { count: nearDeletion } = await supabaseAdmin
      .from('studios')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'inactive')
      .lt('updated_at', tenDaysAgo)
      .gt('updated_at', fifteenDaysAgo)

    if (nearDeletion && nearDeletion > 0) {
      alerts.push({
        id: 'near-auto-deletion',
        type: 'warning',
        title: 'Studios próximos da exclusão automática',
        description: `${nearDeletion} estúdio(s) inativo(s) serão excluídos permanentemente em até 5 dias.`,
        count: nearDeletion,
        action: '/admin/studios'
      })
    }

    // 4. Erros recentes no sistema (últimas 24h)
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    const { count: recentErrors } = await supabaseAdmin
      .from('admin_system_logs')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'error')
      .gte('created_at', since24h)

    if (recentErrors && recentErrors > 5) {
      alerts.push({
        id: 'high-error-rate',
        type: 'critical',
        title: 'Taxa alta de erros',
        description: `${recentErrors} erro(s) registrado(s) nas últimas 24 horas.`,
        count: recentErrors,
        action: '/admin/logs'
      })
    } else if (recentErrors && recentErrors > 0) {
      alerts.push({
        id: 'recent-errors',
        type: 'info',
        title: 'Erros recentes',
        description: `${recentErrors} erro(s) nas últimas 24 horas.`,
        count: recentErrors,
        action: '/admin/logs'
      })
    }

    // 5. Studios sem módulos habilitados (possível misconfiguration)
    const { count: noModules } = await supabaseAdmin
      .from('organization_settings')
      .select('studio_id', { count: 'exact', head: true })
      .or('enabled_modules.is.null,enabled_modules.eq.{}')

    if (noModules && noModules > 0) {
      alerts.push({
        id: 'no-modules-enabled',
        type: 'info',
        title: 'Studios sem módulos configurados',
        description: `${noModules} estúdio(s) sem nenhum módulo habilitado.`,
        count: noModules,
        action: '/admin/studios'
      })
    }

    return NextResponse.json({
      alerts: alerts.sort((a, b) => {
        const priority = { critical: 0, warning: 1, info: 2 }
        return priority[a.type] - priority[b.type]
      }),
      totalAlerts: alerts.length,
      criticalCount: alerts.filter(a => a.type === 'critical').length,
      timestamp: now.toISOString()
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
