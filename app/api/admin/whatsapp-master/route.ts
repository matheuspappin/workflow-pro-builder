import { NextRequest, NextResponse } from 'next/server'
import { getWhatsAppConnection } from '@/lib/whatsapp'

export async function GET(request: NextRequest) {
  try {
    // Usamos um ID fixo ou nulo para representar a instância mestre do sistema
    const result = await getWhatsAppConnection('00000000-0000-0000-0000-000000000000')
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
