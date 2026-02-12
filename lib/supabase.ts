import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'

if (!isBuildTime && typeof window !== 'undefined') {
  if (!supabaseUrl) {
    console.error('⚠️ Supabase URL não configurada. Configure NEXT_PUBLIC_SUPABASE_URL no arquivo .env')
  }

  if (!supabaseAnonKey) {
    console.error('⚠️ Supabase Anon Key não configurada. Configure NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env')
  }
}

// Cliente Singleton para compatibilidade com código legado (evitar em novos componentes)
// Em Client Components novos, prefira usar createBrowserClient diretamente ou um hook
export const supabase = typeof window !== 'undefined' 
  ? createBrowserClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : createSupabaseClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder')

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
      console.warn('Erro ao buscar students:', error.message)
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
      console.warn('Erro ao buscar teachers:', error.message)
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
