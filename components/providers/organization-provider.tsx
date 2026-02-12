"use client"

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { nicheDictionary, NicheType, VocabularyType } from '@/config/niche-dictionary'
import { ModuleKey, normalizeModules, MODULE_DEFINITIONS } from '@/config/modules'
import { supabase } from '@/lib/supabase'

interface OrganizationState {
  niche: NicheType
  vocabulary: VocabularyType
  enabledModules: Record<ModuleKey, boolean>
  isLoading: boolean
  studioId: string | null
  refresh: () => Promise<void>
}

const defaultState: OrganizationState = {
  niche: 'dance',
  vocabulary: nicheDictionary.dance,
  enabledModules: normalizeModules({}),
  isLoading: true,
  studioId: null,
  refresh: async () => {}
}

const OrganizationContext = createContext<OrganizationState>(defaultState)

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<OrganizationState, 'refresh'>>(defaultState)

  const loadSettings = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      
      if (!user) {
        setState(prev => ({ ...defaultState, isLoading: false }))
        return
      }

      // 0. Super Admin Bypass
      const isSuperAdmin = user.email?.toLowerCase() === 'vendaslachef@gmail.com' || user.user_metadata?.role === 'super_admin'

      // 1. Tentar obter studio_id
      let studioId: string | null = null;

      // Tentativa A: Staff (users_internal) - Mais comum para admins
      const { data: internalProfile } = await supabase
        .from('users_internal')
        .select('studio_id')
        .eq('id', user.id)
        .maybeSingle()
      
      if (internalProfile?.studio_id) {
        studioId = internalProfile.studio_id;
      } else {
        // Tentativa B: Professor (teachers)
        const { data: teacherProfile } = await supabase
            .from('teachers')
            .select('studio_id')
            .eq('user_id', user.id)
            .maybeSingle()
          
        if (teacherProfile?.studio_id) {
            studioId = teacherProfile.studio_id
        } else {
            // Tentativa C: Aluno (students)
            const { data: studentProfile } = await supabase
              .from('students')
              .select('studio_id')
              .eq('id', user.id)
              .maybeSingle()
            
            if (studentProfile?.studio_id) studioId = studentProfile.studio_id
        }
      }

      if (!studioId) {
        // Se for super admin e não tiver studio, tenta pegar o primeiro studio ou cria contexto global
        if (isSuperAdmin) {
            console.log('👑 Super Admin sem estúdio vinculado. Carregando modo global...');
             // Lógica especial ou apenas continua sem studioId
        } else {
            console.warn('⚠️ [OrganizationProvider] Usuário sem studio_id vinculado.');
        }
        
        setState(prev => ({ ...prev, isLoading: false, studioId: studioId || null }))
        
        if (!isSuperAdmin) return;
      }

      // 2. Buscar configurações
      let orgSettings = null;
      if (studioId) {
          const { data } = await supabase
            .from('organization_settings')
            .select('*')
            .eq('studio_id', studioId)
            .maybeSingle()
          orgSettings = data;
      }

      const nicheKey = (orgSettings?.niche as NicheType) || 'dance'
      const vocabulary = nicheDictionary[nicheKey] || nicheDictionary.dance
      
      let enabledModules = normalizeModules(orgSettings?.enabled_modules)
      
      // Super Admin vê tudo ativado
      if (isSuperAdmin) {
           Object.keys(MODULE_DEFINITIONS).forEach(key => {
             // @ts-ignore
             enabledModules[key as ModuleKey] = true
           })
      }

      setState({
        niche: nicheKey,
        vocabulary,
        enabledModules,
        isLoading: false,
        studioId: studioId
      })

    } catch (error) {
      console.error('❌ [OrganizationProvider] Erro fatal:', error)
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  useEffect(() => {
    loadSettings()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadSettings()
      } else if (event === 'SIGNED_OUT') {
        setState({ ...defaultState, isLoading: false })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [loadSettings])

  // Realtime subscription separado para evitar recriar onAuthStateChange
  useEffect(() => {
    if (!state.studioId) return

    const channel = supabase.channel(`org_settings:${state.studioId}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'organization_settings',
          filter: `studio_id=eq.${state.studioId}` 
        },
        () => {
             console.log('🔄 Configurações atualizadas em tempo real!')
             loadSettings()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [state.studioId, loadSettings])

  return (
    <OrganizationContext.Provider value={{ ...state, refresh: loadSettings }}>
      {children}
    </OrganizationContext.Provider>
  )
}

export const useOrganization = () => useContext(OrganizationContext)
