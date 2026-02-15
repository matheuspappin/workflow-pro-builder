import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: studios, error } = await supabaseAdmin
      .from('studios')
      .select(`
        *,
        student_count:students(count)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      logger.warn('⚠️ Erro ao buscar studios:', error.message)
      return NextResponse.json([]) 
    }

    return NextResponse.json(studios || [])
  } catch (error: any) {
    logger.error('💥 Erro na API Admin Studios:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, status, plan, subscription_status, trial_ends_at } = await request.json()

    const { data, error } = await supabaseAdmin
      .from('studios')
      .update({ 
        status, 
        plan, 
        subscription_status,
        trial_ends_at,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID do estúdio é obrigatório' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('studios')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
