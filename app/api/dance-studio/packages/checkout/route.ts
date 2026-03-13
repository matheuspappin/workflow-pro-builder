import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import logger from '@/lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// POST /api/dance-studio/packages/checkout
// Cria sessão Stripe para compra de pacote de créditos.
// O webhook /api/webhooks/stripe processa o pagamento e credita via adjust_student_credits.
export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Pagamento online não configurado. Contate o estúdio.' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const { packageId, studioId, studentId, studentEmail, studentName, successUrl, cancelUrl } = body

    if (!packageId || !studioId || !studentId || !studentEmail) {
      return NextResponse.json(
        { error: 'packageId, studioId, studentId e studentEmail são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = getAdmin()

    // Buscar o pacote para garantir que existe e está ativo
    const { data: pkg, error: pkgError } = await supabase
      .from('lesson_packages')
      .select('id, name, description, lessons_count, price, is_active, studio_id')
      .eq('id', packageId)
      .eq('studio_id', studioId)
      .eq('is_active', true)
      .single()

    if (pkgError || !pkg) {
      return NextResponse.json({ error: 'Pacote não encontrado ou inativo' }, { status: 404 })
    }

    // Verificar que o aluno existe e pertence ao estúdio
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, name, email')
      .eq('id', studentId)
      .maybeSingle()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })
    }

    const priceInCents = Math.round(Number(pkg.price) * 100)
    const origin = new URL(request.url).origin

    // Criar sessão de checkout no Stripe
    // metadata.type = 'package' → webhook sabe que deve creditar aulas
    // metadata.invoice_id = pkg.id → webhook busca lessons_count do pacote
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'pix'],
      mode: 'payment',
      customer_email: studentEmail,
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: pkg.name,
              description: pkg.description || `${pkg.lessons_count} crédito(s) de aula`,
              metadata: { studio_id: studioId, package_id: pkg.id },
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'package',
        invoice_id: pkg.id,          // usado pelo webhook para buscar lessons_count
        studio_id: studioId,
        student_id: studentId,
        package_name: pkg.name,
        lessons_count: String(pkg.lessons_count),
      },
      success_url: successUrl || `${origin}/solutions/estudio-de-danca/student/financeiro?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${origin}/solutions/estudio-de-danca/student/financeiro?payment=cancelled`,
    })

    logger.info(`✅ [PACKAGES/CHECKOUT] Sessão Stripe criada para aluno ${studentId}, pacote ${pkg.name}`)
    return NextResponse.json({ url: session.url, sessionId: session.id })

  } catch (error: any) {
    logger.error('❌ [PACKAGES/CHECKOUT] Erro:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
