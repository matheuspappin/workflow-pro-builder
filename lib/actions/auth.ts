'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import logger from '@/lib/logger'

export async function getCompleteUserProfile(userId: string) {
  try {
    logger.info('[AUTH ACTION] Buscando perfil completo para:', userId)

    let user: any = null
    let profileTable = ''

    // 1. Tentar users_internal (Admin/Super Admin)
    const { data: adminProfile } = await supabaseAdmin
      .from('users_internal')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (adminProfile) {
      user = { ...adminProfile, role: adminProfile.role || 'admin' }
      profileTable = 'users_internal'
    }

    // 2. Tentar teachers
    if (!user) {
      const { data: teacherProfile } = await supabaseAdmin
        .from('teachers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (teacherProfile) {
        user = { ...teacherProfile, role: 'teacher' }
        profileTable = 'teachers'
      }
    }

    // 3. Tentar students
    if (!user) {
      const { data: studentProfile } = await supabaseAdmin
        .from('students')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (studentProfile) {
        user = { ...studentProfile, role: 'student' }
        profileTable = 'students'
      }
    }

    // 4. Tentar partners
    if (!user) {
      const { data: partnerProfile } = await supabaseAdmin
        .from('partners')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (partnerProfile) {
        user = { ...partnerProfile, role: 'partner' }
        profileTable = 'partners'
      }
    }

    if (!user) {
      logger.warn('[AUTH ACTION] Perfil não encontrado no banco para:', userId)
      return null
    }

    // Buscar dados do estúdio
    if (user.studio_id) {
      const { data: studioData } = await supabaseAdmin
        .from('studios')
        .select('name, slug, plan')
        .eq('id', user.studio_id)
        .maybeSingle()
      
      if (studioData) {
        user.studio = studioData
        user.studioName = studioData.name
        user.studioSlug = studioData.slug
        user.plan = studioData.plan
      }
    } else if (user.role === 'partner') {
        const { data: studiosData } = await supabaseAdmin
            .from('studios')
            .select('id, name, slug, plan')
            .eq('partner_id', user.id)
            .limit(1)
            .maybeSingle()
        
        if (studiosData) {
            user.studio_id = studiosData.id
            user.studioName = studiosData.name
            user.studioSlug = studiosData.slug
            user.plan = studiosData.plan
        }
    }

    // Normalização básica para o frontend
    return {
      id: userId,
      name: user.name,
      email: user.email,
      role: user.role,
      studio_id: user.studio_id,
      studioName: user.studioName || "Workflow Studio",
      studioSlug: user.studioSlug || "",
      plan: user.plan || "gratuito",
      taxId: user.cpf_cnpj || user.tax_id || null,
      phone: user.phone,
      birthDate: user.birth_date,
      address: user.address,
    }

  } catch (error) {
    logger.error('[AUTH ACTION] Erro ao buscar perfil completo:', error)
    return null
  }
}
