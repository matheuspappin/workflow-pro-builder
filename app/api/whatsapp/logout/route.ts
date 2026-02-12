import { NextRequest, NextResponse } from 'next/server'
import { logoutWhatsApp } from '@/lib/whatsapp'

export async function POST(request: NextRequest) {
  try {
    const { studioId } = await request.json()

    if (!studioId) {
      return NextResponse.json({ error: 'Studio ID is required' }, { status: 400 })
    }

    const result = await logoutWhatsApp(studioId)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
