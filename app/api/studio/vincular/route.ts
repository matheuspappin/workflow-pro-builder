import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isProfessionalsLimitReachedForStudio } from '@/lib/studio-limits'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

function createSSRClient(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (bearerToken) {
    return createServerClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${bearerToken}` } },
      cookies: { get() { return undefined }, set() {}, remove() {} },
    })
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) { return request.cookies.get(name)?.value },
      set() {},
      remove() {},
    },
  })
}

// GET: Retorna o vínculo atual do usuário com o estúdio
export async function GET(request: NextRequest) {
  try {
    const supabase = createSSRClient(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const [{ data: student }, { data: professional }] = await Promise.all([
      supabaseAdmin
        .from('students')
        .select('id, name, studio_id, status')
        .eq('id', user.id)
        .eq('status', 'active')
        .maybeSingle(),
      supabaseAdmin
        .from('professionals')
        .select('id, name, studio_id, status, professional_type')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle(),
    ])

    if (student?.studio_id) {
      const { data: studio } = await supabaseAdmin
        .from('studios')
        .select('id, name')
        .eq('id', student.studio_id)
        .maybeSingle()
      return NextResponse.json({ linked: true, student_id: student.id, role: 'student', studio })
    }

    if (professional?.studio_id) {
      const { data: studio } = await supabaseAdmin
        .from('studios')
        .select('id, name')
        .eq('id', professional.studio_id)
        .maybeSingle()
      return NextResponse.json({ linked: true, professional_id: professional.id, role: professional.professional_type, studio })
    }

    const metaStudioId = user.user_metadata?.studio_id
    if (metaStudioId) {
      const { data: studio } = await supabaseAdmin
        .from('studios')
        .select('id, name')
        .eq('id', metaStudioId)
        .maybeSingle()
      if (studio) {
        return NextResponse.json({ linked: true, role: user.user_metadata?.role || 'student', studio })
      }
    }

    return NextResponse.json({ linked: false })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST: Vincular ao estúdio via código de convite (padrão DanceFlow — todos os nichos)
export async function POST(request: NextRequest) {
  try {
    const supabase = createSSRClient(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await request.json()
    const inviteCode = (body.invite_code || '').trim().toUpperCase()

    if (!inviteCode || inviteCode.length < 4) {
      return NextResponse.json({ error: 'Código de convite inválido' }, { status: 400 })
    }

    const { data: allSettings } = await supabaseAdmin
      .from('organization_settings')
      .select('studio_id, theme_config')

    let matchedStudioId: string | null = null
    let codeType: 'teacher' | 'student' | null = null

    for (const row of (allSettings || [])) {
      const codes = row.theme_config?.invite_codes || {}
      if (codes.teacher_invite_code === inviteCode) {
        matchedStudioId = row.studio_id
        codeType = 'teacher'
        break
      }
      if (codes.student_invite_code === inviteCode) {
        matchedStudioId = row.studio_id
        codeType = 'student'
        break
      }
    }

    if (!matchedStudioId || !codeType) {
      return NextResponse.json({ error: 'Estabelecimento não encontrado. Verifique o código informado.' }, { status: 404 })
    }

    const { data: studioData } = await supabaseAdmin
      .from('studios')
      .select('id, name')
      .eq('id', matchedStudioId)
      .maybeSingle()

    const studio = studioData ?? { id: matchedStudioId, name: 'Estabelecimento' }
    const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário'
    const userEmail = user.email || ''

    if (codeType === 'student') {
      const { data: existing } = await supabaseAdmin
        .from('students')
        .select('id, status, studio_id')
        .eq('id', user.id)
        .maybeSingle()

      if (existing) {
        if (existing.studio_id === studio.id && existing.status === 'active') {
          return NextResponse.json({ error: 'Você já está vinculado a este estabelecimento.' }, { status: 409 })
        }
        await supabaseAdmin
          .from('students')
          .update({ studio_id: studio.id, status: 'active', name: userName, email: userEmail })
          .eq('id', existing.id)
      } else {
        await supabaseAdmin.from('students').insert({
          id: user.id,
          studio_id: studio.id,
          name: userName,
          email: userEmail,
          phone: user.user_metadata?.phone || null,
          status: 'active',
        })
      }

      const { data: existingCredits } = await supabaseAdmin
        .from('student_lesson_credits')
        .select('id')
        .eq('student_id', user.id)
        .eq('studio_id', studio.id)
        .maybeSingle()

      if (!existingCredits) {
        const expiry = new Date()
        expiry.setFullYear(expiry.getFullYear() + 1)
        await supabaseAdmin.from('student_lesson_credits').insert({
          student_id: user.id,
          studio_id: studio.id,
          total_credits: 0,
          remaining_credits: 0,
          expiry_date: expiry.toISOString(),
        }).single()
      }

      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, role: 'student', studio_id: studio.id },
      })

      return NextResponse.json({
        success: true,
        message: `Vinculado com sucesso ao estabelecimento ${studio.name}`,
        role: 'student',
        studio: { id: studio.id, name: studio.name },
      })
    }

    const { data: existing } = await supabaseAdmin
      .from('professionals')
      .select('id, status, studio_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      if (existing.studio_id === studio.id && existing.status === 'active') {
        return NextResponse.json({ error: 'Você já está vinculado a este estabelecimento.' }, { status: 409 })
      }
      await supabaseAdmin
        .from('professionals')
        .update({ studio_id: studio.id, status: 'active', name: userName, email: userEmail, professional_type: 'teacher' })
        .eq('id', existing.id)
    } else {
      const { count } = await supabaseAdmin
        .from('professionals')
        .select('*', { count: 'exact', head: true })
        .eq('studio_id', studio.id)
        .eq('status', 'active')
      if (await isProfessionalsLimitReachedForStudio(studio.id, count ?? 0)) {
        return NextResponse.json({ error: 'O estabelecimento atingiu o limite de profissionais para o plano atual.' }, { status: 403 })
      }
      await supabaseAdmin.from('professionals').insert({
        studio_id: studio.id,
        user_id: user.id,
        name: userName,
        email: userEmail,
        phone: user.user_metadata?.phone || null,
        professional_type: 'teacher',
        status: 'active',
      })
    }

    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, role: 'teacher', studio_id: studio.id },
    })

    return NextResponse.json({
      success: true,
      message: `Vinculado com sucesso ao estabelecimento ${studio.name}`,
      role: 'teacher',
      studio: { id: studio.id, name: studio.name },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE: Desvincular do estúdio atual
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createSSRClient(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    await Promise.all([
      supabaseAdmin
        .from('students')
        .update({ status: 'inactive', studio_id: null })
        .eq('id', user.id)
        .eq('status', 'active'),
      supabaseAdmin
        .from('professionals')
        .update({ status: 'inactive', studio_id: null })
        .eq('user_id', user.id)
        .eq('status', 'active'),
    ])

    return NextResponse.json({ success: true, message: 'Desvinculado do estabelecimento com sucesso.' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
