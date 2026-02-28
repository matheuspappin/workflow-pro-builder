import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

// Clientes do AgroFlowAI são proprietários rurais armazenados na tabela `students`
// com metadados específicos (property_name, property_location, car_status) em `metadata`

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studioId')

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    const { data: students, error } = await supabaseAdmin
      .from('students')
      .select('id, name, email, phone, address, metadata, status, created_at')
      .eq('studio_id', studioId)
      .order('name', { ascending: true })

    if (error) throw error

    const result = (students || []).map((s: any) => {
      const meta: Record<string, any> = (s.metadata as Record<string, any>) || {}

      // Contar OS abertas por cliente
      return {
        id: s.id,
        name: s.name || '',
        email: s.email || '',
        phone: s.phone || '',
        property_name: meta.property_name || '',
        property_location: meta.property_location || s.address || '',
        car_status: meta.car_status || 'pendente',
        status: s.status || 'active',
        created_at: s.created_at,
        total_os: 0,
      }
    })

    // Enriquecer com contagem de OS abertas
    if (result.length > 0) {
      const ids = result.map((r: any) => r.id)
      const { data: osCounts } = await supabaseAdmin
        .from('service_orders')
        .select('customer_id')
        .eq('studio_id', studioId)
        .in('customer_id', ids)
        .in('status', ['open', 'in_progress'])

      const osMap: Record<string, number> = {}
      for (const os of osCounts || []) {
        if (os.customer_id) osMap[os.customer_id] = (osMap[os.customer_id] || 0) + 1
      }

      for (const r of result) {
        r.total_os = osMap[r.id] || 0
      }
    }

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studioId, studio_id, name, email, phone, property_name, property_location, car_status } = body

    const sid = studioId || studio_id
    const access = await checkStudioAccess(request, sid)
    if (!access.authorized) return access.response
    if (!name) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    if (!email) return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })

    const metadata = {
      property_name: property_name || '',
      property_location: property_location || '',
      car_status: car_status || 'pendente',
      verticalization: 'agroflowai',
    }

    const { data, error } = await supabaseAdmin
      .from('students')
      .insert({
        studio_id: sid,
        name,
        email,
        phone: phone || null,
        address: property_location || null,
        metadata,
        status: 'active',
      })
      .select('id, name, email, phone, metadata, created_at')
      .single()

    if (error) throw error

    const meta = (data.metadata as Record<string, any>) || {}
    return NextResponse.json({
      id: data.id,
      name: data.name,
      email: data.email || '',
      phone: data.phone || '',
      property_name: meta.property_name || '',
      property_location: meta.property_location || '',
      car_status: meta.car_status || 'pendente',
      total_os: 0,
      created_at: data.created_at,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, studioId, studio_id, name, email, phone, property_name, property_location, car_status } = body

    if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
    const sid = studioId || studio_id
    const access = await checkStudioAccess(request, sid)
    if (!access.authorized) return access.response

    const { data: current } = await supabaseAdmin
      .from('students')
      .select('metadata')
      .eq('id', id)
      .eq('studio_id', sid)
      .single()

    const existingMeta: Record<string, any> = (current?.metadata as Record<string, any>) || {}
    const updatedMeta = {
      ...existingMeta,
      ...(property_name !== undefined && { property_name }),
      ...(property_location !== undefined && { property_location }),
      ...(car_status !== undefined && { car_status }),
    }

    const updatePayload: Record<string, any> = { metadata: updatedMeta }
    if (name !== undefined) updatePayload.name = name
    if (email !== undefined) updatePayload.email = email
    if (phone !== undefined) updatePayload.phone = phone

    const { data, error } = await supabaseAdmin
      .from('students')
      .update(updatePayload)
      .eq('id', id)
      .eq('studio_id', sid)
      .select('id, name, email, phone, metadata, created_at')
      .single()

    if (error) throw error

    const meta = (data.metadata as Record<string, any>) || {}
    return NextResponse.json({
      id: data.id,
      name: data.name,
      email: data.email || '',
      phone: data.phone || '',
      property_name: meta.property_name || '',
      property_location: meta.property_location || '',
      car_status: meta.car_status || 'pendente',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const studioId = searchParams.get('studioId')

    if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    const { error } = await supabaseAdmin
      .from('students')
      .update({ status: 'inactive' })
      .eq('id', id)
      .eq('studio_id', studioId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
