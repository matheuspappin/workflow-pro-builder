import { NextRequest, NextResponse } from 'next/server'
import { getWhatsAppConnection } from '@/lib/whatsapp'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studioId')

    if (!studioId) {
      return NextResponse.json({ error: 'Studio ID is required' }, { status: 400 })
    }

    const result = await getWhatsAppConnection(studioId)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
