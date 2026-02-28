import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

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
    const since24h = new Date()
    since24h.setHours(since24h.getHours() - 24)

    const [logsRes, metricsRes] = await Promise.all([
      supabaseAdmin
        .from('admin_system_logs')
        .select('id, type, source, message, studio, metadata, created_at')
        .order('created_at', { ascending: false })
        .limit(100),
      supabaseAdmin
        .from('admin_system_logs')
        .select('type')
        .gte('created_at', since24h.toISOString())
    ])

    if (logsRes.error) {
      return NextResponse.json({ error: logsRes.error.message }, { status: 500 })
    }

    const logs = (logsRes.data || []).map((row) => ({
      id: row.id,
      type: row.type,
      source: row.source,
      message: row.message,
      studio: row.studio ?? 'Sistema',
      timestamp: row.created_at,
      metadata: row.metadata,
    }))

    const last24h = metricsRes.data || []
    const errors24h = last24h.filter((r) => r.type === 'error').length
    const warnings24h = last24h.filter((r) => r.type === 'warning').length
    const events24h = last24h.length

    return NextResponse.json({
      logs,
      metrics: {
        errors24h,
        warnings24h,
        events24h,
      },
    })
  } catch (error: unknown) {
    console.error('Erro ao buscar logs:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.res!

  try {
    const body = await request.json()
    const { type, source, message, studio } = body

    if (!type || !source || !message) {
      return NextResponse.json(
        { error: 'type, source e message são obrigatórios' },
        { status: 400 }
      )
    }

    const validTypes = ['error', 'warning', 'success', 'info']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'type inválido' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin.from('admin_system_logs').insert({
      type,
      source,
      message,
      studio: studio || null,
      metadata: body.metadata || {},
    }).select('id, type, source, message, studio, created_at').single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      log: {
        id: data.id,
        type: data.type,
        source: data.source,
        message: data.message,
        studio: data.studio ?? 'Sistema',
        timestamp: data.created_at,
      },
    })
  } catch (error: unknown) {
    console.error('Erro ao criar log:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE() {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.res!

  try {
    const { error } = await supabaseAdmin.from('admin_system_logs').delete().gte('created_at', '1970-01-01')
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Erro ao limpar logs:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
