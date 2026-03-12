/**
 * Configuração de tema visual e conteúdo para landing pages de nichos genéricos.
 * Usado em /solutions/nichos/[nicho] e /s/[slug].
 */

import { nicheDictionary } from "./niche-dictionary"
export type NicheLandingTheme = {
  primaryColor: string
  gradientFrom: string
  gradientTo: string
  /** Nome do ícone (chave de ICON_BY_NICHE) — resolvido no client */
  iconName: string
  heroBadge?: string
  features: { title: string; description: string }[]
}

const COLOR_PALETTES: Array<{ primary: string; from: string; to: string }> = [
  { primary: "violet", from: "from-violet-500", to: "to-pink-500" },
  { primary: "blue", from: "from-blue-500", to: "to-cyan-500" },
  { primary: "emerald", from: "from-emerald-500", to: "to-teal-500" },
  { primary: "rose", from: "from-rose-500", to: "to-pink-500" },
  { primary: "amber", from: "from-amber-500", to: "to-orange-500" },
  { primary: "indigo", from: "from-indigo-500", to: "to-violet-500" },
  { primary: "teal", from: "from-teal-500", to: "to-emerald-500" },
  { primary: "fuchsia", from: "from-fuchsia-500", to: "to-pink-500" },
]

/** Mapeamento nicho -> nome do ícone (serializável para Client Components) */
const NICHE_TO_ICON_NAME: Record<string, string> = {
  dance: "Music",
  dentist: "Stethoscope",
  gym: "Dumbbell",
  clinic: "Building2",
  beauty: "Sparkles",
  aesthetics: "Sparkles",
  pilates: "Activity",
  yoga: "Activity",
  barber: "Scissors",
  spa: "Leaf",
  physio: "Activity",
  nutrition: "UtensilsCrossed",
  podiatry: "Stethoscope",
  pet_shop: "PawPrint",
  vet: "Stethoscope",
  dog_daycare: "PawPrint",
  martial_arts: "Dumbbell",
  crossfit: "Dumbbell",
  swim_school: "Activity",
  personal: "Dumbbell",
  music_school: "Music",
  language_school: "BookOpen",
  art_studio: "Palette",
  cooking_school: "UtensilsCrossed",
  photography: "Camera",
  mechanic: "Wrench",
  car_wash: "Car",
  law: "Briefcase",
  psychology: "Stethoscope",
  tattoo: "Palette",
  barista: "Coffee",
  brewery: "Wine",
}

function getColorForNiche(niche: string): (typeof COLOR_PALETTES)[0] {
  const hash = niche.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  return COLOR_PALETTES[hash % COLOR_PALETTES.length] ?? COLOR_PALETTES[0]
}

function getIconNameForNiche(niche: string): string {
  return NICHE_TO_ICON_NAME[niche] ?? "Building2"
}

function getGenericFeatures(vocab: { client: string; provider: string; service: string; establishment: string }) {
  return [
    {
      title: `Cadastro de ${vocab.client}s`,
      description: `Gerencie todos os ${vocab.client}s em um só lugar, com histórico completo.`,
    },
    {
      title: `Agenda de ${vocab.provider}s`,
      description: `Organize a agenda e evite conflitos de horário.`,
    },
    {
      title: `Controle de ${vocab.service}s`,
      description: `Registre e acompanhe cada ${vocab.service} realizada.`,
    },
    {
      title: "Financeiro integrado",
      description: "Cobranças, fluxo de caixa e relatórios em tempo real.",
    },
  ]
}

/**
 * Retorna o tema de landing para um nicho.
 * Nichos com verticalização (dance, fire_protection, etc.) redirecionam — use apenas para genéricos.
 */
export function getThemeForNiche(niche: string): NicheLandingTheme {
  const dict = (nicheDictionary.pt as Record<string, { client: string; provider: string; service: string; establishment: string }>)[niche]
  const vocab = dict ?? {
    client: "Cliente",
    provider: "Profissional",
    service: "Serviço",
    establishment: "Estabelecimento",
  }
  const colors = getColorForNiche(niche)
  const iconName = getIconNameForNiche(niche)

  return {
    primaryColor: colors.primary,
    gradientFrom: colors.from,
    gradientTo: colors.to,
    iconName,
    heroBadge: "14 dias grátis · Sem cartão de crédito",
    features: getGenericFeatures(vocab),
  }
}

/**
 * Nichos que têm verticalização própria — redirecionar para a landing da vertical.
 */
export const VERTICALIZATION_NICHES = ["fire_protection", "environmental_compliance", "agroflowai", "dance"] as const

export function isVerticalizationNiche(niche: string): boolean {
  return VERTICALIZATION_NICHES.includes(niche as typeof VERTICALIZATION_NICHES[number])
}

/**
 * URL da landing da verticalização (para redirecionamento).
 */
export const VERTICALIZATION_LANDING_URL: Record<string, string> = {
  fire_protection: "/solutions/fire-protection/landing",
  environmental_compliance: "/solutions/agroflowai",
  agroflowai: "/solutions/agroflowai",
  dance: "/solutions/estudio-de-danca",
}
