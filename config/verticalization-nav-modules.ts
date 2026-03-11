/**
 * Módulos inclusos por verticalização — baseados EXCLUSIVAMENTE no nav de cada vertical.
 * Cada vertical tem seu próprio conjunto de módulos; não misturar entre nichos distintos.
 *
 * Fire Control: OS, vistorias, clientes/edificações, técnicos, estoque de extintores, etc.
 * DanceFlow: turmas, alunos, professores, gamificação, scanner de presença, etc.
 */

import type { ModuleKey } from "./modules"
import { MODULE_DEFINITIONS } from "./modules"

/** Módulos que aparecem no nav do Fire Control (fire-protection) */
export const FIRE_PROTECTION_MODULE_KEYS: ModuleKey[] = [
  "dashboard",
  "students",        // Clientes / Edificações
  "service_orders", // Ordens de Serviço, Vistorias
  "inventory",      // Extintores
  "financial",
  "pos",            // PDV — Vendas
  "fiscal",         // Emissor Fiscal NF-e
  "leads",
  "whatsapp",
  "ai_chat",
]

/** Módulos que aparecem no nav do DanceFlow (estudio-de-danca) — config/dance-studio-nav.ts */
export const DANCE_STUDIO_MODULE_KEYS: ModuleKey[] = [
  "dashboard",
  "students",       // Alunos
  "classes",        // Turmas, Professores, Pagamentos Professores
  "scanner",        // Scanner QR
  "financial",
  "pos",            // PDV
  "fiscal",         // Emissor Fiscal NF-e
  "leads",
  "whatsapp",
  "ai_chat",
  "gamification",
  "erp",
  "inventory",
  "marketplace",
  "multi_unit",
]

/** Módulos que aparecem no nav do AgroFlow AI (agroflowai) */
export const AGROFLOWAI_MODULE_KEYS: ModuleKey[] = [
  "dashboard",
  "students",       // Clientes / Propriedades
  "service_orders", // Ordens de Serviço, Laudos
  "inventory",
  "financial",
  "fiscal",         // Emissor Fiscal NF-e
  "leads",
  "whatsapp",
  "ai_chat",
]

const SLUG_TO_MODULE_KEYS: Record<string, ModuleKey[]> = {
  "fire-protection": FIRE_PROTECTION_MODULE_KEYS,
  "estudio-de-danca": DANCE_STUDIO_MODULE_KEYS,
  "agroflowai": AGROFLOWAI_MODULE_KEYS,
}

/**
 * Retorna os módulos que podem ser configurados em planos para uma verticalização.
 * Baseado SOMENTE no nav daquela vertical — evita misturar módulos de nichos distintos.
 */
export function getModulesForVerticalization(slug: string): { key: ModuleKey; label: string }[] {
  const keys = SLUG_TO_MODULE_KEYS[slug]
  if (!keys) {
    // Fallback: vertical desconhecida usa todos os módulos (comportamento antigo)
    return (Object.keys(MODULE_DEFINITIONS) as ModuleKey[]).map((key) => ({
      key,
      label: MODULE_DEFINITIONS[key].label,
    }))
  }
  return keys.map((key) => ({
    key,
    label: MODULE_DEFINITIONS[key]?.label ?? key,
  }))
}

/**
 * Retorna apenas as chaves de módulo para uma vertical (para inicializar form.modules).
 */
export function getModuleKeysForVerticalization(slug: string): ModuleKey[] {
  const keys = SLUG_TO_MODULE_KEYS[slug]
  if (!keys) {
    return Object.keys(MODULE_DEFINITIONS) as ModuleKey[]
  }
  return keys
}
