import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

/**
 * API PARA ENVIO MANUAL DE MENSAGENS PELO DASHBOARD
 */
export async function POST(request: NextRequest) {
  try {
    const { to, message, studioId } = await request.json()

    if (!to || !message) {
      return NextResponse.json({ success: false, error: 'Destinatário e mensagem são obrigatórios' }, { status: 400 })
    }

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
