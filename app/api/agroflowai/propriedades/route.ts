import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studioId')
    const customerId = searchParams.get('customerId')
    const carStatus = searchParams.get('carStatus')

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    let query = supabaseAdmin
      .from('agroflowai_properties')
      .select(`
        id, name, total_area_ha, city, state, car_number, car_status,
        biome, coordinates, notes, customer_id, created_at, updated_at,
        customer:students(id, name, email, phone)
      `)
      .eq('studio_id', studioId)
      .order('name', { ascending: true })

    if (customerId) query = query.eq('customer_id', customerId)
    if (carStatus && carStatus !== 'all') query = query.eq('car_status', carStatus)

    const { data, error } = await query
    if (error) throw error

    const result = (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      total_area_ha: p.total_area_ha ? String(p.total_area_ha) : '',
      city: p.city || '',
      state: p.state || '',
      car_number: p.car_number || '',
      car_status: p.car_status || 'pendente',
      biome: p.biome || '',
      coordinates: p.coordinates || '',
      notes: p.notes || '',
      customer_id: p.customer_id || null,
      customer_name: p.customer?.name || '',
      created_at: p.created_at,
      updated_at: p.updated_at,
    }))

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      studioId, studio_id,
      name, customer_id, total_area_ha,
      city, state, car_number, car_status,
      biome, coordinates, notes,
    } = body

    const sid = studioId || studio_id
    const access = await checkStudioAccess(request, sid)
    if (!access.authorized) return access.response
    if (!name) return NextResponse.json({ error: 'Nome da propriedade é obrigatório' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('agroflowai_properties')
      .insert({
        studio_id: sid,
        name,
        customer_id: customer_id || null,
        total_area_ha: total_area_ha ? parseFloat(String(total_area_ha)) : null,
        city: city || null,
        state: state ? String(state).toUpperCase().slice(0, 2) : null,
        car_number: car_number || null,
        car_status: car_status || 'pendente',
        biome: biome || null,
        coordinates: coordinates || null,
        notes: notes || null,
      })
      .select(`
        id, name, total_area_ha, city, state, car_number, car_status,
        biome, coordinates, notes, customer_id, created_at,
        customer:students(id, name)
      `)
      .single()

    if (error) throw error

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
      customer_name: (data.customer as any)?.name || '',
      created_at: data.created_at,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
