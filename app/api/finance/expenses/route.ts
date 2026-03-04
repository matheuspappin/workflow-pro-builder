import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
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

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('studio_id', studioId)
      .order('due_date', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studio_id, description, category, amount, due_date, status, notes } = body

    if (!studio_id || !description || !amount || !due_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const access = await checkStudioAccess(request, studio_id)
    if (!access.authorized) return access.response

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        studio_id,
        description,
        category,
        amount,
        due_date,
        status: status || 'pending',
        notes
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, studio_id, ...updateData } = body

    if (!id || !studio_id) {
      return NextResponse.json({ error: 'ID and Studio ID are required' }, { status: 400 })
    }

    const access = await checkStudioAccess(request, studio_id)
    if (!access.authorized) return access.response

    const { data, error } = await supabase
      .from('expenses')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('studio_id', studio_id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const studioId = searchParams.get('studioId')

    if (!id || !studioId) {
      return NextResponse.json({ error: 'ID and Studio ID are required' }, { status: 400 })
    }

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('studio_id', studioId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
