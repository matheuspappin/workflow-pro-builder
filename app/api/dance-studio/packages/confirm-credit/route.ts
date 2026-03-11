import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getStripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'
import logger from '@/lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// POST /api/dance-studio/packages/confirm-credit?session_id=cs_xxx
// Confirma o pagamento via Stripe e credita o aluno. Idempotente.
// Usado quando o usuário retorna da compra (webhook pode demorar ou falhar).
export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe()
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId || !sessionId.startsWith('cs_')) {
      return NextResponse.json({ error: 'session_id inválido' }, { status: 400 })
    }

    const authHeader = request.headers.get('authorization')
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${bearerToken}` } },
      cookies: { get: () => undefined, set: () => {}, remove: () => {} },
    })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const role = user.user_metadata?.role
    if (role !== 'student' && role !== 'super_admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    })

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Pagamento não confirmado' }, { status: 400 })
    }

    const metadata = session.metadata
    if (!metadata || metadata.type !== 'package') {
      return NextResponse.json({ error: 'Sessão inválida para pacote' }, { status: 400 })
    }

    const { student_id, studio_id, invoice_id } = metadata
    if (!student_id || !studio_id || !invoice_id) {
      return NextResponse.json({ error: 'Metadados incompletos' }, { status: 400 })
    }

    if (student_id !== user.id && role !== 'super_admin') {
      return NextResponse.json({ error: 'Sessão não pertence a este usuário' }, { status: 403 })
    }

    // Idempotência ATÔMICA: INSERT primeiro. Só quem conseguir inserir credita.
    // Evita race entre webhook + múltiplas chamadas do frontend.
    const { error: insertError } = await supabaseAdmin
      .from('stripe_package_credits')
      .insert({ session_id: sessionId })

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ success: true, message: 'Créditos já foram adicionados' })
      }
      logger.error('❌ [CONFIRM-CREDIT] Erro ao inserir idempotência:', insertError)
      return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 })
    }

    const { data: pkg } = await supabaseAdmin
      .from('lesson_packages')
      .select('lessons_count, name')
      .eq('id', invoice_id)
      .single()

    if (!pkg) {
      await supabaseAdmin.from('stripe_package_credits').delete().eq('session_id', sessionId)
      return NextResponse.json({ error: 'Pacote não encontrado' }, { status: 404 })
    }

    const { error: creditError } = await supabaseAdmin.rpc('adjust_student_credits', {
      p_student_id: student_id,
      p_studio_id: studio_id,
      p_amount: pkg.lessons_count,
    })

    if (creditError) {
      logger.error('❌ [CONFIRM-CREDIT] Erro ao creditar:', creditError)
      await supabaseAdmin.from('stripe_package_credits').delete().eq('session_id', sessionId)
      return NextResponse.json({ error: 'Erro ao adicionar créditos' }, { status: 500 })
    }

    const amountPaid = session.amount_total ? session.amount_total / 100 : 0
    const today = new Date().toISOString().split('T')[0]
    const refMonth = new Date().toISOString().slice(0, 7)
    await supabaseAdmin.from('payments').insert({
      studio_id,
      student_id,
      amount: amountPaid,
      due_date: today,
      payment_date: today,
      status: 'paid',
      payment_method: 'stripe_card',
      reference_month: refMonth,
      description: `Pacote: ${pkg.name} (${pkg.lessons_count} créditos)`,
      payment_source: 'package_purchase',
      reference_id: invoice_id,
    })

    logger.info(`✅ [CONFIRM-CREDIT] Créditos adicionados para aluno ${student_id}, sessão ${sessionId}`)
    return NextResponse.json({ success: true, message: 'Créditos adicionados com sucesso' })
  } catch (error: any) {
    if (error.message?.includes('Stripe') || error.message?.includes('STRIPE_SECRET_KEY')) {
      return NextResponse.json({ error: 'Pagamento online não configurado' }, { status: 503 })
    }
    logger.error('❌ [CONFIRM-CREDIT] Erro:', error)
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
  }
}
