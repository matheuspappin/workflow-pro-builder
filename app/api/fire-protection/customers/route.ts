import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studioId')

    if (!studioId) {
      return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('students')
      .select('id, name, phone, email, address')
      .eq('studio_id', studioId)
      .eq('status', 'active')
      .order('name', { ascending: true })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
