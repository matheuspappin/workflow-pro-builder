"use server"

import { supabase as supabaseClient } from "@/lib/supabase"
import { getAuthenticatedClient, getAdminClient } from "@/lib/server-utils"
import { randomBytes } from "crypto"
import { nicheDictionary } from "@/config/niche-dictionary"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import logger from "@/lib/logger"
import { maskEmail, maskId } from "@/lib/sanitize-logs"
import { generateUniqueSlug } from "@/lib/utils/slug"
import { provisionWhatsAppForStudio } from "@/lib/whatsapp"

/**
 * Cria um novo ecossistema (Studio + Settings) e gera um link de convite.
 * Pode ser chamado por Super Admin ou Parceiro.
 */
export async function createEcosystemInvite(data: {
  name: string,
  niche: string,
  clientEmail?: string,
  businessModel?: 'CREDIT' | 'MONETARY',
  modules: any,
  professionalsTier?: string,
  partnerId?: string,
  accessToken?: string
}) {
  logger.info('🚀 Iniciando createEcosystemInvite:', data.name)
  logger.debug('🔑 AccessToken fornecido:', data.accessToken ? `Sim (${data.accessToken.substring(0, 10)}...)` : 'Não')

  // 1. Tentar Autenticação Robust
  let user = null;
  let authClient = await getAuthenticatedClient() // Cliente autenticado via cookies (se houver)
  const adminClient = await getAdminClient()    // Cliente Admin (se chave existir)

  // Log de diagnóstico
  logger.debug('🛠️ Diagnóstico de Clientes:')
  logger.debug('   - authClient (Cookie):', authClient ? 'Inicializado' : 'Null')
  logger.debug('   - adminClient (Service Role):', adminClient ? 'Inicializado' : 'Null (Verifique SUPABASE_SERVICE_ROLE_KEY)')

  // --- ESTRATÉGIA 1: Cliente Autenticado Padrão (SSR/Cookies) ---
  if (authClient) {
    logger.debug('🔄 [1] Tentando autenticação via SSR Client (Cookies)...')
    const { data: { user: authUser }, error: authError } = await authClient.auth.getUser()
    if (authUser) {
      logger.info('✅ [1] Autenticação SSR sucesso:', maskId(authUser.id))
      user = authUser;
    } else {
      logger.warn('⚠️ [1] Falha getUser:', authError?.message)
    }
  }

  // --- ESTRATÉGIA 2: Token Passado Explicitamente (Argumento) ---
  if (!user && data.accessToken) {
    logger.debug('🔄 [2] Tentando autenticação via accessToken fornecido...')
    
    // Se tivermos AdminClient, usamos ele (mais seguro/rápido para validar)
    // Se não, criamos um cliente temporário com a Anon Key apenas para validar o token
    let tokenValidatorClient = adminClient;
    
    if (!tokenValidatorClient) {
      logger.warn('⚠️ AdminClient não disponível. Usando AnonClient para validar token.')
      tokenValidatorClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    }

    const { data: { user: tokenUser }, error: tokenError } = await tokenValidatorClient.auth.getUser(data.accessToken)
    if (tokenUser) {
      logger.info('✅ [2] Autenticação sucesso via accessToken.')
      user = tokenUser
      
      // Se não tínhamos authClient válido, podemos tentar criar um "ad-hoc" 
      // usando esse token para operações futuras se o adminClient também falhar
      if (!authClient) {
         authClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { global: { headers: { Authorization: `Bearer ${data.accessToken}` } } }
         )
      }
    } else {
      logger.error('❌ [2] Token inválido:', tokenError?.message)
    }
  }

  // --- ESTRATÉGIA 3: Fallback Manual com Token dos Cookies ---
  if (!user) {
    logger.debug('🔄 [3] Tentando autenticação de fallback via cookies...')
    const cookieStore = await cookies()
    const token = cookieStore.get('sb-auth-token')?.value || cookieStore.get('sb-access-token')?.value
    
    if (token) {
      logger.debug('🍪 Token encontrado nos cookies.')
      const validator = adminClient || createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user: tokenUser }, error: tokenError } = await validator.auth.getUser(token)
      if (tokenUser) {
        logger.info('✅ [3] Autenticação fallback sucesso.')
        user = tokenUser
      } else {
        logger.error('❌ [3] Falha na validação do cookie:', tokenError?.message)
      }
    } else {
      logger.warn('⚠️ [3] Nenhum token encontrado nos cookies.')
    }
  }

  if (!user) {
    logger.error('❌ Falha em TODAS as tentativas de autenticação.')
    throw new Error("Não autorizado: Não foi possível identificar o usuário. Tente fazer login novamente.")
  }

  logger.info('✅ Usuário FINAL identificado:', maskEmail(user.email))

  // 2. Verificar Permissões (Super Admin ou Parceiro)
  // Usamos adminClient preferencialmente para ler dados de usuários/parceiros sem bloqueio de RLS
  // Se adminClient não existir, tentamos authClient (mas pode falhar se RLS for estrito)
  const dbReader = adminClient || authClient;

  if (!dbReader) {
    throw new Error("Erro de Configuração: Não foi possível estabelecer conexão com o banco de dados (Admin ou Auth).")
  }

  // Verificar perfil
  const { data: profile } = await dbReader
    .from('users_internal')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const isSuperAdmin = 
    profile?.role === 'super_admin' || 
    user.user_metadata?.role === 'super_admin' || 
    user.app_metadata?.role === 'super_admin' ||
    user.email?.toLowerCase() === 'vendaslachef@gmail.com';

  logger.info(`🔍 Verificação de permissão: DB=${profile?.role}, Meta=${user.user_metadata?.role}, AppMeta=${user.app_metadata?.role} -> SuperAdmin=${isSuperAdmin}`)

  
  let partnerId = data.partnerId;

  if (!isSuperAdmin) {
     logger.warn('⚠️ Usuário não é Super Admin, verificando se é Parceiro...')
     const { data: partner } = await dbReader
       .from('partners')
       .select('id')
       .eq('user_id', user.id)
       .maybeSingle()
     
     if (!partner) {
       logger.error('❌ Acesso negado: Nem Super Admin, nem Parceiro.')
       throw new Error("Permissão negada: Apenas Super Admins ou Parceiros podem criar ecossistemas")
     }
     logger.info('✅ Usuário é Parceiro')
     partnerId = partner.id;
  } else {
    logger.info('✅ Usuário é Super Admin.')
  }

  // 3. Criar o Studio
  // Aqui PRECISARÍAMOS do adminClient para garantir bypass de RLS na criação de tabelas 'globais' como studios
  // Se não tiver adminClient, tentamos com authClient, mas avisamos se der erro.
  const dbWriter = adminClient || authClient;
  if (!dbWriter) {
    throw new Error('Database client not available')
  }

  if (!adminClient) {
    logger.warn('⚠️ AVISO: Service Role Key ausente. Tentando criar studio com permissões do usuário (pode falhar por RLS).')
  }

  logger.info('🏗️ Criando novo studio:', data.name)
  
  const slug = await generateUniqueSlug(data.name, 'studios')

  const studioData: any = {
    name: data.name,
    owner_id: user.id, 
    slug: slug,
    business_model: data.businessModel || 'CREDIT'
  }

  if (partnerId) {
    studioData.partner_id = partnerId
  }

  const { data: studio, error: studioError } = await dbWriter
    .from('studios')
    .insert(studioData)
    .select()
    .single()

  if (studioError) {
    logger.error('❌ Erro ao criar studio:', studioError)
    throw new Error(`Erro ao criar studio: ${studioError.message} (Dica: Verifique se SUPABASE_SERVICE_ROLE_KEY está configurada)`)
  }
  logger.info('✅ Studio criado com sucesso')

  await provisionWhatsAppForStudio(studio.id, studio.slug)

  // 4. Criar Configurações
  logger.info('⚙️ Criando configurações para o studio...')
  const tierId = data.professionalsTier && ['1-10', '11-20', '21-50'].includes(data.professionalsTier)
    ? data.professionalsTier
    : '1-10'
  const themeConfig = { professionals_tier: tierId }
  const { error: settingsError } = await dbWriter
    .from('organization_settings')
    .upsert({
      studio_id: studio.id,
      niche: data.niche,
      enabled_modules: data.modules,
      vocabulary: getVocabularyForNiche(data.niche),
      theme_config: themeConfig
    })

  if (settingsError) {
    logger.error('❌ Erro ao criar configurações:', settingsError)
    throw new Error(`Erro ao criar configurações: ${settingsError.message}`)
  }

  // 5. Gerar Token de Convite
  logger.info('🎫 Gerando convite...')
  const token = randomBytes(32).toString('hex')
  
  const { error: inviteError } = await dbWriter
    .from('studio_invites')
    .insert({
      studio_id: studio.id,
      email: data.clientEmail || null,
      token: token,
      created_by: user.id,
      invite_type: 'ecosystem',
      metadata: { invite_type: 'ecosystem', niche: data.niche },
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
    })

  if (inviteError) {
    logger.error('❌ Erro ao criar convite:', inviteError)
    throw new Error(`Erro ao criar convite: ${inviteError.message}`)
  }

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/setup/invite/${token}`
  logger.info('✅ Ecossistema criado com sucesso')

  return { 
    success: true, 
    inviteUrl,
    studioId: studio.id
  }
}

/**
 * Resgata o convite: Transfere a propriedade do estúdio para o usuário atual
 */
export async function claimEcosystem(token: string) {
  logger.info('➡️ Tentativa de resgate de ecossistema')
  
  let user = null;
  const authClient = await getAuthenticatedClient()
  if (authClient) {
    const { data: { user: authUser } } = await authClient.auth.getUser()
    user = authUser
  }
  
  if (!user) {
    const cookieStore = await cookies()
    const tokenCookie = cookieStore.get('sb-auth-token')?.value || cookieStore.get('sb-access-token')?.value
    if (tokenCookie) {
      const adminClient = await getAdminClient()
      // Fallback para Anon se admin não existir
      const validator = adminClient || createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data: { user: tokenUser } } = await validator.auth.getUser(tokenCookie)
      user = tokenUser
    }
  }

  if (!user) throw new Error("Não autenticado")

  logger.info('✅ Usuário autenticado para resgate')

  const adminClient = await getAdminClient()
  // Aqui realmente precisamos do AdminClient para trocar dono, ou que o usuário tenha permissão.
  // Vamos tentar com authClient se admin não existir, mas provavelmente falhará sem RLS permissivo.
  const dbWriter = adminClient || authClient;
  
  if (!dbWriter) throw new Error("Erro interno: Cliente de banco indisponível")

  // 1. Buscar convite válido
  const { data: invite, error: inviteError } = await dbWriter
    .from('studio_invites')
    .select('*, studio:studios(id, name)')
    .eq('token', token)
    .is('used_at', null)
    .single()

  if (inviteError || !invite) {
    logger.error('❌ Convite inválido:', inviteError)
    throw new Error("Convite inválido ou expirado")
  }

  // 2. Atualizar dono do estúdio
  const { error: updateError } = await dbWriter
    .from('studios')
    .update({ owner_id: user.id })
    .eq('id', invite.studio.id)

  if (updateError) throw new Error(`Erro ao vincular estúdio: ${updateError.message}`)

  // 3. Atualizar usuário para Admin do estúdio
  const { data: existingUser } = await dbWriter
    .from('users_internal')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (existingUser) {
    await dbWriter
      .from('users_internal')
      .update({ 
        studio_id: invite.studio.id,
        role: 'admin' 
      })
      .eq('id', user.id)
  } else {
    await dbWriter
      .from('users_internal')
      .insert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0],
        studio_id: invite.studio.id,
        role: 'admin'
      })
  }

  // 4. Marcar convite como usado
  await dbWriter
    .from('studio_invites')
    .update({ used_at: new Date().toISOString() })
    .eq('id', invite.id)

  return { 
    success: true, 
    studioName: invite.studio.name 
  }
}

/**
 * Helper para vocabulário inicial
 */
function getVocabularyForNiche(niche: string) {
  // @ts-ignore
  return nicheDictionary.pt[niche] || nicheDictionary.pt.dance
}
