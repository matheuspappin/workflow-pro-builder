"use server"

import { supabase } from '@/lib/supabase'
import { guardModule } from '@/lib/modules-server'
import logger from '@/lib/logger'
import { getAdminClient } from '@/lib/server-utils'

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
    logger.error('Erro ao buscar leads:', error)
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

  let authUserId = null
  const studentEmail = lead.email || `lead-${lead.id}@temp.com`

  // 2. Criar ou Associar usuário Supabase Auth
  const adminClient = await getAdminClient()
  if (adminClient) {
    try {
      // 2.1 Verificar se já existe um usuário no Auth com este email
      const { data: userData, error: listError } = await adminClient.auth.admin.listUsers()
      const existingUser = userData?.users.find(u => u.email === studentEmail)

      if (existingUser) {
        authUserId = existingUser.id
        logger.info(`✅ Usuário Auth existente associado ao lead: ${authUserId}`)
      } else {
        // 2.2 Criar novo usuário Auth para o aluno
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email: studentEmail,
          password: Math.random().toString(36).slice(-10), // Senha aleatória inicial
          email_confirm: true,
          user_metadata: { 
            name: lead.name,
            studio_id: studioId,
            role: 'student'
          }
        })

        if (createError) {
          logger.error('❌ Erro ao criar usuário Auth para o lead:', createError)
        } else if (newUser?.user) {
          authUserId = newUser.user.id
          logger.info(`✨ Novo usuário Auth criado para lead convertido: ${authUserId}`)
        }
      }
    } catch (e) {
      logger.error('💥 Exceção ao gerenciar Auth para lead:', e)
    }
  }

  // 3. Criar aluno (na tabela students)
  const studentPayload: any = {
    studio_id: studioId,
    name: lead.name,
    email: studentEmail,
    phone: lead.phone,
    status: 'active',
    enrollment_date: new Date().toISOString().split('T')[0] // Formato DATE YYYY-MM-DD
  }

  // Se conseguimos um ID de usuário Auth, usamos ele como ID do aluno
  if (authUserId) {
    studentPayload.id = authUserId
  }

  const { data: student, error: studentError } = await supabase
    .from('students')
    .insert(studentPayload)
    .select()
    .single()

  if (studentError) {
    logger.error('❌ Erro ao inserir registro na tabela students:', studentError)
    throw new Error(`Falha ao criar registro de aluno: ${studentError.message}`)
  }

  // 4. Atualizar lead para 'won' (ganho)
  await updateLeadStage(leadId, 'won', studioId)

  return student
}
