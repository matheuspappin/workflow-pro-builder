import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/verticalization/plans?slug=fire-protection
 * Retorna os planos ativos de uma verticalização.
 * Usado pelas páginas de planos dos tenants (fire-protection, agroflowai).
 */
export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get('slug')
    if (!slug) {
      return NextResponse.json({ error: 'slug obrigatório' }, { status: 400 })
    }

    const { data: vertical, error: vError } = await supabaseAdmin
      .from('verticalizations')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (vError || !vertical) {
      return NextResponse.json({ error: 'Verticalização não encontrada' }, { status: 404 })
    }

    const { data: plans, error } = await supabaseAdmin
      .from('verticalization_plans')
      .select('*')
      .eq('verticalization_id', vertical.id)
      .eq('status', 'active')
      .order('price', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ plans: plans || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
