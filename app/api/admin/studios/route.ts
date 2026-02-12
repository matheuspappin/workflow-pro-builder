import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { data: studios, error } = await supabase
      .from('studios')
      .select(`
        *,
        student_count:students(count)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('⚠️ Tabela studios pode não existir ainda:', error.message)
      return NextResponse.json([]) // Retorna array vazio para evitar erro de .map()
    }

    return NextResponse.json(studios || [])
  } catch (error: any) {
    console.error('💥 Erro na API Admin Studios:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, status, plan, subscription_status, trial_ends_at } = await request.json()

    const { data, error } = await supabase
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
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID do estúdio é obrigatório' }, { status: 400 })
    }

    const { error } = await supabase
      .from('studios')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
