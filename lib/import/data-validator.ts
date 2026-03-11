export interface ValidationRule {
  field: string
  type: 'required' | 'email' | 'phone' | 'cpf' | 'cnpj' | 'date' | 'number' | 'unique'
  message?: string
  custom?: (value: any) => boolean | string
}

export interface ValidationResult {
  isValid: boolean
  errors: Array<{
    row: number
    field: string
    value: any
    message: string
    severity: 'error' | 'warning'
  }>
  cleanedData: any[]
  statistics: {
    totalRows: number
    validRows: number
    errorRows: number
    warningRows: number
    duplicateRows: number
  }
}

// Algoritmo de validação de CPF com dígito verificador
function isValidCPF(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 11) return false
  // Rejeitar sequências repetidas (000...0, 111...1 etc)
  if (/^(\d)\1{10}$/.test(digits)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i)
  let check = (sum * 10) % 11
  if (check === 10 || check === 11) check = 0
  if (check !== parseInt(digits[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i)
  check = (sum * 10) % 11
  if (check === 10 || check === 11) check = 0
  return check === parseInt(digits[10])
}

// Algoritmo de validação de CNPJ com dígito verificador
function isValidCNPJ(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 14) return false
  if (/^(\d)\1{13}$/.test(digits)) return false
  const calcDigit = (d: string, weights: number[]) =>
    weights.reduce((acc, w, i) => acc + parseInt(d[i]) * w, 0)
  const mod = (n: number) => { const r = n % 11; return r < 2 ? 0 : 11 - r }
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  if (mod(calcDigit(digits, w1)) !== parseInt(digits[12])) return false
  if (mod(calcDigit(digits, w2)) !== parseInt(digits[13])) return false
  return true
}

export class DataValidator {
  private rules: ValidationRule[] = []
  private uniqueFields: Set<string> = new Set()
  private existingData: Set<string> = new Set()

  constructor(rules: ValidationRule[] = []) {
    this.rules = rules
    // Mapear campos que possuem regra 'unique'
    rules.forEach(r => {
      if (r.type === 'unique') this.uniqueFields.add(r.field)
    })
  }

  addRule(rule: ValidationRule): this {
    this.rules.push(rule)
    if (rule.type === 'unique') this.uniqueFields.add(rule.field)
    return this
  }

  setExistingData(data: string[]): this {
    this.existingData = new Set(data)
    return this
  }

  validate(data: any[]): ValidationResult {
    const errors: ValidationResult['errors'] = []
    const cleanedData: any[] = []
    const seenHashes = new Set<string>()
    // Para rastrear valores únicos por campo durante o próprio batch
    const seenFieldValues: Record<string, Set<string>> = {}
    this.uniqueFields.forEach(f => { seenFieldValues[f] = new Set() })

    data.forEach((row, index) => {
      const rowErrors: typeof errors = []
      const cleanedRow: Record<string, any> = {}

      // Detecção de linha duplicada (hash estável pela ordenação de chaves)
      const sortedRow = Object.keys(row).sort().reduce((acc: Record<string, any>, k) => {
        acc[k] = row[k]
        return acc
      }, {})
      const rowHash = JSON.stringify(sortedRow)
      if (seenHashes.has(rowHash)) {
        errors.push({
          row: index + 1,
          field: 'row',
          value: row,
          message: 'Linha duplicada no arquivo',
          severity: 'warning',
        })
        return
      }
      seenHashes.add(rowHash)

      Object.keys(row).forEach(field => {
        const value = row[field]
        const cleanedValue = this.cleanValue(value)
        cleanedRow[field] = cleanedValue

        // Aplicar regras de validação para este campo
        const fieldRules = this.rules.filter(rule => rule.field === field)
        fieldRules.forEach(rule => {
          const validation = this.validateField(cleanedValue, rule)
          if (validation !== true) {
            rowErrors.push({
              row: index + 1,
              field,
              value: cleanedValue,
              message: typeof validation === 'string' ? validation : rule.message || `Campo ${field} inválido`,
              severity: 'error',
            })
          }

          // Verificação de unicidade apenas para campos com regra 'unique'
          if (rule.type === 'unique' && cleanedValue) {
            if (this.existingData.has(cleanedValue)) {
              rowErrors.push({
                row: index + 1,
                field,
                value: cleanedValue,
                message: `Valor '${cleanedValue}' já existe no sistema`,
                severity: 'error',
              })
            } else if (seenFieldValues[field]?.has(cleanedValue)) {
              rowErrors.push({
                row: index + 1,
                field,
                value: cleanedValue,
                message: `Valor '${cleanedValue}' duplicado neste arquivo`,
                severity: 'warning',
              })
            } else {
              seenFieldValues[field]?.add(cleanedValue)
            }
          }
        })
      })

      const hasErrors = rowErrors.some(e => e.severity === 'error')
      if (!hasErrors) cleanedData.push(cleanedRow)
      errors.push(...rowErrors)
    })

    const errorRows = new Set(errors.filter(e => e.severity === 'error').map(e => e.row)).size
    const warningRows = new Set(errors.filter(e => e.severity === 'warning').map(e => e.row)).size
    const duplicateRows = data.length - seenHashes.size

    return {
      isValid: errorRows === 0,
      errors,
      cleanedData,
      statistics: {
        totalRows: data.length,
        validRows: cleanedData.length,
        errorRows,
        warningRows,
        duplicateRows,
      },
    }
  }

  private validateField(value: any, rule: ValidationRule): true | string {
    const stringValue = String(value ?? '').trim()

    switch (rule.type) {
      case 'required':
        if (!stringValue) return rule.message || 'Campo obrigatório'
        break

      case 'email': {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (stringValue && !emailRegex.test(stringValue)) {
          return rule.message || 'Email inválido'
        }
        break
      }

      case 'phone': {
        const phoneRegex = /^[\d\s\-\(\)\+]{10,}$/
        if (stringValue && !phoneRegex.test(stringValue)) {
          return rule.message || 'Telefone inválido'
        }
        break
      }

      case 'cpf':
        if (stringValue && !isValidCPF(stringValue)) {
          return rule.message || 'CPF inválido'
        }
        break

      case 'cnpj':
        if (stringValue && !isValidCNPJ(stringValue)) {
          return rule.message || 'CNPJ inválido'
        }
        break

      case 'date': {
        if (stringValue) {
          const date = new Date(stringValue)
          if (isNaN(date.getTime())) return rule.message || 'Data inválida'
        }
        break
      }

      case 'number': {
        if (stringValue) {
          // Normalizar formato brasileiro: "1.500,00" → "1500.00"
          const normalized = stringValue.replace(/\./g, '').replace(',', '.')
          if (isNaN(parseFloat(normalized))) return rule.message || 'Número inválido'
        }
        break
      }

      case 'unique':
        // Validado no método validate() por campo — não aqui
        break
    }

    if (rule.custom) {
      const customResult = rule.custom(stringValue)
      if (customResult !== true) {
        return typeof customResult === 'string' ? customResult : rule.message || 'Validação falhou'
      }
    }

    return true
  }

  // Limpar valor preservando caracteres essenciais para dados brasileiros
  private cleanValue(value: any): string {
    if (value === null || value === undefined) return ''
    const stringValue = String(value).trim()

    return stringValue
      .replace(/\s+/g, ' ')   // múltiplos espaços → espaço único
      .trim()
    // NÃO remover acentos, /, (, ), + — são necessários para nomes brasileiros,
    // datas (01/01/2024), CNPJ (12.345.678/0001-90) e telefones (+55 11...)
  }
}

// Utilitário para normalizar valores numéricos no formato brasileiro
export function parseBrazilianNumber(value: string): number {
  if (!value || typeof value !== 'string') return NaN
  // Remove separadores de milhar e converte vírgula decimal
  const normalized = value.replace(/[^\d,.-]/g, '').replace(/\.(?=.*,)/g, '').replace(',', '.')
  return parseFloat(normalized)
}

// Funções utilitárias de validação específica
export const ValidationRules = {
  student: [
    { field: 'name', type: 'required' as const, message: 'Nome é obrigatório' },
    { field: 'email', type: 'email' as const, message: 'Email inválido' },
    { field: 'phone', type: 'phone' as const, message: 'Telefone inválido' },
    { field: 'document', type: 'cpf' as const, message: 'CPF inválido' },
    { field: 'birth_date', type: 'date' as const, message: 'Data de nascimento inválida' },
  ],

  payment: [
    { field: 'amount', type: 'required' as const, message: 'Valor é obrigatório' },
    { field: 'amount', type: 'number' as const, message: 'Valor deve ser numérico' },
    { field: 'due_date', type: 'required' as const, message: 'Data de vencimento é obrigatória' },
    { field: 'due_date', type: 'date' as const, message: 'Data de vencimento inválida' },
  ],

  product: [
    { field: 'name', type: 'required' as const, message: 'Nome é obrigatório' },
    { field: 'price', type: 'number' as const, message: 'Preço deve ser numérico' },
    { field: 'stock', type: 'number' as const, message: 'Estoque deve ser numérico' },
  ],

  service: [
    { field: 'name', type: 'required' as const, message: 'Nome é obrigatório' },
    { field: 'price', type: 'number' as const, message: 'Preço deve ser numérico' },
    { field: 'duration', type: 'number' as const, message: 'Duração deve ser numérica' },
  ],
}

export function createValidator(importType: string, existingEmails: string[] = []): DataValidator {
  const rules = ValidationRules[importType as keyof typeof ValidationRules] || []
  const validator = new DataValidator(rules)

  if (existingEmails.length > 0) {
    validator.setExistingData(existingEmails)
    validator.addRule({ field: 'email', type: 'unique', message: 'Email já cadastrado' })
  }

  return validator
}
