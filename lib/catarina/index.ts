/**
 * Catarina - IA unificada de secretária virtual
 * Persona única adaptável a todos os nichos verticais (Dance, Fire Protection, AgroFlowAI)
 */

export { buildCatarinaSystemPrompt } from './system-prompt-builder'
export function getContextTimestamp(): string {
  const now = new Date()
  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  const day = dayNames[now.getDay()]
  const date = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${day}, ${date}, ${time}`
}
export type { CatarinaPromptParams } from './system-prompt-builder'
export { getNichePrompt, NICHE_PROMPTS } from './niche-prompts'
export type { NicheSlug, NichePromptConfig } from './niche-prompts'
export { SAFETY_RULES, getFallbackForUnknown } from './safety-rules'
