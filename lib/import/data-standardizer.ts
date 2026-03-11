/**
 * Padronização de Dados para AKAAI CORE
 * Normaliza valores para o formato esperado pelo CRM antes da importação
 */

export interface StandardizationOptions {
  /** Padronizar telefones para formato brasileiro (XX) XXXXX-XXXX */
  standardizePhone?: boolean
  /** Padronizar emails (lowercase, trim) */
  standardizeEmail?: boolean
  /** Padronizar documentos CPF/CNPJ (apenas dígitos ou formato padrão) */
  standardizeDocument?: boolean
  /** Padronizar datas para ISO 8601 */
  standardizeDate?: boolean
  /** Padronizar nomes (capitalize, trim) */
  standardizeName?: boolean
  /** Remover espaços extras e caracteres inválidos */
  trimAll?: boolean
}

const DEFAULT_OPTIONS: StandardizationOptions = {
  standardizePhone: true,
  standardizeEmail: true,
  standardizeDocument: true,
  standardizeDate: true,
  standardizeName: true,
  trimAll: true,
}

/**
 * Padroniza um conjunto de dados para o formato AKAAI CORE
 */
export function standardizeData(
  data: Record<string, any>[],
  mapping: Record<string, string>,
  options: StandardizationOptions = {}
): Record<string, any>[] {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  return data.map((row) => {
    const result: Record<string, any> = { ...row }

    Object.entries(mapping).forEach(([targetField, sourceField]) => {
      const rawValue = row[sourceField]
      const fieldLower = targetField.toLowerCase()
      const value = opts.trimAll ? String(rawValue ?? '').trim() : String(rawValue ?? '')

      // Processar mesmo vazio para padronizar (preservar falta de dado como string vazia)
      if (rawValue === undefined || rawValue === null) {
        result[sourceField] = ''
        return
      }

      if (opts.standardizeEmail && (fieldLower.includes('email') || fieldLower === 'email')) {
        result[sourceField] = standardizeEmail(value)
        return
      }

      if (opts.standardizePhone && (fieldLower.includes('phone') || fieldLower.includes('telefone') || fieldLower === 'phone')) {
        result[sourceField] = standardizePhone(value)
        return
      }

      if (opts.standardizeDocument && (fieldLower.includes('document') || fieldLower.includes('cpf') || fieldLower.includes('cnpj'))) {
        result[sourceField] = standardizeDocument(value)
        return
      }

      if (opts.standardizeDate && (fieldLower.includes('date') || fieldLower.includes('data') || fieldLower.includes('birth') || fieldLower.includes('updated') || fieldLower.includes('atualiz'))) {
        result[sourceField] = standardizeDate(value)
        return
      }

      if (opts.standardizeName && (fieldLower.includes('name') || fieldLower.includes('nome') || fieldLower.includes('first_name') || fieldLower.includes('last_name'))) {
        result[sourceField] = standardizeName(value)
        return
      }

      if (fieldLower.includes('tags') || fieldLower.includes('etiqueta')) {
        result[sourceField] = value.split(/[,;|]/).map((s: string) => s.trim()).filter(Boolean).join(', ')
        return
      }

      if (opts.trimAll) {
        result[sourceField] = value.replace(/\s+/g, ' ').trim()
      }
    })

    return result
  })
}

/** Email: lowercase, trim, remove espaços. Tenta corrigir formatos comuns. */
function standardizeEmail(value: string): string {
  let v = value.toLowerCase().trim().replace(/\s+/g, '')
  // Corrigir @ duplicado ou espaços ao redor do @
  v = v.replace(/\s*@\s*/g, '@')
  // Se tem @ e domínio, considerar válido
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return v
  return v || ''
}

/** Telefone: extrai dígitos e formata (XX) XXXXX-XXXX. Aceita qualquer string com dígitos. */
function standardizePhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 0) return ''
  if (digits.length === 11 && digits.startsWith('0')) {
    // 0XXXXXXXXXX → (XX) XXXXX-XXXX
    return `(${digits.slice(1, 3)}) ${digits.slice(3, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return value.trim()
}

/** CPF/CNPJ: formata quando tem 11 ou 14 dígitos. Caso inválido, retorna vazio (não bloqueia importação). */
function standardizeDocument(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
  }
  if (digits.length === 14) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
  }
  return digits.length > 0 ? value.trim() : ''
}

/** Data: ISO 8601 (YYYY-MM-DD) */
function standardizeDate(value: string): string {
  if (!value || !value.trim()) return ''
  // DD/MM/YYYY ou DD-MM-YYYY
  const brMatch = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (brMatch) {
    const [, d, m, y] = brMatch
    const year = y.length === 2 ? (parseInt(y) < 50 ? 2000 + parseInt(y) : 1900 + parseInt(y)) : parseInt(y)
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  // YYYY-MM-DD
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) return value.slice(0, 10)
  // Tentar Date nativo
  const date = new Date(value)
  if (!isNaN(date.getTime())) {
    return date.toISOString().slice(0, 10)
  }
  return value.trim()
}

/** Nome: capitalize palavras, trim */
function standardizeName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => {
      if (word.length <= 2 && !/^[A-Za-z]+$/.test(word)) return word
      const lower = word.toLowerCase()
      const prepos = ['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'o', 'a', 'para', 'com']
      if (prepos.includes(lower)) return lower
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}
