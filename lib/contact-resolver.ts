/**
 * Resolve identidade do contato via WhatsApp (admin, técnico, engenheiro, aluno, cliente, lead)
 * Usado pelo webhook para a Catarina saber com quem está falando.
 */

import { supabaseAdmin } from '@/lib/supabase-admin'
import { getStudioNiche } from '@/lib/ai-router'
import type { NicheSlug } from '@/lib/ai-router'

export type ContactLayer = 'admin' | 'student' | 'lead' | 'technician' | 'engineer' | 'client'

export interface ResolvedContact {
  contact_layer: ContactLayer
  contact_type_label: string
  contact_name: string
  is_admin: boolean
  is_student: boolean
  studio_id: string
  /** ID do student quando contact_layer = student (para confirmação de aula) */
  student_id?: string
}

const LAYER_LABELS: Record<NicheSlug, Record<ContactLayer, string>> = {
  dance: {
    admin: 'Admin',
    student: 'Aluno',
    lead: 'Lead/Interessado',
    technician: 'Técnico',
    engineer: 'Engenheiro',
    client: 'Cliente',
  },
  fire_protection: {
    admin: 'Admin',
    student: 'Aluno',
    lead: 'Lead',
    technician: 'Técnico',
    engineer: 'Engenheiro',
    client: 'Cliente/Edificação',
  },
  agroflowai: {
    admin: 'Admin',
    student: 'Aluno',
    lead: 'Lead',
    technician: 'Técnico de Campo',
    engineer: 'Engenheiro',
    client: 'Cliente/Propriedade',
  },
}

/**
 * Resolve a identidade completa do contato pelo número de telefone.
 * Ordem de prioridade: admin > professional (technician/engineer) > student/client > lead > desconhecido (lead)
 */
export async function resolveContactFromWhatsApp(
  studioId: string,
  senderNumber: string,
  pushName?: string
): Promise<ResolvedContact> {
  const niche: NicheSlug = await getStudioNiche(studioId)
  const labels = LAYER_LABELS[niche]

  const emptyStudio = !studioId || studioId === '00000000-0000-0000-0000-000000000000'

  // 1. Admin (users_internal)
  let adminQuery = supabaseAdmin
    .from('users_internal')
    .select('studio_id, name')
    .eq('phone', senderNumber)
  if (!emptyStudio) adminQuery = adminQuery.eq('studio_id', studioId)
  const { data: adminUser } = await adminQuery.maybeSingle()

  if (adminUser) {
    const resolvedStudioId = adminUser.studio_id || studioId
    return {
      contact_layer: 'admin',
      contact_type_label: labels.admin,
      contact_name: pushName || adminUser.name || 'Admin',
      is_admin: true,
      is_student: false,
      studio_id: resolvedStudioId,
    }
  }

  const resolvedStudioId = studioId

  // 2. Professional (technician, engineer) - Fire/Agro (requer studioId válido)
  if (!emptyStudio && (niche === 'fire_protection' || niche === 'agroflowai')) {
    const { data: professional } = await supabaseAdmin
      .from('professionals')
      .select('id, name, professional_type')
      .eq('studio_id', studioId)
      .eq('status', 'active')
      .eq('phone', senderNumber)
      .maybeSingle()

    if (professional) {
      const layer: ContactLayer =
        professional.professional_type === 'engineer' ? 'engineer' : 'technician'
      return {
        contact_layer: layer,
        contact_type_label: labels[layer],
        contact_name: pushName || professional.name || labels[layer],
        is_admin: false,
        is_student: false,
        studio_id: studioId,
      }
    }
  }

  // 3. Student (Dance) ou Client (Fire/Agro - students = clientes/edificações)
  if (emptyStudio) {
    // Se studioId ainda desconhecido, buscar student em qualquer studio para obter studioId
    const { data: anyStudent } = await supabaseAdmin
      .from('students')
      .select('studio_id, name, id')
      .eq('phone', senderNumber)
      .maybeSingle()
    if (anyStudent) {
      const layer: ContactLayer = niche === 'dance' ? 'student' : 'client'
      return {
        contact_layer: layer,
        contact_type_label: labels[layer],
        contact_name: pushName || anyStudent.name || labels[layer],
        is_admin: false,
        is_student: niche === 'dance',
        studio_id: anyStudent.studio_id,
        student_id: niche === 'dance' ? anyStudent.id : undefined,
      }
    }
  }

  const { data: studentUser } = await supabaseAdmin
    .from('students')
    .select('studio_id, name, id')
    .eq('phone', senderNumber)
    .eq('studio_id', resolvedStudioId)
    .maybeSingle()

  if (studentUser) {
    const layer: ContactLayer = niche === 'dance' ? 'student' : 'client'
    return {
      contact_layer: layer,
      contact_type_label: labels[layer],
      contact_name: pushName || studentUser.name || labels[layer],
      is_admin: false,
      is_student: niche === 'dance',
      studio_id: studentUser.studio_id || studioId,
      student_id: niche === 'dance' ? studentUser.id : undefined,
    }
  }

  // 4. Lead (já cadastrado)
  const { data: lead } = await supabaseAdmin
    .from('leads')
    .select('id, name')
    .eq('studio_id', studioId)
    .eq('phone', senderNumber)
    .maybeSingle()

  if (lead) {
    return {
      contact_layer: 'lead',
      contact_type_label: labels.lead,
      contact_name: pushName || lead.name || 'Lead',
      is_admin: false,
      is_student: false,
      studio_id: studioId,
    }
  }

  // 5. Número desconhecido = lead (novo)
  return {
    contact_layer: 'lead',
    contact_type_label: labels.lead,
    contact_name: pushName || 'Cliente',
    is_admin: false,
    is_student: false,
    studio_id: studioId,
  }
}
