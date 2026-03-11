import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase/server'

async function requireSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, res: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) }
  }
  const { data: internalUser } = await supabaseAdmin
    .from('users_internal')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  const role = internalUser?.role ?? user.user_metadata?.role
  if (role !== 'super_admin' && role !== 'superadmin') {
    return { ok: false, res: NextResponse.json({ error: 'Acesso restrito a super administradores' }, { status: 403 }) }
  }
  return { ok: true }
}

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.res!

  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const limit = parseInt(searchParams.get('limit') || '50')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // 1. Total de interações (count exato)
    const { count: totalCount } = await supabaseAdmin
      .from('ai_interactions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())

    // 2. Dados para agregações (limitado para performance)
    const { data: interactions } = await supabaseAdmin
      .from('ai_interactions')
      .select('id, studio_id, channel, intent_type, created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(5000)

    const total = totalCount ?? interactions?.length ?? 0

    // 3. Agrupar por canal
    const byChannel = (interactions || []).reduce((acc: Record<string, number>, row) => {
      const ch = row.channel || 'chat'
      acc[ch] = (acc[ch] || 0) + 1
      return acc
    }, {})

    // 4. Top intenções
    const byIntent = (interactions || []).reduce((acc: Record<string, number>, row) => {
      const intent = row.intent_type || 'unknown'
      acc[intent] = (acc[intent] || 0) + 1
      return acc
    }, {})
    const topIntents = Object.entries(byIntent)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([intent, count]) => ({ intent, count }))

    // 5. Interações por estúdio
    const studioIds = [...new Set((interactions || []).map((r) => r.studio_id).filter(Boolean))]
    const { data: studios } = studioIds.length > 0
      ? await supabaseAdmin.from('studios').select('id, name').in('id', studioIds)
      : { data: [] }

    const studioMap = new Map((studios || []).map((s) => [s.id, s.name]))
    const byStudio = (interactions || []).reduce((acc: Record<string, { name: string; count: number }>, row) => {
      const sid = row.studio_id || 'unknown'
      const name = studioMap.get(sid) || sid
      if (!acc[sid]) acc[sid] = { name, count: 0 }
      acc[sid].count++
      return acc
    }, {})
    const topStudios = Object.entries(byStudio)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([id, data]) => ({ studioId: id, studioName: data.name, count: data.count }))

    // 6. Últimas interações (para preview)
    const { data: recent } = await supabaseAdmin
      .from('ai_interactions')
      .select('id, studio_id, customer_contact, message, ai_response, intent_type, channel, created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit)

    const studioIdsRecent = [...new Set((recent || []).map((r) => r.studio_id).filter(Boolean))]
    const { data: studiosRecent } = studioIdsRecent.length > 0
      ? await supabaseAdmin.from('studios').select('id, name').in('id', studioIdsRecent)
      : { data: [] }
    const studioMapRecent = new Map((studiosRecent || []).map((s) => [s.id, s.name]))

    const recentWithStudio = (recent || []).map((r) => ({
      ...r,
      studioName: studioMapRecent.get(r.studio_id) || r.studio_id,
    }))

    return NextResponse.json({
      success: true,
      data: {
        period: `${days} dias`,
        totalInteractions: total,
        byChannel,
        topIntents,
        topStudios,
        recentInteractions: recentWithStudio,
      },
    })
  } catch (error) {
    console.error('Erro ao buscar métricas Catarina:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
