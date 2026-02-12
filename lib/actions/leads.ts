"use server"

import { supabase } from '@/lib/supabase'
import { guardModule } from '@/lib/modules-server'

export interface Lead {
  id: string
  name: string
  email?: string
  phone?: string
  source?: string
  stage: 'new' | 'contacted' | 'trial_scheduled' | 'trial_done' | 'negotiating' | 'won' | 'lost'
  status: 'active' | 'archived'
  interest_level: number
  notes?: string
  last_contact_date?: string
  created_at: string
}

export async function getLeads(studioId: string) {
  await guardModule('leads')
  if (!studioId) return []

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('studio_id', studioId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar leads:', error)
    return []
  }

  return data as Lead[]
}

export async function createLead(leadData: Partial<Lead>, studioId: string) {
  await guardModule('leads')
  if (!studioId) throw new Error('Studio ID obrigatório')

  const { data, error } = await supabase
    .from('leads')
    .insert({
      ...leadData,
      studio_id: studioId,
      stage: 'new',
      status: 'active'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateLeadStage(leadId: string, stage: string, studioId: string) {
  await guardModule('leads')
  const { data, error } = await supabase
    .from('leads')
    .update({ stage, last_contact_date: new Date().toISOString() })
    .eq('id', leadId)
    .eq('studio_id', studioId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateLead(leadId: string, updates: Partial<Lead>, studioId: string) {
  await guardModule('leads')
  const { data, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', leadId)
    .eq('studio_id', studioId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function convertLeadToStudent(leadId: string, studioId: string) {
  await guardModule('leads')
  // 1. Buscar o lead
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()

  if (!lead) throw new Error('Lead não encontrado')

  // 2. Criar aluno (na tabela students)
  // Nota: Isso é simplificado. Idealmente criaria um usuário Auth se tiver email, 
  // mas aqui vamos criar apenas o registro de aluno.
  const { data: student, error: studentError } = await supabase
    .from('students')
    .insert({
      studio_id: studioId,
      name: lead.name,
      email: lead.email || `lead-${lead.id}@temp.com`, // Email temporário se não tiver
      phone: lead.phone,
      status: 'active',
      enrollment_date: new Date().toISOString()
    })
    .select()
    .single()

  if (studentError) throw studentError

  // 3. Atualizar lead para 'won' (ganho)
  await updateLeadStage(leadId, 'won', studioId)

  return student
}
