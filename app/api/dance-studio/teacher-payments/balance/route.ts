import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase-admin'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

function createSSRClient(request: NextRequest) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (n: string) => request.cookies.get(n)?.value,
      set: () => undefined,
      remove: () => undefined,
    },
  })
}

// GET: Saldo do professor (pending, released, withdrawn)
export async function GET(request: NextRequest) {
  const supabase = createSSRClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: prof } = await supabaseAdmin
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!prof) return NextResponse.json({ error: 'Professor não encontrado' }, { status: 404 })

  const { data: entries, error } = await supabaseAdmin
    .from('teacher_payment_entries')
    .select('amount, status')
    .eq('professional_id', prof.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const pending = (entries || []).filter((e: any) => e.status === 'pending').reduce((s: number, e: any) => s + Number(e.amount), 0)
  const released = (entries || []).filter((e: any) => e.status === 'released').reduce((s: number, e: any) => s + Number(e.amount), 0)
  const withdrawn = (entries || []).filter((e: any) => e.status === 'withdrawn').reduce((s: number, e: any) => s + Number(e.amount), 0)

  return NextResponse.json({
    pending: Number(pending.toFixed(2)),
    released: Number(released.toFixed(2)),
    withdrawn: Number(withdrawn.toFixed(2)),
    availableToWithdraw: Number(released.toFixed(2)),
  })
}
