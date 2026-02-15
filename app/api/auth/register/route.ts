import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateCPF, validateCNPJ } from '@/lib/validation-utils'
import { createClient } from '@supabase/supabase-js'
import { AppError } from '@/lib/errors'
import logger from '@/lib/logger'
import { successResponse, errorResponse } from '@/lib/api-response'
import { generateUniqueSlug } from '@/lib/utils/slug'
import { SYSTEM_CONFIG } from '@/lib/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function POST(request: NextRequest) {
  try {
    let { 
      name, 
      email, 
      studioName, 
      password, 
      role = 'admin', 
      taxId, 
      taxIdType = 'cpf', 
      phone,
      birthDate,
      address
    } = await request.json()

    // Normalização de roles vindo de diferentes portais
    if (role === 'client') role = 'student'
    if (role === 'professional') role = 'teacher'

    logger.info('➡️ Tentativa de Registro para:', { email, role, taxId, phone });

    if (!name || !email || !password || !taxId || !phone) {
      throw new AppError('Nome, e-mail, documento, telefone e senha são obrigatórios', 400, 'MISSING_REQUIRED_FIELDS');
    }

    // 0. Verificar se o e-mail foi verificado
    const cleanPhone = phone.replace(/\D/g, '')
    logger.debug('📧 Verificando e-mail:', email);
    const { data: emailVerification, error: emailVerificationError } = await supabaseAdmin
      .from('email_verifications')
      .select('verified, created_at')
      .eq('email', email)
      .eq('verified', true)
      .maybeSingle()

    if (emailVerificationError) {
      logger.error('❌ Erro ao verificar e-mail:', emailVerificationError);
      throw new AppError('Erro ao verificar e-mail.', 500, 'EMAIL_VERIFICATION_FAILED');
    }

    if (!emailVerification) {
      throw new AppError('O e-mail não foi verificado. Por favor, valide o código enviado ao seu e-mail.', 400, 'EMAIL_NOT_VERIFIED');
    }
    logger.info('✅ E-mail verificado.');
    logger.debug('📞 Telefone limpo:', cleanPhone);

    // Algoritmo de validação de documento
    const isDocumentValid = taxIdType === 'cnpj' ? validateCNPJ(taxId) : validateCPF(taxId)
    if (!isDocumentValid) {
      logger.error('❌ Documento inválido:', taxId);
      throw new AppError(`O ${taxIdType.toUpperCase()} informado é inválido.`, 400, 'INVALID_TAX_ID');
    }
    logger.info('✅ Documento válido.');

    // 0. Verificar se o CPF/CNPJ já existe em qualquer tabela de perfil
    const [checkAdmin, checkTeacher, checkStudent] = await Promise.all([
      supabaseAdmin.from('users_internal').select('id').eq('cpf_cnpj', taxId).maybeSingle(),
      supabaseAdmin.from('teachers').select('id').eq('cpf_cnpj', taxId).maybeSingle(),
      supabaseAdmin.from('students').select('id').eq('cpf_cnpj', taxId).maybeSingle()
    ])
    logger.debug('🔍 Verificação de CPF/CNPJ existente:', { checkAdmin: checkAdmin.data, checkTeacher: checkTeacher.data, checkStudent: checkStudent.data });

    if (checkAdmin.data || checkTeacher.data || checkStudent.data) {
      logger.error('❌ CPF/CNPJ já existe.');
      throw new AppError(
        'Este CPF/CNPJ já está vinculado a uma conta ativa. Use outro documento ou recupere sua senha.',
        400,
        'TAX_ID_ALREADY_EXISTS'
      );
    }

    if (role === 'admin' && !studioName) {
      logger.error('❌ Nome do estúdio é obrigatório para donos.');
      throw new AppError('Nome do estúdio é obrigatório para donos', 400, 'MISSING_STUDIO_NAME');
    }

    // Bloqueio de segurança: ninguém pode se registrar como super_admin diretamente
    if (role === 'super_admin') {
      logger.error('❌ Tentativa de registro como super_admin.');
      throw new AppError('Operação não permitida.', 403, 'SUPER_ADMIN_REGISTRATION_FORBIDDEN');
    }

    let studio = null;

    // 1. Se for ADMIN (Dono), criar o estúdio
    if (role === 'admin') {
      const slug = await generateUniqueSlug(studioName, 'studios')

      const { data: newStudio, error: studioError } = await supabaseAdmin.from('studios')
        .insert({
          name: studioName,
          slug,
          plan: 'gratuito',
          status: 'active',
          subscription_status: 'trialing',
          trial_ends_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single()

      if (studioError) {
        logger.error('❌ Erro ao criar estúdio:', studioError)
        throw new AppError('Falha ao criar estúdio no banco de dados', 500, 'STUDIO_CREATION_FAILED');
      }
      studio = newStudio;
      logger.info('✅ Estúdio criado:', studio);

      // Configurações e modalidades padrão apenas para novos estúdios
      const initialSettings = [
        { studio_id: studio.id, setting_key: 'studio_name', setting_value: studioName, setting_type: 'string' },
        { studio_id: studio.id, setting_key: 'studio_email', setting_value: email, setting_type: 'string' },
        { studio_id: studio.id, setting_key: 'currency', setting_value: 'BRL', setting_type: 'string' },
        { studio_id: studio.id, setting_key: 'timezone', setting_value: 'America/Sao_Paulo', setting_type: 'string' },
      ]
      await supabaseAdmin.from('studio_settings').insert(initialSettings)
      logger.info('✅ Configurações iniciais do estúdio inseridas.');

      const defaultModalities = [
        { studio_id: studio.id, name: 'Ballet', color: '#f472b6' },
        { studio_id: studio.id, name: 'Jazz', color: '#60a5fa' },
        { studio_id: studio.id, name: 'Hip Hop', color: '#fbbf24' },
      ]
      await supabaseAdmin.from('modalities').insert(defaultModalities)
      logger.info('✅ Modalidades padrão inseridas.');
    }

    // 2. Criar Conta Oficial no Supabase Auth usando Admin para auto-confirmar
    // Já que validamos o e-mail manualmente no passo 0
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        studio_id: studio?.id || null, // Nulo para alunos/profs sem convite
        role: role,
        tax_id: taxId,
        phone: cleanPhone,
        birth_date: birthDate || null,
        address: address || null
      }
    })
    logger.debug('🔑 Resultado do Supabase Auth admin.createUser:', { authData, authError });

    if (authError) {
      logger.error('❌ Erro ao criar auth user no Supabase Admin:', authError.message, authError.status, authError.name);
      if (studio) await supabaseAdmin.from('studios').delete().eq('id', studio.id);
      // Mensagem mais amigável para erros comuns do Supabase
      let userFriendlyError = 'Não foi possível criar sua conta agora. Por favor, tente novamente com outro e-mail.';
      let errorCode = 'AUTH_USER_CREATION_FAILED';
      if (authError.message.includes('AuthApiError: Email rate limit exceeded')) {
        userFriendlyError = 'Muitas tentativas de cadastro com este e-mail. Por favor, aguarde e tente novamente mais tarde.';
        errorCode = 'EMAIL_RATE_LIMIT';
      } else if (authError.message.includes('AuthApiError: Email already registered')) {
        userFriendlyError = 'Este e-mail já está em uso. Por favor, faça login ou use outro e-mail.';
        errorCode = 'EMAIL_ALREADY_REGISTERED';
      } else if (authError.message.includes('AuthApiError: Invalid email credentials')) {
        userFriendlyError = 'Formato de e-mail inválido. Por favor, insira um e-mail válido.';
        errorCode = 'INVALID_EMAIL_FORMAT';
      }
      throw new AppError(userFriendlyError, 400, errorCode);
    }

    if (!authData.user) {
      logger.error('❌ Supabase Auth retornou authData.user nulo após signUp, mas sem erro explícito.', authData);
      if (studio) await supabaseAdmin.from('studios').delete().eq('id', studio.id);
      throw new AppError('Erro inesperado no registro. Tente novamente.', 500, 'AUTH_USER_NULL_AFTER_SIGNUP');
    }

    // 2.2 Criar Perfil Específico da Role
    const user_id = authData.user.id;
    logger.info('👤 ID do usuário Supabase Auth:', user_id);

    if (role === 'student') {
      logger.info('➡️ Tentando criar perfil de aluno com dados:', { user_id, studio_id: studio?.id || null, name, email, phone: cleanPhone, cpf_cnpj: taxId, birth_date: birthDate, address });
      const { error: studentError } = await supabaseAdmin.from('students').insert({
        id: user_id, // Usar 'id' em vez de 'user_id' para consistência com o schema.sql
        studio_id: studio?.id || null,
        name,
        email,
        phone: cleanPhone,
        cpf_cnpj: taxId,
        birth_date: birthDate || null,
        address: address || null,
        status: 'active',
      });
      if (studentError) {
        logger.error('❌ Erro ao criar perfil de aluno:', studentError);
        await supabaseAdmin.auth.admin.deleteUser(user_id!); 
        if (studio) await supabaseAdmin.from('studios').delete().eq('id', studio.id);
        throw new AppError('Falha ao criar perfil de aluno', 500, 'STUDENT_PROFILE_CREATION_FAILED');
      }
      logger.info('✅ Perfil de aluno criado com sucesso.');
    } else if (role === 'teacher') {
      logger.info('➡️ Tentando criar perfil de professor com dados:', { user_id, studio_id: studio?.id || null, name, email, phone: cleanPhone, cpf_cnpj: taxId, birth_date: birthDate, address });
      const { error: teacherError } = await supabaseAdmin.from('teachers').insert({
        user_id,
        studio_id: studio?.id || null,
        name,
        email,
        phone: cleanPhone,
        cpf_cnpj: taxId,
        birth_date: birthDate || null,
        address: address || null,
        status: 'active',
      });
      if (teacherError) {
        logger.error('❌ Erro ao criar perfil de professor:', teacherError);
        await supabaseAdmin.auth.admin.deleteUser(user_id!); 
        if (studio) await supabaseAdmin.from('studios').delete().eq('id', studio.id);
        throw new AppError('Falha ao criar perfil de professor', 500, 'TEACHER_PROFILE_CREATION_FAILED');
      }
      logger.info('✅ Perfil de professor criado com sucesso.');
    } else if (role === 'partner' || role === 'affiliate') {
      logger.info('➡️ Tentando criar perfil de parceiro/afiliado com dados:', { user_id, name, email });
      
      const slug = await generateUniqueSlug(name || 'partner', 'partners');

      const { error: partnerError } = await supabaseAdmin.from('partners').insert({
        user_id,
        name,
        slug,
        commission_rate: SYSTEM_CONFIG.DEFAULT_PARTNER_COMMISSION,
      });

      if (partnerError) {
        logger.error('❌ Erro ao criar perfil de parceiro:', partnerError);
        await supabaseAdmin.auth.admin.deleteUser(user_id!); 
        throw new AppError('Falha ao criar perfil de parceiro', 500, 'PARTNER_PROFILE_CREATION_FAILED');
      }
      logger.info('✅ Perfil de parceiro criado com sucesso.');
    } else if (role === 'admin') {
      logger.info('➡️ Tentando criar perfil de administrador com dados:', { user_id, studio_id: studio?.id, name, email, phone: cleanPhone, cpf_cnpj: taxId, role: 'admin', birth_date: birthDate, address });
      const { error: adminError } = await supabaseAdmin.from('users_internal').insert({
        id: user_id,
        studio_id: studio?.id,
        name,
        email,
        phone: cleanPhone,
        cpf_cnpj: taxId,
        birth_date: birthDate || null,
        address: address || null,
        role: 'admin',
        status: 'active',
      });
      if (adminError) {
        logger.error('❌ Erro ao criar perfil de administrador:', adminError);
        await supabaseAdmin.auth.admin.deleteUser(user_id!); 
        if (studio) await supabaseAdmin.from('studios').delete().eq('id', studio.id);
        throw new AppError('Falha ao criar perfil de administrador', 500, 'ADMIN_PROFILE_CREATION_FAILED');
      }
      logger.info('✅ Perfil de administrador criado com sucesso.');
    }

    // 2.3 Garantir Sessão (Auto-login)
    let finalSession = (authData as any).session;
    if (!finalSession) {
      logger.warn('⚠️ Nenhuma sessão retornada após createUser. Tentando signInWithPassword para auto-login...');
      
      // Tentar login imediato. Se falhar, tentar mais uma vez após pequeno delay.
      const authClient = createClient(supabaseUrl, supabaseAnonKey);
      let { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({ email, password });
      
      if (signInError) {
        logger.warn('⚠️ Primeira tentativa de auto-login falhou, tentando novamente em 1.5s...', signInError.message);
        await new Promise(resolve => setTimeout(resolve, 1500));
        const retry = await authClient.auth.signInWithPassword({ email, password });
        signInData = retry.data;
        signInError = retry.error;
      }

      if (signInError) {
        logger.error('❌ Erro no auto-login após registro:', signInError);
      }
      if (signInData?.session) finalSession = signInData.session;
    }
    logger.info('✅ Sessão final:', finalSession ? 'Presente' : 'Ausente');

    const response = successResponse({
      user: {
        id: authData.user.id,
        name,
        email,
        role: role,
        taxId: taxId,
        phone: cleanPhone,
        birthDate: birthDate || null,
        address: address || null,
        studio_id: studio?.id || null,
        studioName: studio?.name || "Workflow AI",
        studioSlug: studio?.slug || "",
      },
      session: finalSession
    });
    // 3. Setar Cookies para o Middleware
    if (finalSession) {
      logger.info('🍪 Definindo cookies de sessão.');
      response.cookies.set('sb-auth-token', finalSession.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: finalSession.expires_in,
        path: '/',
      })

      response.cookies.set('user-role', role, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: finalSession.expires_in,
        path: '/',
      })
    }

    return response

  } catch (error: any) {
    logger.error('💥 Erro fatal no registro:', error)
    return errorResponse(error, 500);
  }
}
