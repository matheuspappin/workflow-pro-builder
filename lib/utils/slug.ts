import { supabase } from '@/lib/supabase'
import logger from '@/lib/logger'

/**
 * Gera um slug a partir de um texto, removendo caracteres especiais
 */
export function generateSlugBase(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hifens
    .replace(/--+/g, '-') // Remove múltiplos hifens
    .trim()
}

/**
 * Gera um slug único para uma determinada tabela e coluna
 */
export async function generateUniqueSlug(
  text: string,
  table: 'studios' | 'partners' | 'verticalizations',
  column: string = 'slug'
): Promise<string> {
  const base = generateSlugBase(text)
  let slug = base
  let counter = 0
  let isUnique = false

  while (!isUnique) {
    const currentSlug = counter === 0 ? slug : `${slug}-${counter}`
    
    const { data, error } = await supabase
      .from(table)
      .select(column)
      .eq(column, currentSlug)
      .maybeSingle()

    if (error) {
      logger.error(`Erro ao verificar unicidade do slug em ${table}:`, error)
      // Se houver erro, adiciona um sufixo aleatório para garantir
      return `${currentSlug}-${Math.random().toString(36).substring(2, 7)}`
    }

    if (!data) {
      isUnique = true
      slug = currentSlug
    } else {
      counter++
      // Se tentarmos muitas vezes (ex: 10), adicionamos um sufixo aleatório
      if (counter > 10) {
        slug = `${base}-${Math.random().toString(36).substring(2, 7)}`
        isUnique = true
      }
    }
  }

  return slug
}
