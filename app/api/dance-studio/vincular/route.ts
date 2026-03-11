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

    // Query both tables in parallel — avoids depending on stale JWT role metadata
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

    // Fallback: user_metadata.studio_id (ex: aluno vinculado via registro com convite, mas students desatualizado)
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

// POST: Vincular ao estúdio via código de convite
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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fbdb915b-b580-4e5e-9b0e-147b06a71f4b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d99f83'},body:JSON.stringify({sessionId:'d99f83',runId:'pre-fix-1',hypothesisId:'H2',location:'app/api/dance-studio/vincular/route.ts:POST',message:'Received POST /api/dance-studio/vincular',data:{userId:user.id,inviteCode},timestamp:Date.now()})}).catch(()=>{})
    // #endregion

    // Buscar todos os organization_settings e verificar o código em theme_config.invite_codes
    // Não filtramos por niche para cobrir todos os valores possíveis (dance, dance_studio, etc.)
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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fbdb915b-b580-4e5e-9b0e-147b06a71f4b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d99f83'},body:JSON.stringify({sessionId:'d99f83',runId:'pre-fix-1',hypothesisId:'H3',location:'app/api/dance-studio/vincular/route.ts:POST',message:'Resolved invite code to studio',data:{inviteCode,matchedStudioId,codeType},timestamp:Date.now()})}).catch(()=>{})
    // #endregion

    if (!matchedStudioId || !codeType) {
      return NextResponse.json({ error: 'Estúdio não encontrado. Verifique o código informado.' }, { status: 404 })
    }

    const { data: studioData } = await supabaseAdmin
      .from('studios')
      .select('id, name')
      .eq('id', matchedStudioId)
      .maybeSingle()

    // Fallback: usar studio_id e nome genérico se studios não retornar dados
    const studio = studioData ?? { id: matchedStudioId, name: 'Estúdio' }

    const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário'
    const userEmail = user.email || ''

    if (codeType === 'student') {
      // Verificar se já está vinculado (students.id referencia auth.users(id))
      const { data: existing } = await supabaseAdmin
        .from('students')
        .select('id, status, studio_id')
        .eq('id', user.id)
        .maybeSingle()

      if (existing) {
        if (existing.studio_id === studio.id && existing.status === 'active') {
          return NextResponse.json({ error: 'Você já está vinculado a este estúdio.' }, { status: 409 })
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

      // Inicializar créditos se não existir (tabela usa student_id / remaining_credits / expiry_date)
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

      // Atualizar metadata do auth
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, role: 'student', studio_id: studio.id },
      })

      return NextResponse.json({
        success: true,
        message: `Vinculado com sucesso ao estúdio ${studio.name}`,
        role: 'student',
        studio: { id: studio.id, name: studio.name },
      })
    }

    // Tipo: teacher
    const { data: existing } = await supabaseAdmin
      .from('professionals')
      .select('id, status, studio_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      if (existing.studio_id === studio.id && existing.status === 'active') {
        return NextResponse.json({ error: 'Você já está vinculado a este estúdio.' }, { status: 409 })
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
        return NextResponse.json({ error: 'O estúdio atingiu o limite de profissionais para o plano atual.' }, { status: 403 })
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

    // Atualizar metadata do auth
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, role: 'teacher', studio_id: studio.id },
    })

    return NextResponse.json({
      success: true,
      message: `Vinculado com sucesso ao estúdio ${studio.name}`,
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

    // Update both tables — whichever has an active link will be affected
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

    return NextResponse.json({ success: true, message: 'Desvinculado do estúdio com sucesso.' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
