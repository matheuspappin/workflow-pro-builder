/**
 * Mapeamento centralizado de niche para rotas de cada portal/verticalização.
 * Usado em fluxos genéricos (ex: /s/[slug]/login) para redirecionar corretamente.
 */

export const NICHE_TO_VERTICALIZATION: Record<string, string> = {
  fire_protection: 'fire-protection',
  environmental_compliance: 'agroflowai',
  agroflowai: 'agroflowai',
  dance: 'estudio-de-danca',
}

export type VerticalizationSlug = 'fire-protection' | 'agroflowai' | 'estudio-de-danca'

export interface PortalRoutes {
  baseUrl: string
  loginUrl: string
  dashboardUrl: string
  clientUrl: string
  registerUrl: string
}

const ROUTES_BY_SLUG: Record<VerticalizationSlug, PortalRoutes> = {
  'fire-protection': {
    baseUrl: '/solutions/fire-protection',
    loginUrl: '/solutions/fire-protection/login',
    registerUrl: '/solutions/fire-protection/register',
    dashboardUrl: '/solutions/fire-protection/dashboard',
    clientUrl: '/solutions/fire-protection/client',
  },
  agroflowai: {
    baseUrl: '/solutions/agroflowai',
    loginUrl: '/solutions/agroflowai/login',
    registerUrl: '/solutions/agroflowai/register',
    dashboardUrl: '/solutions/agroflowai/dashboard',
    clientUrl: '/solutions/agroflowai/client',
  },
  'estudio-de-danca': {
    baseUrl: '/solutions/estudio-de-danca',
    loginUrl: '/solutions/estudio-de-danca/login',
    registerUrl: '/solutions/estudio-de-danca/register',
    dashboardUrl: '/solutions/estudio-de-danca/dashboard',
    clientUrl: '/solutions/estudio-de-danca/student',
  },
}

/**
 * Retorna as rotas do portal para um nicho.
 * Fallback para fire-protection se o nicho não for mapeado.
 */
export function getPortalRoutes(niche: string | null | undefined): PortalRoutes {
  const slug = (niche && NICHE_TO_VERTICALIZATION[niche]) || 'fire-protection'
  return ROUTES_BY_SLUG[slug as VerticalizationSlug] ?? ROUTES_BY_SLUG['fire-protection']
}

/**
 * Retorna o slug da verticalização para um nicho.
 */
export function getVerticalizationSlug(niche: string | null | undefined): string {
  return (niche && NICHE_TO_VERTICALIZATION[niche]) || 'fire-protection'
}

/**
 * Retorna a URL de login apropriada para o nicho.
 * Verticais (fire_protection, dance, environmental_compliance) → login da vertical.
 * Nichos genéricos ou não mapeados → /login (genérico).
 */
export function getLoginUrlForNiche(niche: string | null | undefined): string {
  const slug = niche && NICHE_TO_VERTICALIZATION[niche]
  if (!slug) return '/login'
  return ROUTES_BY_SLUG[slug as VerticalizationSlug]?.loginUrl ?? '/login'
}
