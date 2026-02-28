import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

// Engenheiros: professionals com professional_type IN ('engineer', 'architect')
// Dados extras (CREA, especialidade) armazenados via metadata

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studioId')

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    const { data: profs, error } = await supabaseAdmin
      .from('professionals')
      .select('id, name, email, phone, professional_type, status, created_at')
      .eq('studio_id', studioId)
      .in('professional_type', ['engineer', 'architect'])
      .order('name', { ascending: true })

    if (error) throw error

    // Contar OS atribuídas por engenheiro (abertas + em andamento)
    const ids = (profs || []).map((p: any) => p.id)
    let osMap: Record<string, number> = {}

    if (ids.length > 0) {
      const { data: osList } = await supabaseAdmin
        .from('service_orders')
        .select('professional_id')
        .eq('studio_id', studioId)
        .in('professional_id', ids)
        .in('status', ['open', 'in_progress'])

      for (const os of osList || []) {
        if (os.professional_id) osMap[os.professional_id] = (osMap[os.professional_id] || 0) + 1
      }
    }

    const result = (profs || []).map((p: any) => ({
      id: p.id,
      name: p.name || '',
      email: p.email || '',
      phone: p.phone || '',
      crea: '',
      specialty: p.professional_type === 'architect' ? 'Arquitetura e Urbanismo' : 'Engenharia Ambiental',
      status: p.status || 'active',
      total_os: osMap[p.id] || 0,
      created_at: p.created_at,
    }))

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
