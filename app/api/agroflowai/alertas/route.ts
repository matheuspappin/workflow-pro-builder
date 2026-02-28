import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

interface Alert {
  id: string
  type: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  ref_id?: string
  ref_type?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studioId')

    if (!studioId) return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    const alerts: Alert[] = []

    // 1. OS paradas há mais de 7 dias sem atualização (in_progress sem update)
    try {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data: stalledOS } = await supabaseAdmin
        .from('service_orders')
        .select('id, title, updated_at, customer:students(name)')
        .eq('studio_id', studioId)
        .eq('status', 'in_progress')
        .lt('updated_at', sevenDaysAgo.toISOString())
        .in('project_type', ['laudo_car', 'vistoria_ndvi', 'regularizacao', 'licenciamento', 'monitoramento', 'outro', 'environmental_os', 'laudo'])

      for (const os of stalledOS || []) {
        const daysSince = Math.floor((Date.now() - new Date(os.updated_at).getTime()) / (1000 * 60 * 60 * 24))
        alerts.push({
          id: `os-stalled-${os.id}`,
          type: 'os_stalled',
          severity: daysSince > 14 ? 'critical' : 'warning',
          title: 'OS parada sem atualização',
          description: `"${os.title}" está Em Andamento há ${daysSince} dias sem atualização`,
          ref_id: os.id,
          ref_type: 'os',
        })
      }
    } catch {}

    // 2. Propriedades com CAR pendente ou irregular
    try {
      const { data: pendingProps } = await supabaseAdmin
        .from('agroflowai_properties')
        .select('id, name, car_status, city, state')
        .eq('studio_id', studioId)
        .in('car_status', ['pendente', 'irregular'])

      for (const prop of pendingProps || []) {
        alerts.push({
          id: `car-${prop.id}`,
          type: 'car_issue',
          severity: prop.car_status === 'irregular' ? 'critical' : 'warning',
          title: prop.car_status === 'irregular' ? 'Propriedade com CAR irregular' : 'CAR pendente de regularização',
          description: `${prop.name}${prop.city ? ` — ${prop.city}, ${prop.state}` : ''} requer ação`,
          ref_id: prop.id,
          ref_type: 'property',
        })
      }
    } catch {}

    // 3. Laudos em rascunho há mais de 10 dias
    try {
      const tenDaysAgo = new Date()
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)

      const { data: oldDrafts } = await supabaseAdmin
        .from('service_orders')
        .select('id, title, created_at')
        .eq('studio_id', studioId)
        .eq('project_type', 'laudo')
        .eq('status', 'open')
        .lt('created_at', tenDaysAgo.toISOString())

      for (const l of oldDrafts || []) {
        const daysSince = Math.floor((Date.now() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24))
        alerts.push({
          id: `laudo-draft-${l.id}`,
          type: 'laudo_stalled',
          severity: 'info',
          title: 'Laudo em rascunho há muito tempo',
          description: `"${l.title}" está como rascunho há ${daysSince} dias — considere revisar`,
          ref_id: l.id,
          ref_type: 'laudo',
        })
      }
    } catch {}

    // 4. Leads em negociação há mais de 15 dias sem update
    try {
      const fifteenDaysAgo = new Date()
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)

      const { data: staleLeads } = await supabaseAdmin
        .from('leads')
        .select('id, name, stage, created_at')
        .eq('studio_id', studioId)
        .eq('status', 'active')
        .in('stage', ['negotiating', 'trial_scheduled'])
        .lt('created_at', fifteenDaysAgo.toISOString())

      for (const lead of staleLeads || []) {
        alerts.push({
          id: `lead-stale-${lead.id}`,
          type: 'lead_stale',
          severity: 'info',
          title: 'Lead sem movimentação',
          description: `${lead.name} está em negociação há mais de 15 dias — lembre de fazer follow-up`,
          ref_id: lead.id,
          ref_type: 'lead',
        })
      }
    } catch {}

    // Sort: critical first, then warning, then info
    const order = { critical: 0, warning: 1, info: 2 }
    alerts.sort((a, b) => order[a.severity] - order[b.severity])

    return NextResponse.json(alerts.slice(0, 10))
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
