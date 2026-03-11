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

// GET /api/dance-studio/expenses?studioId=...
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
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('studio_id', studioId)
      .order('due_date', { ascending: false })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: any) {
    logger.error('❌ [DANCE-STUDIO/EXPENSES GET] Erro:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/dance-studio/expenses — create expense
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { studioId, description, category, amount, due_date, status, notes, is_recurring, recurrence_period } = body

  if (!studioId || !description || !amount || !due_date) {
    return NextResponse.json({ error: 'studioId, description, amount e due_date são obrigatórios' }, { status: 400 })
  }

  const access = await checkStudioAccess(request, studioId)
  if (!access.authorized) return access.response

  const supabase = getAdmin()

  try {
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        studio_id: studioId,
        description,
        category: category || 'Outros',
        amount: Number(amount),
        due_date,
        status: status || 'pending',
        notes: notes || null,
        is_recurring: is_recurring || false,
        recurrence_period: is_recurring ? (recurrence_period || 'monthly') : null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    logger.error('❌ [DANCE-STUDIO/EXPENSES POST] Erro:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH /api/dance-studio/expenses — update expense
export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { studioId, expenseId, description, category, amount, due_date, status, notes, is_recurring, recurrence_period } = body

  if (!studioId || !expenseId) {
    return NextResponse.json({ error: 'studioId e expenseId são obrigatórios' }, { status: 400 })
  }

  const access = await checkStudioAccess(request, studioId)
  if (!access.authorized) return access.response

  const supabase = getAdmin()

  try {
    const updateData: Record<string, any> = {}
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (amount !== undefined) updateData.amount = Number(amount)
    if (due_date !== undefined) updateData.due_date = due_date
    if (status !== undefined) {
      updateData.status = status
      if (status === 'paid') updateData.payment_date = new Date().toISOString().split('T')[0]
    }
    if (notes !== undefined) updateData.notes = notes
    if (is_recurring !== undefined) {
      updateData.is_recurring = is_recurring
      updateData.recurrence_period = is_recurring ? (recurrence_period || 'monthly') : null
    }

    const { data, error } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', expenseId)
      .eq('studio_id', studioId)
      .select()
      .single()

    if (error) throw error

    // Auto-generate next occurrence when marked as paid and is recurring
    if (data.status === 'paid' && data.is_recurring && data.recurrence_period) {
      const nextDueDate = new Date(data.due_date)
      if (data.recurrence_period === 'monthly') nextDueDate.setMonth(nextDueDate.getMonth() + 1)
      else if (data.recurrence_period === 'weekly') nextDueDate.setDate(nextDueDate.getDate() + 7)
      else if (data.recurrence_period === 'yearly') nextDueDate.setFullYear(nextDueDate.getFullYear() + 1)

      const nextDateStr = nextDueDate.toISOString().split('T')[0]
      const { data: existing } = await supabase
        .from('expenses')
        .select('id')
        .eq('studio_id', studioId)
        .eq('description', data.description)
        .eq('due_date', nextDateStr)
        .maybeSingle()

      if (!existing) {
        await supabase.from('expenses').insert({
          studio_id: studioId,
          description: data.description,
          category: data.category,
          amount: data.amount,
          due_date: nextDateStr,
          status: 'pending',
          is_recurring: true,
          recurrence_period: data.recurrence_period,
          parent_id: data.id,
          notes: data.notes,
        })
      }
    }

    return NextResponse.json(data)
  } catch (error: any) {
    logger.error('❌ [DANCE-STUDIO/EXPENSES PATCH] Erro:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/dance-studio/expenses?studioId=...&expenseId=...
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const studioId = searchParams.get('studioId')
  const expenseId = searchParams.get('expenseId')

  if (!studioId || !expenseId) {
    return NextResponse.json({ error: 'studioId e expenseId são obrigatórios' }, { status: 400 })
  }

  const access = await checkStudioAccess(request, studioId)
  if (!access.authorized) return access.response

  const supabase = getAdmin()

  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)
      .eq('studio_id', studioId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('❌ [DANCE-STUDIO/EXPENSES DELETE] Erro:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
