"use server"

import { getAdminClient } from "@/lib/server-utils"
import logger from "@/lib/logger"

/**
 * Busca informações básicas de um estúdio pelo slug.
 * Usado em páginas públicas como Login e Cadastro de alunos.
 * Bypassa RLS para permitir visualização da marca antes do login.
 */
export async function getPublicStudioBySlug(slug: string) {
  try {
    const adminClient = await getAdminClient()
    if (!adminClient) {
      logger.error("❌ Admin client não disponível")
      return { data: null, error: "Erro de configuração no servidor" }
    }

    const { data, error } = await adminClient
      .from('studios')
      .select(`
        id, 
        name, 
        slug,
        plan,
        organization_settings (
          vocabulary,
          niche
        )
      `)
      .eq('slug', slug)
      .single()

    if (error) {
      logger.error(`❌ Erro ao buscar estúdio (slug: ${slug}):`, error.message)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err: any) {
    logger.error(`💥 Erro inesperado ao buscar estúdio (slug: ${slug}):`, err.message)
    return { data: null, error: err.message }
  }
}
