import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const start = Date.now()

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: internalUser } = await supabaseAdmin
      .from('users_internal')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    const role = internalUser?.role ?? user.user_metadata?.role
    if (role !== 'super_admin' && role !== 'superadmin') {
      return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 })
    }

    const healthStart = Date.now()
    const { error } = await supabaseAdmin.from('admin_system_logs').select('id').limit(1)
    const latency = Date.now() - healthStart

    const status = error ? 'offline' : 'operational'
    const totalLatency = Date.now() - start

    return NextResponse.json({
      database: {
        status,
        latency: error ? null : `${latency}ms`,
        message: error ? error.message : 'Operacional',
      },
      api: {
        latency: `${totalLatency}ms`,
      },
    })
  } catch (err) {
    const latency = Date.now() - start
    return NextResponse.json({
      database: {
        status: 'error',
        latency: null,
        message: err instanceof Error ? err.message : 'Erro desconhecido',
      },
      api: {
        latency: `${latency}ms`,
      },
    })
  }
}
