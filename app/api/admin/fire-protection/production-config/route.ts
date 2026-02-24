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

  const { searchParams } = new URL(request.url)
  const studioId = searchParams.get('studioId')
  if (!studioId) {
    return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })
  }

  const [configRes, techniciansRes] = await Promise.all([
    supabaseAdmin
      .from('fire_protection_production_config')
      .select('*')
      .eq('studio_id', studioId)
      .maybeSingle(),
    supabaseAdmin
      .from('professionals')
      .select('id, name, professional_type, extintores_por_dia')
      .eq('studio_id', studioId)
      .eq('status', 'active')
      .in('professional_type', ['technician', 'teacher', 'other'])
      .order('name'),
  ])

  return NextResponse.json({
    config: configRes.data ?? null,
    technicians: techniciansRes.data ?? [],
    error: configRes.error || techniciansRes.error ? (configRes.error?.message || techniciansRes.error?.message) : null,
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.res!

  const body = await request.json()
  const { studio_id, extintores_por_dia, lead_time_minimo_dias, technicians } = body

  if (!studio_id) {
    return NextResponse.json({ error: 'studio_id é obrigatório' }, { status: 400 })
  }

  const extintores = parseInt(String(extintores_por_dia ?? 20), 10) || 20
  const leadTime = parseInt(String(lead_time_minimo_dias ?? 1), 10) ?? 1

  const { error: configError } = await supabaseAdmin
    .from('fire_protection_production_config')
    .upsert(
      {
        studio_id,
        extintores_por_dia: extintores,
        lead_time_minimo_dias: leadTime,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'studio_id' }
    )

  if (configError) {
    return NextResponse.json({ error: configError.message }, { status: 500 })
  }

  if (Array.isArray(technicians) && technicians.length > 0) {
    for (const t of technicians) {
      if (t?.id) {
        await supabaseAdmin
          .from('professionals')
          .update({
            extintores_por_dia: t.extintores_por_dia != null ? (parseInt(String(t.extintores_por_dia), 10) || null) : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', t.id)
          .eq('studio_id', studio_id)
      }
    }
  }

  return NextResponse.json({ success: true })
}
