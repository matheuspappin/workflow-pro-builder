import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import logger from '@/lib/logger'
import { checkStudioAccess } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// GET /api/dance-studio/teachers?studioId=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const studioId = searchParams.get('studioId')

  if (!studioId) {
    return NextResponse.json({ error: 'studioId obrigatório' }, { status: 400 })
  }

  const access = await checkStudioAccess(request, studioId)
  if (!access.authorized) return access.response

  const supabase = getAdmin()

  try {
    const { data: teachers, error } = await supabase
      .from('professionals')
      .select('id, name, email, phone, professional_type, status, created_at')
      .eq('studio_id', studioId)
      .eq('professional_type', 'teacher')
      .eq('status', 'active')
      .order('name')

    if (error) throw error

    return NextResponse.json(teachers || [])
  } catch (error: any) {
    logger.error('❌ [DANCE-STUDIO/TEACHERS] Erro:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
