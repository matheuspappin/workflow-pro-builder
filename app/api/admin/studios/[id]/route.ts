import { NextResponse } from 'next/server'
import { checkSuperAdminDetailed } from '@/lib/actions/super-admin'
import { supabaseAdmin } from '@/lib/supabase-admin'
import logger from '@/lib/logger'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studioId } = await params

  const { isAdmin } = await checkSuperAdminDetailed()

  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('studios')
    .select(`
      *,
      organization_settings (*)
    `)
    .eq('id', studioId)
    .single()

  if (error) {
    logger.error('Error fetching tenant:', error)
    return NextResponse.json({ error: 'Failed to fetch tenant data' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  const settings = Array.isArray(data.organization_settings)
    ? data.organization_settings[0]
    : data.organization_settings
  const modules = settings?.enabled_modules ?? {}

  return NextResponse.json({
    ...data,
    modules,
  })
}
