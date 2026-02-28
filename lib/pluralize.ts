/**
 * Helper simples para pluralização em Português (PT-BR)
 * Focado nos termos utilizados no sistema de vocabulário.
 */
export function pluralize(word: string): string {
  if (!word) return ''

  // Se já terminar em 's', assume que já está no plural ou é invariável
  if (word.toLowerCase().endsWith('s')) return word

  // Casos especiais para termos compostos ou com plural irregular
  const specialPlurals: Record<string, string> = {
    'Vistoria/OS': 'Vistorias e OS',
    'vistoria/OS': 'vistorias e OS',
  }
  if (specialPlurals[word]) return specialPlurals[word]

  // Casos especiais de palavras em inglês/estrangeiras comuns no sistema
  const foreignWords: Record<string, string> = {
    'coach': 'coaches',
    'teacher': 'teachers',
    'workshop': 'workshops',
    'chef': 'chefs',
    'sommelier': 'sommeliers',
    'coworker': 'coworkers',
    'designer': 'designers',
    'personal': 'personais',
    'caretaker': 'caretakers',
    'wod': 'wods',
    'guardian': 'guardians',
    'parent/guardian': 'parents/guardians',
    'category': 'categories',
    'modality': 'modalities',
    'specialty': 'specialties',
    'property': 'properties',
    'activity': 'activities',
    'utility': 'utilities',
    'itinerary': 'itineraries',
    'agency': 'agencies',
    'professional': 'professionals',
    'patient': 'patients',
    'client': 'clients',
    'service': 'services',
    'establishment': 'establishments',
    'class': 'classes',
    'member': 'members'
  }

  if (foreignWords[word.toLowerCase()]) {
    return foreignWords[word.toLowerCase()]
  }

  // Regras básicas de Português
  
  // 1. Termina em 'm' -> 'ns' (ex: Massagem -> Massagens)
  if (word.endsWith('m')) {
    return word.slice(0, -1) + 'ns'
  }

  // 2. Termina em 'r', 'z' ou 'n' -> 'es' (ex: Professor -> Professores, Doutor -> Doutores)
  if (word.endsWith('r') || word.endsWith('z') || (word.endsWith('n') && !word.endsWith('on'))) {
    return word + 'es'
  }

  // 3. Termina em 'al', 'el', 'ol', 'ul' -> 'ais', 'eis', 'ois', 'uis' (ex: Profissional -> Profissionais)
  if (word.endsWith('al')) return word.slice(0, -2) + 'ais'
  if (word.endsWith('el')) return word.slice(0, -2) + 'eis'
  if (word.endsWith('ol')) return word.slice(0, -2) + 'ois'
  if (word.endsWith('ul')) return word.slice(0, -2) + 'uis'

  // 4. Termina em 'ão' -> 'ões' (Regra geral para substantivos de serviço/ação no sistema)
  // Ex: Sessão -> Sessões, Degustação -> Degustações
  if (word.endsWith('ão')) {
    return word.slice(0, -2) + 'ões'
  }

  // 5. Caso padrão: apenas adiciona 's'
  return word + 's'
}
