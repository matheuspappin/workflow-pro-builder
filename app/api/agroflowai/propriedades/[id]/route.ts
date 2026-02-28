import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studioId')

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    const { data, error } = await supabaseAdmin
      .from('agroflowai_properties')
      .select(`
        id, name, total_area_ha, city, state, car_number, car_status,
        biome, coordinates, notes, customer_id, created_at, updated_at,
        customer:students(id, name, email, phone)
      `)
      .eq('id', id)
      .eq('studio_id', studioId)
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

    return NextResponse.json({
      id: data.id,
      name: data.name,
      total_area_ha: data.total_area_ha ? String(data.total_area_ha) : '',
      city: data.city || '',
      state: data.state || '',
      car_number: data.car_number || '',
      car_status: data.car_status,
      biome: data.biome || '',
      coordinates: data.coordinates || '',
      notes: data.notes || '',
      customer_id: data.customer_id || null,
      customer: data.customer || null,
      created_at: data.created_at,
      updated_at: data.updated_at,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { studioId, studio_id, name, customer_id, total_area_ha, city, state, car_number, car_status, biome, coordinates, notes } = body

    const sid = studioId || studio_id
    const access = await checkStudioAccess(request, sid)
    if (!access.authorized) return access.response

    const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() }
    if (name !== undefined) updatePayload.name = name
    if (customer_id !== undefined) updatePayload.customer_id = customer_id || null
    if (total_area_ha !== undefined) updatePayload.total_area_ha = total_area_ha ? parseFloat(String(total_area_ha)) : null
    if (city !== undefined) updatePayload.city = city || null
    if (state !== undefined) updatePayload.state = state ? String(state).toUpperCase().slice(0, 2) : null
    if (car_number !== undefined) updatePayload.car_number = car_number || null
    if (car_status !== undefined) updatePayload.car_status = car_status
    if (biome !== undefined) updatePayload.biome = biome || null
    if (coordinates !== undefined) updatePayload.coordinates = coordinates || null
    if (notes !== undefined) updatePayload.notes = notes || null

    const { data, error } = await supabaseAdmin
      .from('agroflowai_properties')
      .update(updatePayload)
      .eq('id', id)
      .eq('studio_id', sid)
      .select('id, name, car_status, updated_at')
      .single()

    if (error) throw error

    return NextResponse.json({ id: data.id, name: data.name, car_status: data.car_status, updated_at: data.updated_at })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studioId')

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    const { error } = await supabaseAdmin
      .from('agroflowai_properties')
      .delete()
      .eq('id', id)
      .eq('studio_id', studioId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
