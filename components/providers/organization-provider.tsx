"use client"

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { nicheDictionary, NicheType, VocabularyType } from '@/config/niche-dictionary'
import { ModuleKey, normalizeModules, MODULE_DEFINITIONS } from '@/config/modules'
import { supabase } from '@/lib/supabase'
import { translations, TranslationType } from '@/config/translations'
import logger from '@/lib/logger';

interface OrganizationState {
  niche: NicheType
  vocabulary: VocabularyType
  enabledModules: Record<ModuleKey, boolean>
  isLoading: boolean
  studioId: string | null
  studios: any[]
  businessModel: 'CREDIT' | 'MONETARY'
  switchStudio: (id: string) => Promise<void>
  language: 'pt' | 'en'
  setLanguage: (lang: 'pt' | 'en') => void
  refresh: () => Promise<void>
  t: TranslationType
}

const defaultState: OrganizationState = {
  niche: 'dance',
  vocabulary: nicheDictionary.pt.dance,
  enabledModules: normalizeModules({}),
  isLoading: true,
  studioId: null,
  studios: [],
  businessModel: 'CREDIT',
  switchStudio: async () => {},
  language: 'pt',
  setLanguage: () => {},
  refresh: async () => {},
  t: translations.pt
}

const OrganizationContext = createContext<OrganizationState>(defaultState)

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<OrganizationState, 'refresh' | 'setLanguage' | 'switchStudio'>>(() => {
    // Inicialização sempre em 'pt' para evitar Hydration Mismatch
    // O idioma real será carregado no useEffect
    return {
      ...defaultState,
      language: 'pt',
      vocabulary: nicheDictionary.pt.dance,
      t: translations.pt,
      isLoading: true
    }
  })

  // Carregar idioma do localStorage apenas após montar (evita hydration mismatch)
  useEffect(() => {
    // Verificação adicional de client-side para evitar SSR issues
    if (typeof window === 'undefined') return
    
    const savedLang = localStorage.getItem('workflow_pro_lang') as 'pt' | 'en'
    if (savedLang && (savedLang === 'pt' || savedLang === 'en') && savedLang !== 'pt') {
      setState(prev => ({
        ...prev,
        language: savedLang,
        vocabulary: nicheDictionary[savedLang].dance as VocabularyType,
        t: translations[savedLang] as unknown as TranslationType
      }))
    }
  }, [])

  // Sincronizar idioma com localStorage se mudar externamente (opcional, mas bom ter)
  useEffect(() => {
    const isClient = typeof window !== 'undefined'
    if (!isClient) return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'workflow_pro_lang' && e.newValue) {
        const newLang = e.newValue as 'pt' | 'en'
        if (newLang === 'pt' || newLang === 'en') {
          setState(prev => ({ 
            ...prev, 
            language: newLang,
            t: translations[newLang] as unknown as TranslationType
          }))
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const setLanguage = useCallback(async (lang: 'pt' | 'en') => {
    localStorage.setItem('workflow_pro_lang', lang)
    setState(prev => ({ 
      ...prev, 
      language: lang,
      t: translations[lang] as unknown as TranslationType
    }))

    // Tenta atualizar no Supabase se o usuário estiver logado
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            await supabase.auth.updateUser({
                data: { language: lang }
            })
        }
    } catch (error) {
        console.error('Erro ao salvar idioma no perfil:', error)
    }
  }, [])

  const switchStudio = useCallback(async (id: string) => {
    localStorage.setItem('workflow_pro_active_studio', id)
    // Forçar recarregamento das configurações
    window.location.reload()
  }, [])

  const loadSettings = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      
      // Detecção de nicho via URL (Bubble context)
      const isFirePath = typeof window !== 'undefined' && (
        window.location.pathname.includes('fire-protection') || 
        window.location.pathname.startsWith('/technician') ||
        window.location.pathname.startsWith('/engineer')
      )
      
      const urlNiche = isFirePath ? 'fire_protection' : null

      if (!user) {
        setState(prev => ({
          ...defaultState,
          niche: urlNiche || prev.niche || 'dance',
          vocabulary: (urlNiche ? nicheDictionary[prev.language || 'pt'][urlNiche] : defaultState.vocabulary) as VocabularyType,
          language: prev.language,
          t: translations[prev.language || 'pt'] as unknown as TranslationType,
          isLoading: false
        }))
        return
      }

      // 0. Super Admin Bypass
      const isSuperAdmin = user.user_metadata?.role === 'super_admin'

      // PARALLEL FETCHING START
      // Iniciar buscas independentes em paralelo
      const studiosPromise = supabase
        .from('studios')
        .select('id, name, slug, business_model')
        .eq('owner_id', user.id);

      // Resolver studioId inicial
      let studioId: string | null = typeof window !== 'undefined' ? localStorage.getItem('workflow_pro_active_studio') : null;
      
      // Fallback para o nome antigo usado no registro se necessário
      if (!studioId && typeof window !== 'undefined') {
        const legacyUser = localStorage.getItem('danceflow_user');
        if (legacyUser) {
          try {
            const parsed = JSON.parse(legacyUser);
            studioId = parsed.studio_id || parsed.studioId;
          } catch (e) {
            // ignore json error
          }
        }
      }
      
      // Se não houver no localStorage, tenta os metadados
      if (!studioId) {
        studioId = user.user_metadata?.studio_id || null;
      }

      // Gestão de idioma
      const savedLang = typeof window !== 'undefined' ? localStorage.getItem('workflow_pro_lang') as 'pt' | 'en' : 'pt'
      const metadataLang = user.user_metadata?.language as 'pt' | 'en'
      const validLang = (metadataLang === 'pt' || metadataLang === 'en') ? metadataLang : 
                        ((savedLang === 'pt' || savedLang === 'en') ? savedLang : 'pt')
      
      if (metadataLang && metadataLang !== state.language) {
          localStorage.setItem('workflow_pro_lang', metadataLang)
      }

      // Aguardar studios
      const { data: userStudios } = await studiosPromise
      const studios = userStudios || []

      // Se ainda não houver studioId, e o usuário for dono, pega o primeiro
      if (!studioId && studios.length > 0) {
        studioId = studios[0].id;
      }
      
      // Se ainda não encontrou, busca nas tabelas de roles em PARALELO
      if (!studioId) {
        const [internalResult, teacherResult, studentResult] = await Promise.all([
          supabase.from('users_internal').select('studio_id').eq('id', user.id).maybeSingle(),
          supabase.from('teachers').select('studio_id').eq('user_id', user.id).maybeSingle(),
          supabase.from('students').select('studio_id').eq('id', user.id).maybeSingle()
        ]);

        if (internalResult.data?.studio_id) {
          studioId = internalResult.data.studio_id;
        } else if (teacherResult.data?.studio_id) {
          studioId = teacherResult.data.studio_id;
        } else if (studentResult.data?.studio_id) {
          studioId = studentResult.data.studio_id;
        }
      }

      if (!studioId) {
        if (isSuperAdmin) {
            logger.info('👑 Super Admin sem estúdio vinculado. Carregando modo global...');
        } else {
            logger.warn('⚠️ [OrganizationProvider] Usuário sem studio_id vinculado.');
        }
        
        setState(prev => ({ ...prev, isLoading: false, studioId: null, studios: studios }))
        
        if (!isSuperAdmin) return;
      }

      // 3. Buscar configurações e modelo de negócio
      // Se tivermos studioId, podemos buscar settings e business model em paralelo (se necessário)
      let orgSettings = null;
      let businessModel: 'CREDIT' | 'MONETARY' = 'CREDIT';

      if (studioId) {
          const settingsPromise = supabase
            .from('organization_settings')
            .select('*')
            .eq('studio_id', studioId)
            .maybeSingle();

          // Verificar business model
          let businessModelPromise: Promise<any> | null = null;
          const activeStudio = studios.find(s => s.id === studioId);
          
          if (activeStudio?.business_model) {
            businessModel = activeStudio.business_model as 'CREDIT' | 'MONETARY';
          } else {
            // Busca apenas se não achou no array local
            businessModelPromise = supabase
              .from('studios')
              .select('business_model')
              .eq('id', studioId)
              .maybeSingle()
              .then((r) => r) as Promise<{ data: { business_model?: string } | null }>;
          }

          const [settingsResult, businessModelResult] = await Promise.all([
            settingsPromise,
            businessModelPromise ?? Promise.resolve({ data: null })
          ]);

          orgSettings = settingsResult.data;
          
          if (businessModelResult?.data?.business_model) {
            businessModel = businessModelResult.data.business_model as 'CREDIT' | 'MONETARY';
          }
      }

      const nicheKey = (orgSettings?.niche as NicheType) || 'dance'
      
      const currentLang = validLang
      const dictionary = nicheDictionary[currentLang] || nicheDictionary.pt
      
      const vocabulary = dictionary[nicheKey] || orgSettings?.vocabulary || dictionary.dance
      
      let enabledModules = normalizeModules(orgSettings?.enabled_modules)
      
      setState(prev => ({
        ...prev,
        niche: nicheKey,
        vocabulary: vocabulary as VocabularyType,
        t: translations[currentLang] as unknown as TranslationType,
        language: currentLang,
        enabledModules,
        isLoading: false,
        studioId: studioId,
        studios: studios,
        businessModel: businessModel
      }))

    } catch (error) {
      logger.error('❌ [OrganizationProvider] Erro fatal:', error)
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [setState, state.language])

  useEffect(() => {
    loadSettings()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadSettings()
      } else if (event === 'SIGNED_OUT') {
        setState(prev => ({ 
          ...defaultState, 
          language: prev.language, 
          t: translations[prev.language] as unknown as TranslationType,
          isLoading: false,
          businessModel: 'CREDIT'
        }))
        localStorage.removeItem('workflow_pro_active_studio')
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
    <OrganizationContext.Provider value={{ ...state, setLanguage, switchStudio, refresh: loadSettings }}>
      {children}
    </OrganizationContext.Provider>
  )
}

export const useOrganization = () => useContext(OrganizationContext)
