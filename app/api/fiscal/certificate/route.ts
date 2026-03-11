import { NextRequest, NextResponse } from 'next/server'
import { guardModule } from '@/lib/modules-server'
import { saveCertificateForStudio } from '@/lib/providers/fiscal/certificate-service'
import logger from '@/lib/logger'

/**
 * API de certificado fiscal A1
 * POST: Upload do certificado .pfx
 * GET: Status do certificado (sem expor dados sensíveis)
 * DELETE: Remover certificado
 */

export async function POST(request: NextRequest) {
  try {
    const { studioId } = await guardModule('fiscal')

    const { searchParams } = new URL(request.url)
    const queryStudioId = searchParams.get('studioId')
    if (queryStudioId && queryStudioId !== studioId) {
      return NextResponse.json({ error: 'Acesso negado a este estúdio' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('pfx') as File | null
    const password = formData.get('password') as string | null
    const environment = (formData.get('environment') as string) || 'homologation'

    if (!file || !password?.trim()) {
      return NextResponse.json(
        { error: 'Arquivo .pfx e senha são obrigatórios' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    if (buffer.length === 0) {
      return NextResponse.json(
        { error: 'Arquivo vazio ou inválido' },
        { status: 400 }
      )
    }

    const result = await saveCertificateForStudio(
      studioId,
      buffer,
      password.trim(),
      {
        environment:
          environment === 'production' ? 'production' : 'homologation',
      }
    )

    if (!result.success) {
      logger.error('[Fiscal] Erro ao salvar certificado:', result.error)
      return NextResponse.json(
        { error: result.error || 'Erro ao salvar certificado' },
        { status: 500 }
      )
    }

    logger.info(`[Fiscal] Certificado A1 salvo para studio ${studioId}`)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Erro ao salvar certificado'
    logger.error('[Fiscal] Erro no upload:', error)
    const status =
      message.includes('não está ativo') || message.includes('Acesso negado')
        ? 403
        : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { studioId } = await guardModule('fiscal')

    const { searchParams } = new URL(request.url)
    const queryStudioId = searchParams.get('studioId')
    if (queryStudioId && queryStudioId !== studioId) {
      return NextResponse.json({ error: 'Acesso negado a este estúdio' }, { status: 403 })
    }

    const { supabaseAdmin } = await import('@/lib/supabase-admin')
    const { data, error } = await supabaseAdmin
      .from('tenant_certificates')
      .select('valid_until, environment, created_at, updated_at')
      .eq('studio_id', studioId)
      .maybeSingle()

    if (error) throw error

    if (!data) {
      return NextResponse.json({ configured: false })
    }

    return NextResponse.json({
      configured: true,
      environment: data.environment,
      valid_until: data.valid_until,
      updated_at: data.updated_at,
    })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Erro ao consultar certificado'
    const status =
      message.includes('não está ativo') || message.includes('Acesso negado')
        ? 403
        : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { studioId } = await guardModule('fiscal')

    const { searchParams } = new URL(request.url)
    const queryStudioId = searchParams.get('studioId')
    if (queryStudioId && queryStudioId !== studioId) {
      return NextResponse.json({ error: 'Acesso negado a este estúdio' }, { status: 403 })
    }

    const { supabaseAdmin } = await import('@/lib/supabase-admin')
    const { error } = await supabaseAdmin
      .from('tenant_certificates')
      .delete()
      .eq('studio_id', studioId)

    if (error) throw error

    logger.info(`[Fiscal] Certificado removido para studio ${studioId}`)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Erro ao remover certificado'
    const status =
      message.includes('não está ativo') || message.includes('Acesso negado')
        ? 403
        : 500
    return NextResponse.json({ error: message }, { status })
  }
}
