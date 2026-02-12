"use client"

import { useOrganization } from '@/components/providers/organization-provider'
import { pluralize } from '@/lib/pluralize'

/**
 * Hook legado refatorado para usar o OrganizationProvider central.
 * Mantém compatibilidade com o código que já usa useVocabulary.
 */
export function useVocabulary() {
  const { 
    vocabulary, 
    niche, 
    enabledModules, 
    isLoading 
  } = useOrganization()

  // Adiciona versões plurais automaticamente
  const pluralVocabulary = {
    ...vocabulary,
    clients: pluralize(vocabulary.client),
    providers: pluralize(vocabulary.provider),
    services: pluralize(vocabulary.service),
    establishments: pluralize(vocabulary.establishment)
  }

  return { 
    vocabulary: pluralVocabulary, 
    niche, 
    schemas: {}, // Removido por não ser mais usado centralmente
    enabledModules, 
    loading: isLoading 
  }
}
