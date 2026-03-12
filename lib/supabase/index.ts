import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
import logger from '../logger'

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const url = supabaseUrl || 'https://placeholder.supabase.co'
  const key = supabaseAnonKey || 'placeholder-key'

  if (!supabaseUrl || !supabaseAnonKey) {
    const msg = 'Supabase não configurado. Adicione NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local na raiz do projeto e reinicie o servidor de desenvolvimento.'
    if (typeof window !== 'undefined') {
      logger.error('⚠️ ' + msg)
    } else {
      console.error('⚠️ ' + msg)
    }
  }

  return { url, key }
}

// Cliente Singleton com lazy init para evitar "supabaseKey is required" quando env ainda não carregou
let _supabase: SupabaseClient | null = null

function getOrCreateSupabase(): SupabaseClient {
  if (_supabase) return _supabase
  const { url, key } = getSupabaseConfig()
  _supabase = typeof window !== 'undefined'
    ? createBrowserClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      })
    : createSupabaseClient(url, key)
  return _supabase
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getOrCreateSupabase()
    const value = (client as unknown as Record<string, unknown>)[prop as string]
    return typeof value === 'function' ? value.bind(client) : value
  }
})

/**
 * Cria um cliente Supabase com a configuração correta
 * (Helper de compatibilidade)
 */
export function getSupabaseClient() {
  return supabase
}

// Tipos de dados do banco com suporte a studio_id
export interface Student {
  id: string
  studio_id: string
  name: string
  email: string
  phone: string
  birth_date?: string
  address?: string
  emergency_contact?: string
  medical_info?: string
  status: 'active' | 'inactive' | 'suspended'
  enrollment_date: string
  created_at: string
  updated_at: string
}

export interface Teacher {
  id: string
  studio_id: string
  name: string
  email: string
  phone: string
  specialties: string[]
  hourly_rate: number
  status: 'active' | 'inactive'
  hire_date: string
  created_at: string
  updated_at: string
}

// Funções para consultar dados com filtragem por studio_id
export async function getStudentsData(studioId: string): Promise<{
  total: number
  active: number
  newThisMonth: number
  retentionRate: number
}> {
  try {
    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .eq('studio_id', studioId)

    if (error) {
      logger.warn('Erro ao buscar students:', error.message)
      return { total: 0, active: 0, newThisMonth: 0, retentionRate: 0 }
    }

    const total = students?.length || 0
    const active = students?.filter(s => s.status === 'active').length || 0

    const thisMonth = new Date()
    thisMonth.setDate(1)
    const newThisMonth = students?.filter(s =>
      new Date(s.enrollment_date) >= thisMonth
    ).length || 0

    const retentionRate = total > 0 ? Math.round((active / total) * 100) : 0

    return { total, active, newThisMonth, retentionRate }
  } catch (error) {
    return { total: 0, active: 0, newThisMonth: 0, retentionRate: 0 }
  }
}

export async function getTeachersData(studioId: string): Promise<{
  total: number
  active: number
  totalClasses: number
  averageRating: number
}> {
  try {
    const { data: teachers, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('studio_id', studioId)

    if (error) {
      logger.warn('Erro ao buscar teachers:', error.message)
      return { total: 0, active: 0, totalClasses: 0, averageRating: 0 }
    }

    const total = teachers?.length || 0
    const active = teachers?.filter(t => t.status === 'active').length || 0

    const { data: classes } = await supabase
      .from('classes')
      .select('id')
      .eq('studio_id', studioId)
      .eq('status', 'active')

    const totalClasses = classes?.length || 0
    const averageRating = 4.5

    return { total, active, totalClasses, averageRating }
  } catch (error) {
    return { total: 0, active: 0, totalClasses: 0, averageRating: 0 }
  }
}

export async function getFinancialData(studioId: string): Promise<{
  monthlyRevenue: number
  pendingPayments: number
  overduePayments: number
  totalPaidThisMonth: number
  debtors: any[]
}> {
  try {
    const thisMonth = new Date()
    thisMonth.setDate(1)
    const nextMonth = new Date(thisMonth)
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    // Receita mensal
    const { data: paidPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('studio_id', studioId)
      .eq('status', 'paid')
      .gte('payment_date', thisMonth.toISOString())
      .lt('payment_date', nextMonth.toISOString())

    const monthlyRevenue = paidPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

    // Pagamentos pendentes e atrasados com dados do aluno
    const { data: allPayments } = await supabase
      .from('payments')
      .select(`
        *,
        student:students (name, phone)
      `)
      .eq('studio_id', studioId)
      .neq('status', 'paid');

    const now = new Date();
    const pendingAmount = allPayments?.filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    
    const overduePayments = allPayments?.filter(p => 
      p.status === 'overdue' || (p.status === 'pending' && new Date(p.due_date) < now)
    ) || [];

    const overdueAmount = overduePayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const debtors = overduePayments.map(p => ({
      name: p.student?.name || 'Desconhecido',
      phone: p.student?.phone || 'N/A',
      amount: p.amount,
      dueDate: p.due_date,
      description: p.description
    }));

    return {
      monthlyRevenue,
      pendingPayments: pendingAmount,
      overduePayments: overdueAmount,
      totalPaidThisMonth: monthlyRevenue,
      debtors
    }
  } catch (error) {
    return { monthlyRevenue: 0, pendingPayments: 0, overduePayments: 0, totalPaidThisMonth: 0, debtors: [] }
  }
}

export async function getClassesData(studioId: string): Promise<{
  total: number
  active: number
  totalEnrollments: number
  occupancyRate: number
}> {
  try {
    const { data: classes } = await supabase
      .from('classes')
      .select('*')
      .eq('studio_id', studioId)

    const total = classes?.length || 0
    const active = classes?.filter(c => c.status === 'active').length || 0

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('*')
      .eq('studio_id', studioId)
      .eq('status', 'active')

    const totalEnrollments = enrollments?.length || 0
    const totalCapacity = classes?.filter(c => c.status === 'active').reduce((sum, c) => sum + (c.max_students || 0), 0) || 0
    const occupancyRate = totalCapacity > 0 ? Math.round((totalEnrollments / totalCapacity) * 100) : 0

    return { total, active, totalEnrollments, occupancyRate }
  } catch (error) {
    return { total: 0, active: 0, totalEnrollments: 0, occupancyRate: 0 }
  }
}

/** CRM (leads/clientes) - para Catarina responder "quantos clientes no CRM", listar leads, etc. */
export async function getLeadsData(studioId: string): Promise<{
  total: number
  byStage: Record<string, number>
  recent: { name: string; email?: string; phone?: string; stage: string; source?: string }[]
}> {
  try {
    const { data: leads, error, count } = await supabase
      .from('leads')
      .select('id, name, email, phone, stage, source, created_at', { count: 'exact' })
      .eq('studio_id', studioId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      logger.warn('Erro ao buscar leads:', error.message)
      return { total: 0, byStage: {}, recent: [] }
    }

    const list = leads || []
    const total = count ?? list.length
    const byStage: Record<string, number> = {}
    for (const l of list) {
      const s = l.stage || 'new'
      byStage[s] = (byStage[s] || 0) + 1
    }
    const recent = list.slice(0, 15).map(l => ({
      name: l.name || 'Sem nome',
      email: l.email,
      phone: l.phone,
      stage: l.stage || 'new',
      source: l.source,
    }))

    return { total, byStage, recent }
  } catch (error) {
    return { total: 0, byStage: {}, recent: [] }
  }
}

/** Estoque (produtos) - para Catarina responder sobre estoque, produtos, itens disponíveis */
export async function getInventoryData(studioId: string): Promise<{
  totalProducts: number
  totalItems: number
  totalValue: number
  lowStock: { name: string; quantity: number; minStock: number }[]
  products: { name: string; sku?: string; quantity: number; minStock: number; price?: number }[]
}> {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, sku, quantity, current_stock, min_stock, min_quantity, selling_price, price, cost_price')
      .eq('studio_id', studioId)
      .in('status', ['active'])
      .order('name', { ascending: true })
      .limit(100)

    if (error) {
      logger.warn('Erro ao buscar produtos:', error.message)
      return { totalProducts: 0, totalItems: 0, totalValue: 0, lowStock: [], products: [] }
    }

    const list = products || []
    const totalProducts = list.length
    const totalItems = list.reduce((acc, p) => acc + (p.quantity ?? p.current_stock ?? 0), 0)
    const totalValue = list.reduce((acc, p) => {
      const qty = p.quantity ?? p.current_stock ?? 0
      const price = p.selling_price ?? p.price ?? 0
      return acc + qty * price
    }, 0)
    const lowStock = list
      .filter(p => {
        const qty = p.quantity ?? p.current_stock ?? 0
        const min = p.min_stock ?? p.min_quantity ?? 0
        return min > 0 && qty <= min
      })
      .map(p => ({
        name: p.name,
        quantity: p.quantity ?? p.current_stock ?? 0,
        minStock: p.min_stock ?? p.min_quantity ?? 0,
      }))
    const productsList = list.slice(0, 30).map(p => ({
      name: p.name,
      sku: p.sku,
      quantity: p.quantity ?? p.current_stock ?? 0,
      minStock: p.min_stock ?? p.min_quantity ?? 0,
      price: p.selling_price ?? p.price,
    }))

    return { totalProducts, totalItems, totalValue, lowStock, products: productsList }
  } catch (error) {
    return { totalProducts: 0, totalItems: 0, totalValue: 0, lowStock: [], products: [] }
  }
}
