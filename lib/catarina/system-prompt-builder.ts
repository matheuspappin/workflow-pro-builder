/**
 * Construtor do System Prompt unificado para a Catarina
 * Persona única, adaptável por nicho e camada (admin/student/lead)
 */

import { getNichePrompt } from './niche-prompts'
import { SAFETY_RULES } from './safety-rules'
import { getLayerPromptInstruction } from '@/lib/ai-router'
import type { NicheSlug } from './niche-prompts'

export interface CatarinaPromptParams {
  studioName: string
  niche: NicheSlug
  contextContent: string
  contactLayer: 'admin' | 'student' | 'lead' | 'technician' | 'engineer' | 'client'
  channel?: 'whatsapp' | 'chat'
  includeLeadDetection?: boolean
  /** Instruções extras (ex: tool-calling para Fire Protection) */
  customSuffix?: string
  /** Data/hora atual para contexto (ex: "Terça, 10/03/2026, 14:30") */
  contextTimestamp?: string
  /** Nome do contato (ex: do WhatsApp pushName) - injeta seção CONTATO ATUAL */
  contactName?: string
  /** Label do tipo (ex: "Aluno", "Lead", "Técnico") - injeta seção CONTATO ATUAL */
  contactTypeLabel?: string
}

/**
 * Monta o system prompt completo da Catarina
 */
export function buildCatarinaSystemPrompt(params: CatarinaPromptParams): string {
  const {
    studioName,
    niche,
    contextContent,
    contactLayer,
    channel = 'whatsapp',
    includeLeadDetection = true,
    customSuffix,
    contextTimestamp,
    contactName,
    contactTypeLabel,
  } = params

  const nicheConfig = getNichePrompt(niche, studioName)
  const layerInstruction = getLayerPromptInstruction(niche, contactLayer)

  const parts: string[] = []

  // 0. CONTATO ATUAL (quando fornecido - WhatsApp/contexto rico)
  if (contactName?.trim() || contactTypeLabel?.trim()) {
    parts.push(`CONTATO ATUAL:
- Nome: ${contactName?.trim() || 'Não informado'}
- Tipo: ${contactTypeLabel?.trim() || contactLayer}
- Permissões: ${layerInstruction}`)
  }

  // 1. IDENTIDADE
  parts.push(`Você é a Catarina, ${nicheConfig.identity} da "${studioName}".
Seu objetivo é ser educada, prestativa e eficiente no atendimento via ${channel === 'whatsapp' ? 'WhatsApp' : 'chat'}.

SAUDAÇÃO OBRIGATÓRIA (primeiro contato):
${nicheConfig.greeting}

ÁREAS DE FOCO:
${nicheConfig.focusAreas.map((a) => `- ${a}`).join('\n')}`)

  // 2. CONTEXTO TEMPORAL (se fornecido)
  if (contextTimestamp?.trim()) {
    parts.push(`
CONTEXTO TEMPORAL (use para "hoje", "agora", "esta semana", horários de funcionamento):
${contextTimestamp}`)
  }

  // 3. FONTE DA VERDADE
  parts.push(`
FONTE DA VERDADE (USE APENAS ESTES DADOS - NUNCA INVENTE):
${contextContent}`)

  // 4. REGRAS DE CAMADA (admin/student/lead)
  parts.push(`
CONDIÇÕES DE ATENDIMENTO (${contactLayer.toUpperCase()}):
${layerInstruction}`)

  // 5. DETECÇÃO DE LEADS (se aplicável)
  if (includeLeadDetection && nicheConfig.leadDetection && contactLayer === 'lead') {
    parts.push(nicheConfig.leadDetection)
  }

  // 6. REGRAS DE SEGURANÇA
  parts.push(`
${SAFETY_RULES}`)

  // 7. FORMATAÇÃO (WhatsApp/Chat)
  parts.push(`
FORMATAÇÃO:
- Responda de forma CURTA e OBJETIVA (máximo 3 parágrafos, 2-3 linhas quando possível).
- Para listas de opções: use bullets (-) ou números (1. 2. 3.)
- Para comparações (ex: planos vs planos): use tabela markdown quando fizer sentido.
- Parágrafos: 3-5 frases no máximo. Use **negrito** para termos importantes.
- Use emojis com moderação quando apropriado (💃✨🚀 para dança, 🔥 para fire, 🌱 para agro).`)

  if (customSuffix?.trim()) {
    parts.push(customSuffix.trim())
  }

  return parts.join('\n').trim()
}
