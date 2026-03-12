/**
 * Configuração centralizada de verticalizações (nichos).
 * Adicionar novos nichos aqui — o proxy.ts lê esta config automaticamente.
 */

export interface VerticalizationConfig {
  /** Identificador único do nicho */
  key: string
  /** Prefixo da rota base: /solutions/<basePath> */
  basePath: string
  /** Subdomínios que redirecionam para este nicho */
  subdomains: RegExp
  /** Rota de login do nicho */
  loginPath: string
  /** Rotas protegidas (relativas a /solutions/<basePath>) */
  protectedPaths: string[]
  /** Regras de redirecionamento por role dentro do nicho */
  roleRedirects: Record<string, string>
  /** Roles permitidas em cada sub-rota protegida */
  pathRoles: Record<string, string[]>
}

export const VERTICALIZATIONS: VerticalizationConfig[] = [
  {
    key: 'fire-protection',
    basePath: 'fire-protection',
    subdomains: /^(fire-protection|fireprotection|fire)\./i,
    loginPath: '/solutions/fire-protection/login',
    protectedPaths: ['dashboard', 'engineer', 'technician', 'client'],
    roleRedirects: {
      super_admin: '/admin',
      engineer: '/solutions/fire-protection/engineer',
      technician: '/solutions/fire-protection/technician',
      teacher: '/solutions/fire-protection/technician',
      student: '/solutions/fire-protection/client',
      seller: '/seller',
      finance: '/finance',
    },
    pathRoles: {
      engineer: ['engineer', 'super_admin'],
      technician: ['technician', 'teacher', 'super_admin'],
      client: ['student', 'super_admin'],
    },
  },
  {
    key: 'estudio-de-danca',
    basePath: 'estudio-de-danca',
    subdomains: /^(danceflow|studio-danca|danca)\./i,
    loginPath: '/solutions/estudio-de-danca/login',
    protectedPaths: ['dashboard', 'teacher', 'student'],
    roleRedirects: {
      super_admin: '/admin',
      student: '/solutions/estudio-de-danca/student',
      teacher: '/solutions/estudio-de-danca/teacher',
    },
    pathRoles: {
      teacher: ['teacher', 'super_admin'],
      student: ['student', 'super_admin'],
    },
  },
  {
    key: 'agroflowai',
    basePath: 'agroflowai',
    subdomains: /^(agroflow|agroflowai|agro)\./i,
    loginPath: '/solutions/agroflowai/login',
    protectedPaths: ['dashboard', 'client'],
    roleRedirects: {
      super_admin: '/admin',
      student: '/solutions/agroflowai/client',
      client: '/solutions/agroflowai/client',
    },
    pathRoles: {
      client: ['student', 'client', 'super_admin'],
    },
  },
]

/** Retorna a config de verticalização pelo prefixo de pathname */
export function getVerticalizationByPath(pathname: string): VerticalizationConfig | undefined {
  return VERTICALIZATIONS.find((v) =>
    pathname.startsWith(`/solutions/${v.basePath}`)
  )
}

/** Retorna a config de verticalização por hostname */
export function getVerticalizationByHostname(hostname: string): VerticalizationConfig | undefined {
  return VERTICALIZATIONS.find((v) => v.subdomains.test(hostname))
}

/** Retorna o redirect padrão de um role ao entrar em uma verticalização */
export function getRoleRedirect(v: VerticalizationConfig, role: string): string {
  return v.roleRedirects[role] ?? `/solutions/${v.basePath}/dashboard`
}

/** Verifica se um role tem permissão para uma sub-rota protegida */
export function roleCanAccessPath(v: VerticalizationConfig, subPath: string, role: string): boolean {
  const allowedRoles = v.pathRoles[subPath]
  if (!allowedRoles) return true // sub-rota sem restrição específica
  return allowedRoles.includes(role)
}
