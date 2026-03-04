import { NextRequest, NextResponse } from 'next/server'
import { checkSuperAdminDetailed } from '@/lib/actions/super-admin'
import { isMaintenanceMode, setMaintenanceMode } from '@/lib/maintenance'
import { logAdmin } from '@/lib/admin-logs'

export async function GET(request: NextRequest) {
  const { isAdmin } = await checkSuperAdminDetailed()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const enabled = await isMaintenanceMode()
  return NextResponse.json({ maintenance: enabled })
}

export async function POST(request: NextRequest) {
  const { isAdmin, user } = await checkSuperAdminDetailed()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { enabled } = await request.json()

  if (typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'Campo "enabled" (boolean) é obrigatório' }, { status: 400 })
  }

  await setMaintenanceMode(enabled)
  await logAdmin(
    'warning',
    'super-admin/maintenance',
    `Modo manutenção ${enabled ? 'ATIVADO' : 'DESATIVADO'} por admin ${user?.id}`,
    { metadata: { enabled, adminUserId: user?.id } }
  )

  return NextResponse.json({ success: true, maintenance: enabled })
}
