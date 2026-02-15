"use client"

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { nicheDictionary, NicheType, VocabularyType } from '@/config/niche-dictionary'
import { ModuleKey, normalizeModules, MODULE_DEFINITIONS } from '@/config/modules'
import { supabase } from '@/lib/supabase'
import logger from '@/lib/logger';

interface OrganizationState {
  niche: NicheType
  vocabulary: VocabularyType
  enabledModules: Record<ModuleKey, boolean>
  isLoading: boolean
  studioId: string | null
  language: 'pt' | 'en'
  setLanguage: (lang: 'pt' | 'en') => void
  refresh: () => Promise<void>
}

const defaultState: OrganizationState = {
  niche: 'dance',
  vocabulary: nicheDictionary.pt.dance,
  enabledModules: normalizeModules({}),
  isLoading: true,
  studioId: null,
  language: 'pt',
  setLanguage: () => {},
  refresh: async () => {}
}

const OrganizationContext = createContext<OrganizationState>(defaultState)

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<OrganizationState, 'refresh' | 'setLanguage'>>({
    ...defaultState,
    language: 'pt'
  })

  useEffect(() => {
    const savedLang = localStorage.getItem('workflow_pro_lang') as 'pt' | 'en'
    if (savedLang && (savedLang === 'pt' || savedLang === 'en')) {
      setState(prev => ({ ...prev, language: savedLang }))
    }
  }, [])

  const setLanguage = useCallback((lang: 'pt' | 'en') => {
    localStorage.setItem('workflow_pro_lang', lang)
    setState(prev => ({ ...prev, language: lang }))
  }, [])

  const loadSettings = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      
      if (!user) {
        setState(prev => ({ ...defaultState, isLoading: false }))
        return
      }

      // 0. Super Admin Bypass
      const isSuperAdmin = user.user_metadata?.role === 'super_admin'

      // 1. Tentar obter studio_id
      let studioId: string | null = user.user_metadata?.studio_id || null; // Priorizar metadados do Auth
      
      if (!studioId) { // Se não encontrou nos metadados, tenta as consultas ao banco

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
    }

      if (!studioId) {
        // Se for super admin e não tiver studio, tenta pegar o primeiro studio ou cria contexto global
        if (isSuperAdmin) {
            logger.info('👑 Super Admin sem estúdio vinculado. Carregando modo global...');
             // Lógica especial ou apenas continua sem studioId
        } else {
            logger.warn('⚠️ [OrganizationProvider] Usuário sem studio_id vinculado.');
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
      const vocabulary = nicheDictionary[state.language][nicheKey] || nicheDictionary[state.language].dance
      
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
      logger.error('❌ [OrganizationProvider] Erro fatal:', error)
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [setState])

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
             logger.info('🔄 Configurações atualizadas em tempo real!')
             loadSettings()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [state.studioId, loadSettings])

  return (
    <OrganizationContext.Provider value={{ ...state, setLanguage, refresh: loadSettings }}>
      {children}
    </OrganizationContext.Provider>
  )
}

export const useOrganization = () => useContext(OrganizationContext)
