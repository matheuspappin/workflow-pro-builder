import { NextRequest, NextResponse } from 'next/server'
import { logoutWhatsApp } from '@/lib/whatsapp'

export async function POST(request: NextRequest) {
  try {
    const result = await logoutWhatsApp('00000000-0000-0000-0000-000000000000')
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
