import { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { AppError } from '@/lib/errors'
import logger from '@/lib/logger'
import { successResponse, errorResponse } from '@/lib/api-response'
import { generateUniqueSlug } from '@/lib/utils/slug'
import { SYSTEM_CONFIG } from '@/lib/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: NextRequest) {
  let response = successResponse({}, 200);

  try {
    const { email: identifier, password, portal: rawPortal } = await request.json()
    
    // Normalização de portais para validação
    let portal = rawPortal;
    if (portal === 'client') portal = 'student';
    if (portal === 'professional') portal = 'student';

    logger.info('[AUTH] Tentativa de Login para:', { identifier: identifier || 'undefined', portal: rawPortal, mappedPortal: portal });

    if (!identifier) {
      throw new AppError('E-mail ou telefone é obrigatório.', 400, 'MISSING_IDENTIFIER');
    }

    if (!password) {
      throw new AppError('Senha é obrigatória.', 400, 'MISSING_PASSWORD');
    }

    // 1. Inicializar Supabase SSR para gerenciar cookies automaticamente
    const cookieStore = request.cookies
    
    // Precisamos criar o client SSR para gerenciar a autenticação e cookies corretamente
    // Mas para o login inicial, vamos usar o createClient para evitar complexidade com cookies de request/response aqui
    // e depois transferir a sessão para o SSR
    const authClient = createClient(supabaseUrl, supabaseAnonKey);

    // Função auxiliar para validar formato de e-mail
    const isEmail = (input: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);

    let authData, authError;

    if (isEmail(identifier)) {
      logger.info('[AUTH] Tentando login com e-mail...');
      ({ data: authData, error: authError } = await authClient.auth.signInWithPassword({
        email: identifier,
        password,
      }));
    } else {
      logger.info('[AUTH] Tentando login com telefone...');
      const cleanPhone = identifier.replace(/\D/g, '');
      ({ data: authData, error: authError } = await authClient.auth.signInWithPassword({
        phone: cleanPhone,
        password,
      }));
    }

    if (authError) {
      logger.error('[AUTH] Erro no login do Supabase:', authError.message);
      logger.error('[AUTH] Objeto de erro completo do Supabase:', authError);
      
      let errorMessage = 'Credenciais inválidas. Verifique seu e-mail/telefone e senha.';
      let errorCode = 'INVALID_CREDENTIALS';
      
      if (authError.message.includes('Email not confirmed')) {
        errorMessage = 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada ou solicite um novo link.';
        errorCode = 'EMAIL_NOT_CONFIRMED';
      }
      
      throw new AppError(errorMessage, 401, errorCode);
    }

    if (!authData.user || !authData.session) {
      logger.error('[AUTH] Supabase Auth retornou user/session nulo.');
      throw new AppError('Erro inesperado na autenticação.', 500, 'AUTH_SESSION_NULL');
    }

    const authUserId = authData.user.id;
    const session = authData.session;

    // CLIENTE DE BANCO DE DADOS
    let dbClient = authClient;
    if (supabaseServiceKey) {
        logger.info('[AUTH] Usando Service Role Key para buscar perfil (Bypass RLS)');
        dbClient = createClient(supabaseUrl, supabaseServiceKey);
    } else {
        logger.warn('[AUTH] Service Role Key não encontrada. Usando cliente autenticado (sujeito a RLS).');
    }

    // 2. Buscar Perfil Estendido
    let user = null;
    let currentProfileTable = '';

    // Tenta buscar em users_internal (SEM JOIN)
    logger.debug(`[AUTH] Tentando buscar perfil em users_internal para ID: ${authUserId}`);
    
    const { data: adminProfile, error: adminError } = await dbClient
      .from('users_internal')
      .select('*')
      .eq('id', authUserId)
      .maybeSingle();
    
    if (adminError) logger.error('[AUTH] Erro users_internal:', adminError.message);
    if (adminProfile) {
      user = { ...adminProfile, role: adminProfile.role || 'admin' };
      currentProfileTable = 'users_internal';

      // Buscar estúdio separadamente
      if (adminProfile.studio_id) {
          const { data: studioData } = await dbClient
            .from('studios')
            .select('name, slug, plan')
            .eq('id', adminProfile.studio_id)
            .maybeSingle();
          if (studioData) {
              user.studio = studioData;
          }
      }
    }

    // Se não for admin, tenta buscar em teachers ou professionals
    if (!user) {
      logger.debug('[AUTH] Tentando buscar perfil em teachers...');
      const { data: teacherProfile, error: teacherError } = await dbClient
        .from('teachers')
        .select('*')
        .eq('user_id', authUserId)
        .maybeSingle();
      
      if (teacherError) logger.error('[AUTH] Erro teachers:', teacherError.message);
      if (teacherProfile) {
        user = { ...teacherProfile, role: 'teacher' };
        currentProfileTable = 'teachers';
        
        // Buscar estúdio separadamente
        if (teacherProfile.studio_id) {
            const { data: studioData } = await dbClient
                .from('studios')
                .select('name, slug, plan')
                .eq('id', teacherProfile.studio_id)
                .maybeSingle();
            if (studioData) {
                user.studio = studioData;
            }
        }

      } else {
        // Tenta buscar em professionals como fallback (legado/consistência)
        logger.debug('[AUTH] Tentando buscar perfil em professionals...');
        const { data: profProfile, error: profError } = await dbClient
          .from('professionals')
          .select('*')
          .eq('user_id', authUserId)
          .maybeSingle();
        
        if (profError) logger.error('[AUTH] Erro professionals:', profError.message);
        if (profProfile) {
          user = { ...profProfile, role: 'teacher' };
          currentProfileTable = 'professionals';

          // Buscar estúdio separadamente
          if (profProfile.studio_id) {
              const { data: studioData } = await dbClient
                  .from('studios')
                  .select('name, slug, plan')
                  .eq('id', profProfile.studio_id)
                  .maybeSingle();
              if (studioData) {
                  user.studio = studioData;
              }
          }
        }
      }
    }

    // Se não for admin nem teacher, tenta buscar em students
    if (!user) {
      logger.debug('[AUTH] Tentando buscar perfil em students...');
      const { data: studentProfile, error: studentError } = await dbClient
        .from('students')
        .select('*')
        .eq('id', authUserId)
        .maybeSingle();
      
      if (studentError) logger.error('[AUTH] Erro students:', studentError.message);
      if (studentProfile) {
        user = { ...studentProfile, role: 'student' };
        currentProfileTable = 'students';

        // Buscar estúdio separadamente
        if (studentProfile.studio_id) {
            const { data: studioData } = await dbClient
                .from('studios')
                .select('name, slug, plan')
                .eq('id', studentProfile.studio_id)
                .maybeSingle();
            if (studioData) {
                user.studio = studioData;
            }
        }
      }
    }


    // Se não for nenhum dos anteriores, tenta buscar em partners (afiliados)
    if (!user) {
      logger.debug('[AUTH] Tentando buscar perfil em partners...');
      const { data: partnerProfile, error: partnerError } = await dbClient
        .from('partners')
        .select('*')
        .eq('user_id', authUserId)
        .maybeSingle();

      if (partnerError) logger.error('[AUTH] Erro partners:', partnerError.message);
      if (partnerProfile) {
        user = { ...partnerProfile, role: 'partner' };
        currentProfileTable = 'partners';

        // Buscar estúdios separadamente (Partner -> Studios)
        const { data: studiosData } = await dbClient
            .from('studios')
            .select('id, name, slug, plan')
            .eq('partner_id', partnerProfile.id);
        
        if (studiosData) {
            user.studios = studiosData;
        }
      }
    }

    logger.info('[AUTH] Perfil encontrado:', user ? `Sim (${currentProfileTable})` : 'Não');

    // --- FALLBACK: REPARAÇÃO DE PERFIL ---
    // Se o perfil não foi encontrado em nenhuma tabela, mas o usuário existe no Auth,
    // tentamos criar o perfil básico usando os metadados do Auth (Auto-reparação)
    if (!user && authData.user) {
      const metadata = authData.user.user_metadata || {};
      let role = metadata.role;
      const name = metadata.name || identifier.split('@')[0]; // Fallback name
      const studioId = metadata.studio_id;

      // FALLBACK PARA SUPER ADMIN (baseado em metadata.role)
      if (role === 'super_admin' && !studioId) { // Se for super_admin e não tiver studio_id no metadata
          logger.warn('[AUTH] Ativando protocolo de emergência para Super Admin sem studio_id');
      }

      if (role) {
        logger.info(`[AUTH] Tentando auto-reparação de perfil para ${authData.user.email} (Role: ${role})`);
        
        try {
          if (role === 'admin' || role === 'super_admin') {
            // Verifica se o ID já existe (dupla checagem)
            const { data: existingCheck } = await dbClient.from('users_internal').select('id').eq('id', authUserId).maybeSingle();
            
            if (!existingCheck) {
                let targetStudioId = studioId;
                
                // Validar se o estúdio existe se tiver um studio_id no metadata
                if (targetStudioId) {
                    const { data: studioExists } = await dbClient.from('studios').select('id').eq('id', targetStudioId).maybeSingle();
                    if (!studioExists) {
                        logger.warn(`[AUTH] studio_id do metadata (${targetStudioId}) não existe no banco. Buscando alternativa...`);
                        targetStudioId = null;
                    }
                }

                if (!targetStudioId) {
                    // Tenta encontrar um estúdio existente ou cria um 'Master Studio'
                    const { data: masterStudio } = await dbClient.from('studios').select('id').limit(1).maybeSingle();
                    if (masterStudio) {
                        targetStudioId = masterStudio.id;
                    } else {
                        // Cria estúdio de emergência
                        const { data: newStudio, error: studioError } = await dbClient.from('studios').insert({
                            name: 'Master Studio',
                            slug: 'master-studio',
                            plan: 'pro'
                        }).select().single();
                        
                        if (newStudio) {
                            targetStudioId = newStudio.id;
                            logger.info('[AUTH] Estúdio de emergência criado.');
                        } else {
                            logger.error('[AUTH] Falha ao criar estúdio de emergência:', studioError);
                        }
                    }
                }

                if (targetStudioId) {
                    const { data: newProfile, error: repairError } = await dbClient.from('users_internal').insert({
                        id: authUserId,
                        studio_id: targetStudioId,
                        name: name,
                        email: authData.user.email,
                        role: role === 'super_admin' ? 'admin' : role, // super_admin no banco deve ser admin, o código trata o super_admin
                        status: 'active'
                    }).select().single();
                    
                    if (!repairError && newProfile) {
                        logger.info('[AUTH] Auto-reparação: Perfil admin criado.');
                        
                        // Buscar dados do estúdio
                        const { data: studioData } = await dbClient
                            .from('studios')
                            .select('name, slug, plan')
                            .eq('id', targetStudioId)
                            .maybeSingle();
                        
                        user = { ...newProfile, role: role, studio: studioData };
                    } else if (repairError) {
                        logger.error('[AUTH] Erro auto-reparação admin:', repairError);
                    }
                } else {
                    logger.error('[AUTH] Auto-reparação admin falhou: studio_id ausente.');
                }
            } else {
                // Perfil existe mas não foi retornado na busca inicial? Estranho, mas vamos carregar
                const { data: fullProfile } = await dbClient.from('users_internal').select('*').eq('id', authUserId).single();
                user = { ...fullProfile, role: role };
            }
          } else if (role === 'student' && studioId) {
            const { data: newProfile, error: repairError } = await dbClient.from('students').insert({
              id: authUserId,
              studio_id: studioId,
              name: name,
              email: authData.user.email,
              status: 'active'
            }).select().single();
            
            if (!repairError && newProfile) {
              logger.info('[AUTH] Auto-reparação: Perfil student criado.');
              
              const { data: studioData } = await dbClient
                .from('studios')
                .select('name, slug, plan')
                .eq('id', studioId)
                .maybeSingle();
              
              user = { ...newProfile, role: 'student', studio: studioData };
            }
          } else if (role === 'teacher' || role === 'professional') {
              const { data: newProfile, error: repairError } = await dbClient.from('teachers').insert({
                user_id: authUserId,
                studio_id: studioId,
                name: name,
                email: authData.user.email,
                status: 'active'
              }).select().single();
              
              if (!repairError && newProfile) {
                logger.info('[AUTH] Auto-reparação: Perfil teacher criado.');
                
                const { data: studioData } = await dbClient
                  .from('studios')
                  .select('name, slug, plan')
                  .eq('id', studioId)
                  .maybeSingle();
                
                user = { ...newProfile, role: 'teacher', studio: studioData };
              }
          } else if (role === 'partner' || role === 'affiliate') {
              logger.info(`[AUTH] Tentando auto-reparação de perfil de parceiro para ${authData.user.email}`);
              const slug = await generateUniqueSlug(name || 'partner', 'partners');
              const { data: newProfile, error: repairError } = await dbClient.from('partners').insert({
                user_id: authUserId,
                name: name,
                slug: slug,
                commission_rate: SYSTEM_CONFIG.DEFAULT_PARTNER_COMMISSION
              }).select().single();

              if (!repairError && newProfile) {
                logger.info('[AUTH] Auto-reparação: Perfil partner criado.');
                user = { ...newProfile, role: 'partner' };
              } else if (repairError) {
                logger.error('[AUTH] Erro na auto-reparação de partner:', repairError);
              }
          }
        } catch (repairException) {
          logger.error('[AUTH] Exceção na auto-reparação:', repairException);
        }
      }
    }

    if (!user) {
      logger.error('[AUTH] Perfil não encontrado para ID:', authUserId);
      throw new AppError(
          'Perfil do usuário não encontrado. Entre em contato com o suporte.',
          404,
          'USER_PROFILE_NOT_FOUND'
      );
    }
    // --- VALIDAÇÃO DE PORTAL ---
    if (portal === 'student' && user.role !== 'student' && user.role !== 'teacher') {
      logger.warn(`[AUTH] Tentativa de acesso ao Portal do Usuário (Aluno/Prof) com perfil: ${user.role}`);
      throw new AppError(
        'Este e-mail é administrativo e não pode ser usado para acessar o Portal do Aluno/Professor.',
        403,
        'ADMIN_ACCESS_STUDENT_PORTAL_FORBIDDEN'
      );
    }

    if (portal === 'admin' && (user.role === 'student' || user.role === 'partner')) {
      logger.warn(`[AUTH] Tentativa de acesso ao Portal Admin com perfil: ${user.role}`);
      throw new AppError(
        'Este e-mail não possui acesso ao painel administrativo.',
        403,
        'NON_ADMIN_ACCESS_ADMIN_PORTAL_FORBIDDEN'
      );
    }

    if (portal === 'affiliate' && user.role !== 'partner' && user.role !== 'super_admin') {
      logger.warn(`[AUTH] Tentativa de acesso ao Portal do Afiliado com perfil: ${user.role}`);
      throw new AppError(
        'Este e-mail não possui acesso ao portal do afiliado.',
        403,
        'NON_PARTNER_ACCESS_AFFILIATE_PORTAL_FORBIDDEN'
      );
    }

    if (user.status && user.status !== 'active') {
      logger.error('[AUTH] Conta desativada:', user.status);
      throw new AppError('Esta conta está desativada.', 403, 'ACCOUNT_INACTIVE');
    }

    // 2.1 - Regra de Ouro: VendasLaChef ou qualquer usuário com role super_admin no banco
    const emailCheck = authData.user.email?.toLowerCase();
    logger.info(`[AUTH] Verificando privilégios de Super Admin para: ${emailCheck}`);
    
    if (emailCheck === 'vendaslachef@gmail.com' || user.role === 'super_admin') {
      logger.info(`[AUTH] 👑 Super Admin detectado (${emailCheck}). Mantendo privilégios.`);
      user.role = 'super_admin';
    }

    // 2.2 - Otimização: Sincronizar studio_id nos metadados do Auth para acesso rápido
    const metadataStudioId = authData.user.user_metadata?.studio_id;
    const profileStudioId = user?.studio_id;
    const currentRole = authData.user.user_metadata?.role;

    if (supabaseServiceKey) {
        let updates: any = {};
        let needsUpdate = false;

        // Sync studio_id
        if (profileStudioId && metadataStudioId !== profileStudioId) {
            updates.studio_id = profileStudioId;
            needsUpdate = true;
        }

        // Sync super_admin role
        if ((emailCheck === 'vendaslachef@gmail.com' || user.role === 'super_admin') && currentRole !== 'super_admin') {
            updates.role = 'super_admin';
            needsUpdate = true;
            logger.info('[AUTH] 👑 Agendando atualização de metadata para super_admin.');
        }

        if (needsUpdate) {
            logger.info('[AUTH] Sincronizando metadados do usuário:', updates);
            try {
                const adminClient = createClient(supabaseUrl, supabaseServiceKey);
                await adminClient.auth.admin.updateUserById(authUserId, {
                    user_metadata: { ...authData.user.user_metadata, ...updates }
                });
            } catch (syncError) {
                logger.error('[AUTH] Falha ao sincronizar metadados:', syncError);
            }
        }
    }

    // 3. Preparar Resposta
    response = successResponse({
      user: {
        id: authUserId,
        name: user.name,
        email: user.email,
        role: user.role,
        taxId: user.cpf_cnpj || user.tax_id || null,
        phone: user.phone,
        birthDate: user.birth_date,
        address: user.address,
        studio_id: user.studio_id || (user.role === 'partner' && user.studios && user.studios.length > 0 ? user.studios[0].id : null),
        studioName: user.studio?.name || (user.role === 'partner' && user.studios && user.studios.length > 0 ? user.studios[0].name : null) || "Workflow Studio",
        studioSlug: user.studio?.slug || (user.role === 'partner' && user.studios && user.studios.length > 0 ? user.studios[0].slug : null) || "",
        plan: user.studio?.plan || (user.role === 'partner' && user.studios && user.studios.length > 0 ? user.studios[0].plan : null) || "gratuito",
        partnerId: user.role === 'partner' ? user.id : null, // Adiciona partnerId se for parceiro
      },
      session: session
    });

    // 4. Setar Cookies SSR Padrão
    // Usamos createServerClient APENAS para setar os cookies na resposta de forma compatível
    const ssrClient = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    // Isso vai disparar o "set" configured acima
    await ssrClient.auth.setSession(session)

    // 5. Setar Cookies de Fallback (Compatibilidade)
    response.cookies.set('sb-auth-token', session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: session.expires_in,
      path: '/',
    })

    response.cookies.set('user-role', user.role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: session.expires_in,
      path: '/',
    })

    response.cookies.set('user-plan', user.studio?.plan || user.plan || "gratuito", {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: session.expires_in,
      path: '/',
    })

    return response

  } catch (error: any) {
    logger.error('[AUTH] Erro fatal no login:', error)
    return errorResponse(error, 500);
  }
}