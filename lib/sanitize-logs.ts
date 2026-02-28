/**
 * Utilitários para evitar vazamento de dados sensíveis em logs.
 * Use em logger.info/warn em vez de expor emails, IDs ou tokens.
 */

/**
 * Mascara e-mail para log: joao@email.com → j***@***l.com
 */
export function maskEmail(email: string | undefined | null): string {
  if (!email || typeof email !== 'string') return '[sem email]'
  const [local, domain] = email.split('@')
  if (!domain) return '[email invalido]'
  const maskedLocal = local.length <= 2 ? '***' : `${local[0]}***`
  const maskedDomain = domain.length <= 2 ? '***' : `***${domain.slice(-4)}`
  return `${maskedLocal}@${maskedDomain}`
}

/**
 * Mascara ID para log: exibe apenas primeiros 8 chars + ...
 */
export function maskId(id: string | undefined | null): string {
  if (!id || typeof id !== 'string') return '[id]'
  if (id.length <= 8) return '***'
  return `${id.slice(0, 4)}...${id.slice(-4)}`
}

/**
 * Nunca loga códigos de verificação; use esta constante
 */
export const SENSITIVE_CODE = '[codigo-omitido]'
