import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { checkStudioAccess } from '@/lib/auth'

/**
 * API PARA ENVIO MANUAL DE MENSAGENS PELO DASHBOARD
 */
export async function POST(request: NextRequest) {
  try {
    const { to, message, studioId } = await request.json()

    if (!to || !message || !studioId) {
      return NextResponse.json({ success: false, error: 'Destinatário, mensagem e studioId são obrigatórios' }, { status: 400 })
    }

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    const result = await sendWhatsAppMessage({ to, message, studioId })

    if (result.success) {
      return NextResponse.json({ success: true, data: result.data })
    } else {
      return NextResponse.json({ success: false, error: result.error || 'Erro ao enviar via Evolution API' }, { status: 500 })
    }

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
