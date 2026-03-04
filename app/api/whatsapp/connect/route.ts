import { NextRequest, NextResponse } from 'next/server'
import { getWhatsAppConnection } from '@/lib/whatsapp'
import { checkStudioAccess } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studioId')

    if (!studioId) {
      return NextResponse.json({ error: 'Studio ID is required' }, { status: 400 })
    }

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    const result = await getWhatsAppConnection(studioId)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
