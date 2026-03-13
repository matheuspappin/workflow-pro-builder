import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { AppError } from '@/lib/errors'
import { loginSchema } from '@/lib/schemas/auth'
import { checkAuthRateLimit } from '@/lib/rate-limit'
import { maskEmail, maskId } from '@/lib/sanitize-logs'
import logger from '@/lib/logger'
import { successResponse, errorResponse } from '@/lib/api-response'
import { generateUniqueSlug } from '@/lib/utils/slug'
import { SYSTEM_CONFIG } from '@/lib/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Função para buscar o perfil do usuário em todas as tabelas possíveis
 */
async function fetchUserProfile(dbClient: any, userId: string) {
  // 1. professionals (Novo formato para Engenheiros/Arquitetos e legado de Professores)
  // Usa limit para evitar erro quando há múltiplas linhas (ex: múltiplos vínculos de estúdio)
  // Prioriza registro com studio_id definido (nulls por último)
  const { data: profProfiles } = await dbClient
    .from('professionals')
    .select('*')
    .eq('user_id', userId)
    .order('studio_id', { ascending: false, nullsFirst: false })
    .limit(1);

  const profProfile = profProfiles?.[0] ?? null;

  if (profProfile) {
    return { 
      profile: profProfile, 
      table: 'professionals', 
      role: profProfile.professional_type === 'engineer' ? 'engineer' : (profProfile.professional_type === 'architect' ? 'architect' : 'teacher') 
    };
  }

  // 2. users_internal (Admins)
  const { data: adminProfile } = await dbClient
    .from('users_internal')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (adminProfile) {
    return { profile: adminProfile, table: 'users_internal', role: adminProfile.role || 'admin' };
  }

  // 3. teachers (Professores - fallback para legados que ainda não estão em professionals)
  const { data: teacherProfile } = await dbClient
    .from('teachers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (teacherProfile) {
    return { 
      profile: teacherProfile, 
      table: 'teachers', 
      role: teacherProfile.professional_type === 'engineer' ? 'engineer' : (teacherProfile.professional_type === 'architect' ? 'architect' : 'teacher') 
    };
  }

  // 4. students (Alunos)
  const { data: studentProfile } = await dbClient
    .from('students')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (studentProfile) {
    return { profile: studentProfile, table: 'students', role: 'student' };
  }

  // 5. partners (Afiliados)
  const { data: partnerProfile } = await dbClient
    .from('partners')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (partnerProfile) {
    return { profile: partnerProfile, table: 'partners', role: 'partner' };
  }

  return null;
}

/**
 * Protocolo de auto-reparação de perfil
 */

async function repairUserProfile(dbClient: any, authUser: any, identifier: string) {
  const metadata = authUser.user_metadata || {};
  const role = metadata.role;
  const name = metadata.name || identifier.split('@')[0];
  const studioId = metadata.studio_id;
  const userId = authUser.id;

  if (!role) return null;

  logger.info(`[AUTH] Iniciando auto-reparação para ${maskEmail(authUser.email)} (Role: ${role})`);

  try {
    if (role === 'admin' || role === 'super_admin') {
      let targetStudioId = studioId;
      
      if (!targetStudioId) {
        const { data: firstStudio } = await dbClient.from('studios').select('id').limit(1).maybeSingle();
        targetStudioId = firstStudio?.id;
      }

      if (targetStudioId) {
        const { data: newProfile } = await dbClient.from('users_internal').insert({
          id: userId,
          studio_id: targetStudioId,
          name,
          email: authUser.email,
          role: 'admin',
          status: 'active'
        }).select().single();

        if (newProfile) return { profile: newProfile, table: 'users_internal', role: role };
      }
    } else if (role === 'student' && studioId) {
      const { data: newProfile } = await dbClient.from('students').insert({
        id: userId,
        studio_id: studioId,
        name,
        email: authUser.email,
        status: 'active'
      }).select().single();

      if (newProfile) return { profile: newProfile, table: 'students', role: 'student' };
    } else if (['teacher', 'professional', 'engineer', 'architect'].includes(role)) {
      const { data: newProfile } = await dbClient.from('professionals').insert({
        user_id: userId,
        studio_id: studioId || null,
        name,
        email: authUser.email,
        professional_type: role === 'engineer' ? 'engineer' : (role === 'architect' ? 'architect' : 'technician'),
        status: 'active'
      }).select().single();

      if (newProfile) return { 
        profile: newProfile, 
        table: 'professionals', 
        role: (role === 'engineer' || role === 'architect') ? role : 'teacher' 
      };
    } else if (role === 'partner' || role === 'affiliate') {
      const slug = await generateUniqueSlug(name, 'partners');
      const { data: newProfile } = await dbClient.from('partners').insert({
        user_id: userId,
        name,
        slug,
        commission_rate: SYSTEM_CONFIG.DEFAULT_PARTNER_COMMISSION
      }).select().single();

      if (newProfile) return { profile: newProfile, table: 'partners', role: 'partner' };
    }
  } catch (err) {
    logger.error('[AUTH] Erro na auto-reparação:', err);
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const rate = await checkAuthRateLimit(request)
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Aguarde um momento antes de tentar novamente.' },
        { status: 429, headers: rate.retryAfter ? { 'Retry-After': String(rate.retryAfter) } : {} }
      )
    }

    const body = await request.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      const first = parsed.error.errors[0]
      throw new AppError(first?.message ?? 'Dados inválidos', 400, 'VALIDATION_ERROR')
    }
    const { email: rawIdentifier, password, portal: rawPortal, language: loginLanguage, studioSlug: requestStudioSlug } = parsed.data
    const identifier = rawIdentifier.trim()

    let portal = rawPortal
    if (portal === 'client') portal = 'student'

    // 1. Inicializar Supabase SSR com captura de cookies
    // Criamos uma resposta que será preenchida com os cookies de sessão pelo Supabase
    let response = NextResponse.json({ success: true });

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    });

    const isEmail = (input: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
    const cleanIdentifier = isEmail(identifier) ? identifier : identifier.replace(/\D/g, '');

    // 2. Autenticação
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword(
      isEmail(identifier) ? { email: cleanIdentifier, password } : { phone: cleanIdentifier, password }
    );

    if (authError) {
      logger.error('[AUTH] Login Error:', { code: authError.message?.slice(0, 50) });
      if (authError.message.toLowerCase().includes('email not confirmed')) {
        throw new AppError('Seu e-mail ainda não foi confirmado.', 401, 'EMAIL_NOT_CONFIRMED');
      }
      throw new AppError('Credenciais inválidas.', 401, 'INVALID_CREDENTIALS');
    }

    if (!authData.user || !authData.session) {
      throw new AppError('Erro na sessão de autenticação.', 500, 'AUTH_SESSION_NULL');
    }

    // 3. Buscar Perfil (Bypass RLS para garantir que o perfil seja encontrado durante o login)
    const adminDb = createServerClient(supabaseUrl, supabaseServiceKey, {
      cookies: { get: () => '', set: () => {}, remove: () => {} }
    });

    let profileResult = await fetchUserProfile(adminDb, authData.user.id);

    if (!profileResult) {
      profileResult = await repairUserProfile(adminDb, authData.user, identifier);
    }

    if (!profileResult) {
      throw new AppError('Perfil de usuário não encontrado.', 404, 'USER_PROFILE_NOT_FOUND');
    }

    let { profile, role: detectedRole } = profileResult;
    let userRole = detectedRole;

    // Detecção Super Admin — baseada exclusivamente no role armazenado no banco de dados
    if (profile.role === 'super_admin') {
      userRole = 'super_admin';
    }

    // Validação de Portal
    if (portal === 'admin' && !['admin', 'super_admin', 'professional', 'receptionist', 'seller', 'finance'].includes(userRole)) {
      throw new AppError('Acesso negado ao painel administrativo.', 403, 'FORBIDDEN_PORTAL');
    }

    // --- Lógica para vincular profissional a um estúdio se studioSlug for fornecido e ele não tiver um studio_id ---
    let studio = null;
    if (requestStudioSlug && !profile.studio_id && (userRole === 'engineer' || userRole === 'architect' || userRole === 'teacher' || userRole === 'professional')) {
      logger.info(`[AUTH] Profissional logado via URL de estúdio (${requestStudioSlug}) sem vínculo. Tentando vincular.`);
      
      const { data: targetStudio, error: fetchStudioError } = await adminDb.from('studios').select('id, name, slug, plan').eq('slug', requestStudioSlug).maybeSingle();

      if (fetchStudioError || !targetStudio) {
        logger.warn(`[AUTH] Estúdio com slug ${requestStudioSlug} não encontrado ou erro ao buscar:`, fetchStudioError?.message);
        // Prosseguir sem vínculo, o front-end redirecionará para a página de convite
      } else {
        const studioIdToLink = targetStudio.id;
        
        // Atualiza a tabela 'professionals' com o studio_id
        const { error: updateProfError } = await adminDb.from('professionals').upsert(
          {
            user_id: authData.user.id,
            studio_id: studioIdToLink,
            name: profile.name || authData.user.email?.split('@')[0],
            email: authData.user.email,
            professional_type: userRole === 'engineer' ? 'engineer' : (userRole === 'architect' ? 'architect' : 'technician'),
            status: 'active',
          },
          { onConflict: 'user_id' } // Conflito pelo user_id do auth.users, que é único
        );

        if (updateProfError) {
          logger.error('[AUTH] Erro ao vincular profissional ao estúdio:', { error: updateProfError.message });
        } else {
          logger.info('[AUTH] Profissional vinculado ao estúdio com sucesso.');
          // Atualiza o objeto profile para refletir o novo vínculo
          profile.studio_id = studioIdToLink;
          studio = targetStudio; // Define o estúdio para a resposta
        }
      }
    }

    // Buscar Estúdio (se ainda não foi definido pela lógica acima ou se já tinha studio_id)
    if (!studio && profile.studio_id) {
      const { data: studioData } = await adminDb.from('studios').select('id, name, slug, plan').eq('id', profile.studio_id).maybeSingle();
      studio = studioData;
    }

    // 4. Sincronizar Metadados do Auth (IMPORTANTE: sempre atualizar para garantir consistência)
    const metadata = authData.user.user_metadata || {};
    // Apenas atualiza se houver uma mudança real ou se o studio_id foi recém-definido
    const updatedMetadata: Record<string, unknown> = { ...metadata, role: userRole, language: loginLanguage };
    if (profile.studio_id) {
      updatedMetadata.studio_id = profile.studio_id;
    } else {
      // Se não há studio_id, garanta que não estamos definindo um inválido
      delete updatedMetadata.studio_id;
    }

    if (metadata.role !== userRole || metadata.studio_id !== profile.studio_id) { // Melhorar a condição de atualização
      await adminDb.auth.admin.updateUserById(authData.user.id, {
        user_metadata: updatedMetadata
      });
    }

    // 5. Construir Resposta Final
    // Agent log removed for production safety
    const userPayload: Record<string, unknown> = {
      id: authData.user.id,
      name: profile.name,
      email: profile.email,
      role: userRole,
      studio_id: profile.studio_id,
      studioName: studio?.name || "Workflow Studio",
      studioSlug: studio?.slug || "",
      plan: studio?.plan || "gratuito",
      professionalType: profile.professional_type || null,
    };
    // Afiliados/parceiros: incluir partnerId para criar ecossistemas e exibir comissão
    if (profileResult.table === 'partners' && profile.id) {
      userPayload.partnerId = profile.id;
    }
    const responseData = {
      success: true,
      user: userPayload,
      session: authData.session,
      // Adiciona flag para redirecionar para a página de join no front-end, se necessário
      redirectToJoin: (userRole === 'engineer' || userRole === 'architect' || userRole === 'teacher' || userRole === 'professional') && !profile.studio_id && requestStudioSlug
    };

    // Atualizamos o corpo da resposta mantendo os cookies já setados no objeto 'response'
    const finalResponse = NextResponse.json(responseData, {
      status: 200,
      headers: response.headers // Importante: mantém os headers (cookies) setados pelo Supabase
    });

    // Setar cookies de compatibilidade adicionais se necessário
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: authData.session.expires_in,
      path: '/',
    };

    finalResponse.cookies.set('user-role', userRole, cookieOptions);
    finalResponse.cookies.set('user-plan', studio?.plan || "gratuito", cookieOptions);

    return finalResponse;

  } catch (error: any) {
    logger.error('[AUTH] Fatal Login Error:', error);
    return errorResponse(error);
  }
}
