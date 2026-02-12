import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: NextRequest) {
  let response = NextResponse.next();

  try {
    const { email: identifier, password, portal } = await request.json()

    console.log('➡️ Tentativa de Login para:', { identifier: identifier || 'undefined', portal });

    if (!identifier) {
      console.error('❌ E-mail ou telefone não informado.');
      return NextResponse.json({ error: 'E-mail ou telefone é obrigatório.' }, { status: 400 });
    }

    if (!password) {
      console.error('❌ Senha não informada.');
      return NextResponse.json({ error: 'Senha é obrigatória.' }, { status: 400 });
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
      console.log('🔑 Tentando login com e-mail...');
      ({ data: authData, error: authError } = await authClient.auth.signInWithPassword({
        email: identifier,
        password,
      }));
    } else {
      console.log('🔑 Tentando login com telefone...');
      const cleanPhone = identifier.replace(/\D/g, '');
      ({ data: authData, error: authError } = await authClient.auth.signInWithPassword({
        phone: cleanPhone,
        password,
      }));
    }

    if (authError) {
      console.error('❌ Erro no login do Supabase:', authError.message);
      console.error('❌ Objeto de erro completo do Supabase:', authError);
      
      let errorMessage = 'Credenciais inválidas. Verifique seu e-mail/telefone e senha.';
      
      if (authError.message.includes('Email not confirmed')) {
        errorMessage = 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada ou solicite um novo link.';
      }
      
      return NextResponse.json({ error: errorMessage }, { status: 401 })
    }

    if (!authData.user || !authData.session) {
      console.error('❌ Supabase Auth retornou user/session nulo.');
      return NextResponse.json({ error: 'Erro inesperado na autenticação.' }, { status: 500 });
    }

    const authUserId = authData.user.id;
    const session = authData.session;

    // CLIENTE DE BANCO DE DADOS
    let dbClient = authClient;
    if (supabaseServiceKey) {
        console.log('⚡ Usando Service Role Key para buscar perfil (Bypass RLS)');
        dbClient = createClient(supabaseUrl, supabaseServiceKey);
    } else {
        console.log('⚠️ Service Role Key não encontrada. Usando cliente autenticado (sujeito a RLS).');
    }

    // 2. Buscar Perfil Estendido
    let user = null;
    let currentProfileTable = '';

    // Tenta buscar em users_internal (SEM JOIN)
    console.log(`🔍 Tentando buscar perfil em users_internal para ID: ${authUserId}`);
    
    const { data: adminProfile, error: adminError } = await dbClient
      .from('users_internal')
      .select('*')
      .eq('id', authUserId)
      .maybeSingle();
    
    if (adminError) console.error('❌ Erro users_internal:', adminError.message);
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
      console.log('🔍 Tentando buscar perfil em teachers...');
      const { data: teacherProfile, error: teacherError } = await dbClient
        .from('teachers')
        .select('*')
        .eq('user_id', authUserId)
        .maybeSingle();
      
      if (teacherError) console.error('❌ Erro teachers:', teacherError.message);
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
        console.log('🔍 Tentando buscar perfil em professionals...');
        const { data: profProfile, error: profError } = await dbClient
          .from('professionals')
          .select('*')
          .eq('user_id', authUserId)
          .maybeSingle();
        
        if (profError) console.error('❌ Erro professionals:', profError.message);
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
      console.log('🔍 Tentando buscar perfil em students...');
      const { data: studentProfile, error: studentError } = await dbClient
        .from('students')
        .select('*')
        .eq('id', authUserId)
        .maybeSingle();
      
      if (studentError) console.error('❌ Erro students:', studentError.message);
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
      console.log('🔍 Tentando buscar perfil em partners...');
      const { data: partnerProfile, error: partnerError } = await dbClient
        .from('partners')
        .select('*')
        .eq('user_id', authUserId)
        .maybeSingle();

      if (partnerError) console.error('❌ Erro partners:', partnerError.message);
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

    console.log('🔎 Perfil encontrado:', user ? `Sim (${currentProfileTable})` : 'Não');

    // --- FALLBACK: REPARAÇÃO DE PERFIL ---
    // Se o perfil não foi encontrado em nenhuma tabela, mas o usuário existe no Auth,
    // tentamos criar o perfil básico usando os metadados do Auth (Auto-reparação)
    if (!user && authData.user) {
      const metadata = authData.user.user_metadata || {};
      let role = metadata.role;
      const name = metadata.name || identifier.split('@')[0]; // Fallback name
      const studioId = metadata.studio_id;

      // 🛠️ FALLBACK DE EMERGÊNCIA PARA SUPER ADMIN
      if (identifier.toLowerCase() === 'vendaslachef@gmail.com') {
          console.log('🚨 Ativando protocolo de emergência para VendasLaChef');
          role = 'admin'; // Força admin se não tiver
      }

      if (role) {
        console.log(`🛠️ Tentando auto-reparação de perfil para ${authData.user.email} (Role: ${role})`);
        
        try {
          if (role === 'admin') {
            // Se não tiver studio_id, cria um default ou ignora (admin pode ser sem estúdio às vezes? Não, schema diz studio_id obrigatório normalmente, mas vamos tentar)
            // Se for o VendasLaChef, podemos precisar criar um estúdio se ele não tiver.
            
            // Verifica se o ID já existe (dupla checagem)
            const { data: existingCheck } = await dbClient.from('users_internal').select('id').eq('id', authUserId).maybeSingle();
            
            if (!existingCheck) {
                // Se for VendasLaChef, garantir que tenha studio_id
                let targetStudioId = studioId;
                if (!targetStudioId && identifier.toLowerCase() === 'vendaslachef@gmail.com') {
                    // Tenta encontrar um estúdio existente ou cria um 'Master Studio'
                    const { data: masterStudio } = await dbClient.from('studios').select('id').limit(1).maybeSingle();
                    if (masterStudio) {
                        targetStudioId = masterStudio.id;
                    } else {
                        // Cria estúdio de emergência
                        const { data: newStudio } = await dbClient.from('studios').insert({
                            name: 'Master Studio',
                            slug: 'master-studio',
                            plan: 'pro'
                        }).select().single();
                        if (newStudio) targetStudioId = newStudio.id;
                    }
                }

                if (targetStudioId) {
                    const { data: newProfile, error: repairError } = await dbClient.from('users_internal').insert({
                        id: authUserId,
                        studio_id: targetStudioId,
                        name: name,
                        email: authData.user.email,
                        role: 'admin',
                        status: 'active'
                    }).select().single();
                    
                    if (!repairError && newProfile) {
                        console.log('✅ Auto-reparação: Perfil admin criado.');
                        
                        // Buscar dados do estúdio
                        const { data: studioData } = await dbClient
                            .from('studios')
                            .select('name, slug, plan')
                            .eq('id', targetStudioId)
                            .maybeSingle();
                        
                        user = { ...newProfile, role: 'admin', studio: studioData };
                    } else if (repairError) {
                        console.error('❌ Erro auto-reparação admin:', repairError);
                    }
                } else {
                    console.error('❌ Auto-reparação admin falhou: studio_id ausente.');
                }
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
              console.log('✅ Auto-reparação: Perfil student criado.');
              
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
                console.log('✅ Auto-reparação: Perfil teacher criado.');
                
                const { data: studioData } = await dbClient
                  .from('studios')
                  .select('name, slug, plan')
                  .eq('id', studioId)
                  .maybeSingle();
                
                user = { ...newProfile, role: 'teacher', studio: studioData };
              }
          } else if (role === 'partner' || role === 'affiliate') {
              console.log(`🛠️ Tentando auto-reparação de perfil de parceiro para ${authData.user.email}`);
              const { data: newProfile, error: repairError } = await dbClient.from('partners').insert({
                user_id: authUserId,
                name: name,
                slug: (name || 'partner').toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substring(2, 7),
                commission_rate: 10
              }).select().single();

              if (!repairError && newProfile) {
                console.log('✅ Auto-reparação: Perfil partner criado.');
                user = { ...newProfile, role: 'partner' };
              } else if (repairError) {
                console.error('❌ Erro na auto-reparação de partner:', repairError);
              }
          }
        } catch (repairException) {
          console.error('💥 Exceção na auto-reparação:', repairException);
        }
      }
    }

    if (!user) {
      console.error('❌ Perfil não encontrado para ID:', authUserId);
      return NextResponse.json({ 
          error: 'Perfil do usuário não encontrado. Entre em contato com o suporte.',
          debug_id: authUserId 
      }, { status: 404 })
    }

    // --- VALIDAÇÃO DE PORTAL ---
    if (portal === 'student' && user.role !== 'student' && user.role !== 'teacher') {
      console.warn(`⚠️ [AUTH] Tentativa de acesso ao Portal do Usuário (Aluno/Prof) com perfil: ${user.role}`);
      return NextResponse.json({ 
        error: 'Este e-mail é administrativo e não pode ser usado para acessar o Portal do Aluno/Professor.' 
      }, { status: 403 });
    }

    if (portal === 'admin' && (user.role === 'student' || user.role === 'partner')) {
      console.warn(`⚠️ [AUTH] Tentativa de acesso ao Portal Admin com perfil: ${user.role}`);
      return NextResponse.json({ 
        error: 'Este e-mail não possui acesso ao painel administrativo.' 
      }, { status: 403 });
    }

    if (portal === 'affiliate' && user.role !== 'partner' && user.role !== 'super_admin') {
      console.warn(`⚠️ [AUTH] Tentativa de acesso ao Portal do Afiliado com perfil: ${user.role}`);
      return NextResponse.json({ 
        error: 'Este e-mail não possui acesso ao portal do afiliado.' 
      }, { status: 403 });
    }

    if (user.status && user.status !== 'active') {
      console.error('❌ Conta desativada:', user.status);
      return NextResponse.json({ error: 'Esta conta está desativada.' }, { status: 403 })
    }

    // 2.1 - Regra de Ouro: VendasLaChef é o único Super Admin
    if (identifier.toLowerCase() === 'vendaslachef@gmail.com') {
      user.role = 'super_admin'
    } else if (user.role === 'super_admin') {
      user.role = 'admin'
    }

    // 3. Preparar Resposta
    response = NextResponse.json({
      success: true,
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
        studioName: user.studio?.name || (user.role === 'partner' && user.studios && user.studios.length > 0 ? user.studios[0].name : null) || "DanceFlow Studio",
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
    console.error('💥 Erro fatal no login:', error)
    return NextResponse.json({ error: 'Erro interno ao processar login' }, { status: 500 })
  }
}