'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { guardModule } from '@/lib/modules-server'

export interface StudioUnit {
  id: string
  name: string
  slug: string
  plan: string
  status: string
  city?: string
  state?: string
  address?: string
  phone?: string
  created_at: string
  owner_id?: string
}

export interface UnitStats {
  studioId: string
  students: number
  revenue_month: number
  classes_week: number
  leads: number
}

export interface ConsolidatedStats {
  total_units: number
  total_students: number
  total_revenue_month: number
  total_classes_week: number
  total_leads: number
  units: (StudioUnit & { stats: UnitStats })[]
}

export async function getLinkedUnits(ownerStudioId: string): Promise<StudioUnit[]> {
  await guardModule('multi_unit')
  const supabase = await createClient()

  // Busca estúdios vinculados pelo mesmo owner ou pelo campo parent_studio_id
  const { data: currentStudio } = await supabase
    .from('studios')
    .select('owner_id')
    .eq('id', ownerStudioId)
    .single()

  if (!currentStudio?.owner_id) return []

  const { data, error } = await supabase
    .from('studios')
    .select('id, name, slug, plan, status, city, state, address, phone, created_at, owner_id')
    .eq('owner_id', currentStudio.owner_id)
    .order('created_at')

  if (error) throw error
  return (data || []) as StudioUnit[]
}

export async function getUnitStats(studioId: string): Promise<UnitStats> {
  await guardModule('multi_unit')
  const supabase = await createClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [studentsRes, revenueRes, classesRes, leadsRes] = await Promise.allSettled([
    supabase.from('students').select('id', { count: 'exact', head: true }).eq('studio_id', studioId).eq('status', 'active'),
    supabase.from('payments').select('amount').eq('studio_id', studioId).eq('status', 'paid').gte('created_at', startOfMonth),
    supabase.from('classes').select('id', { count: 'exact', head: true }).eq('studio_id', studioId).eq('status', 'active'),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('studio_id', studioId),
  ])

  const students = studentsRes.status === 'fulfilled' ? (studentsRes.value.count || 0) : 0
  const revenue = revenueRes.status === 'fulfilled'
    ? (revenueRes.value.data || []).reduce((acc: number, p: any) => acc + (p.amount || 0), 0)
    : 0
  const classes = classesRes.status === 'fulfilled' ? (classesRes.value.count || 0) : 0
  const leads = leadsRes.status === 'fulfilled' ? (leadsRes.value.count || 0) : 0

  return {
    studioId,
    students,
    revenue_month: revenue,
    classes_week: classes,
    leads,
  }
}

export async function getConsolidatedStats(ownerStudioId: string): Promise<ConsolidatedStats> {
  await guardModule('multi_unit')

  const units = await getLinkedUnits(ownerStudioId)

  const statsPerUnit = await Promise.all(
    units.map(async (unit) => {
      const stats = await getUnitStats(unit.id)
      return { ...unit, stats }
    })
  )

  return {
    total_units: units.length,
    total_students: statsPerUnit.reduce((acc, u) => acc + u.stats.students, 0),
    total_revenue_month: statsPerUnit.reduce((acc, u) => acc + u.stats.revenue_month, 0),
    total_classes_week: statsPerUnit.reduce((acc, u) => acc + u.stats.classes_week, 0),
    total_leads: statsPerUnit.reduce((acc, u) => acc + u.stats.leads, 0),
    units: statsPerUnit,
  }
}

export async function createUnit(
  ownerStudioId: string,
  data: {
    name: string
    city: string
    state: string
    address?: string
    phone?: string
  }
): Promise<StudioUnit> {
  await guardModule('multi_unit')
  const supabase = await createClient()

  // Busca o owner_id do estúdio pai
  const { data: parent } = await supabase
    .from('studios')
    .select('owner_id, plan, slug')
    .eq('id', ownerStudioId)
    .single()

  if (!parent?.owner_id) throw new Error('Estúdio pai não encontrado')

  const slug = `${data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now()}`

  const { data: newUnit, error } = await supabase
    .from('studios')
    .insert({
      name: data.name,
      slug,
      owner_id: parent.owner_id,
      plan: parent.plan,
      status: 'active',
      city: data.city,
      state: data.state,
      address: data.address || null,
      phone: data.phone || null,
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/dashboard/multi-unit')
  return newUnit as StudioUnit
}

export async function updateUnitStatus(unitId: string, ownerStudioId: string, status: 'active' | 'inactive') {
  await guardModule('multi_unit')
  const supabase = await createClient()

  const { data: parent } = await supabase
    .from('studios')
    .select('owner_id')
    .eq('id', ownerStudioId)
    .single()

  if (!parent?.owner_id) throw new Error('Não autorizado')

  const { error } = await supabase
    .from('studios')
    .update({ status })
    .eq('id', unitId)
    .eq('owner_id', parent.owner_id)

  if (error) throw error
  revalidatePath('/dashboard/multi-unit')
}

export async function getUnitLeaderboard(ownerStudioId: string) {
  await guardModule('multi_unit')
  const consolidated = await getConsolidatedStats(ownerStudioId)

  return consolidated.units
    .sort((a, b) => b.stats.revenue_month - a.stats.revenue_month)
    .map((unit, index) => ({
      rank: index + 1,
      ...unit,
    }))
}
