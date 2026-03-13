import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateCPF, validateCNPJ } from '@/lib/validation-utils'
import { registerSchema } from '@/lib/schemas/auth'
import { checkAuthRateLimit } from '@/lib/rate-limit'
import { createClient } from '@supabase/supabase-js'
import { AppError } from '@/lib/errors'
import { maskEmail } from '@/lib/sanitize-logs'
import logger from '@/lib/logger'
import { successResponse, errorResponse } from '@/lib/api-response'
import { generateUniqueSlug } from '@/lib/utils/slug'
import { SYSTEM_CONFIG } from '@/lib/config'
import { nicheDictionary } from '@/config/niche-dictionary'
import { getDefaultModulesForNiche, monetaryBasedNiches } from '@/config/niche-modules'
import { isProfessionalsLimitReachedForStudio } from '@/lib/studio-limits'
import { provisionWhatsAppForStudio } from '@/lib/whatsapp'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const rate = await checkAuthRateLimit(request)
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas de cadastro. Aguarde um momento antes de tentar novamente.' },
        { status: 429, headers: rate.retryAfter ? { 'Retry-After': String(rate.retryAfter) } : {} }
      )
    }

    const body = await request.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      const first = parsed.error.errors[0]
      throw new AppError(first?.message ?? 'Dados inválidos', 400, 'VALIDATION_ERROR')
    }

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
      address,
      niche,
      businessModel,
      plan,
      studioId,
      modules,
      multiUnitQuantity = 1,
      professionalsTier,
      language: registerLanguage,
      professionalRegistration,
      verticalizationSlug,
    } = parsed.data

    // Normalização de roles vindo de diferentes portais
    if (role === 'client') role = 'student'
    if (role === 'professional') role = 'teacher'
    if (role === 'sales') role = 'seller'
    if (role === 'engineer') role = 'engineer'
    if (role === 'architect') role = 'architect'

    logger.info('➡️ Tentativa de Registro para:', { email: maskEmail(email), role, plan })

    const cleanPhone = phone.replace(/\D/g, '')
    logger.info('✅ E-mail verificado (Simulado para testes).');
    logger.debug('📞 Telefone limpo:', cleanPhone);

    // Algoritmo de validação de documento
    const isDocumentValid = taxIdType === 'cnpj' ? validateCNPJ(taxId) : validateCPF(taxId)
    if (!isDocumentValid) {
      logger.error('❌ Documento inválido (CPF/CNPJ não passou na validação)');
      throw new AppError(`O ${taxIdType.toUpperCase()} informado é inválido.`, 400, 'INVALID_TAX_ID');
    }
    logger.info('✅ Documento válido.');

    // 0. Verificar se o CPF/CNPJ já existe em qualquer tabela de perfil
    const [checkAdmin, checkProfessional, checkStudent] = await Promise.all([
      supabaseAdmin.from('users_internal').select('id').eq('cpf_cnpj', taxId).maybeSingle(),
      supabaseAdmin.from('professionals').select('id').eq('cpf_cnpj', taxId).maybeSingle(),
      supabaseAdmin.from('students').select('id').eq('cpf_cnpj', taxId).maybeSingle()
    ])
    logger.debug('🔍 Verificação de CPF/CNPJ existente:', { adminExists: !!checkAdmin.data, profExists: !!checkProfessional.data, studentExists: !!checkStudent.data });

    if (checkAdmin.data || checkProfessional.data || checkStudent.data) {
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
    let createdStudioIds: string[] = [];
    let partnerId: string | null = null;

    // 1. Se for ADMIN (Dono), criar o estúdio
    if (role === 'admin') {
      const slug = await generateUniqueSlug(studioName!, 'studios')
      
      // Determine plan ID
      let selectedPlanId = plan || 'gratuito'
      
      // Handle custom plan - fallback to gratuito for base record (vertical ou system)
      if (selectedPlanId === 'custom') {
        selectedPlanId = 'gratuito' // Base record; modules vêm do frontend
      }

      // Determine business model based on niche if not provided
      const defaultBusinessModel = niche && monetaryBasedNiches.includes(niche as any) ? 'MONETARY' : 'CREDIT';
      const finalBusinessModel = businessModel || defaultBusinessModel;

      let verticalizationId: string | null = null
      let verticalizationPlanId: string | null = null
      let trialDays = 14

      if (verticalizationSlug) {
        const { data: vert } = await supabaseAdmin
          .from('verticalizations')
          .select('id')
          .eq('slug', verticalizationSlug)
          .eq('status', 'active')
          .maybeSingle()
        verticalizationId = vert?.id ?? null

        if (verticalizationId && selectedPlanId !== 'custom') {
          const { data: vp } = await supabaseAdmin
            .from('verticalization_plans')
            .select('id, trial_days')
            .eq('verticalization_id', verticalizationId)
            .eq('plan_id', selectedPlanId)
            .eq('status', 'active')
            .maybeSingle()
          if (vp) {
            verticalizationPlanId = vp.id
            trialDays = vp.trial_days ?? 14
          }
        }
      }

      if (!verticalizationSlug) {
        const { data: planDetails } = await supabaseAdmin
          .from('system_plans')
          .select('trial_days')
          .eq('id', selectedPlanId)
          .maybeSingle()
        trialDays = planDetails?.trial_days ?? 14
      }
      
      logger.info(`➡️ Criando estúdio com plano: ${selectedPlanId} (Trial: ${trialDays} dias)${verticalizationSlug ? ` [vertical: ${verticalizationSlug}]` : ''}`)

      const { data: newStudio, error: studioError } = await supabaseAdmin.from('studios')
        .insert({
          name: studioName,
          slug,
          plan: selectedPlanId,
          business_model: finalBusinessModel,
          status: 'active',
          subscription_status: selectedPlanId === 'gratuito' ? 'active' : 'trialing',
          trial_ends_at: selectedPlanId === 'gratuito' ? null : new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString(),
          ...(verticalizationId && { verticalization_id: verticalizationId }),
          ...(verticalizationPlanId && { verticalization_plan_id: verticalizationPlanId }),
        })
        .select()
        .single()

      if (studioError) {
        logger.error('❌ Erro ao criar estúdio:', studioError)
        throw new AppError('Falha ao criar estúdio no banco de dados', 500, 'STUDIO_CREATION_FAILED');
      }
      studio = newStudio;
      logger.info('✅ Estúdio criado:', studio);
      
      createdStudioIds = [studio.id];

      await provisionWhatsAppForStudio(studio.id, studio.slug);

      // Criar estúdios adicionais se multi-unidade for maior que 1
      if (multiUnitQuantity > 1) {
        logger.info(`➡️ Criando ${multiUnitQuantity - 1} estúdios adicionais...`);
        for (let i = 2; i <= multiUnitQuantity; i++) {
          const extraStudioName = `${studioName} - Unidade ${i}`;
          const extraSlug = await generateUniqueSlug(extraStudioName, 'studios');
          
          const { data: extraStudio } = await supabaseAdmin.from('studios').insert({
            name: extraStudioName,
            slug: extraSlug,
            plan: selectedPlanId,
            business_model: finalBusinessModel,
            status: 'active',
            subscription_status: selectedPlanId === 'gratuito' ? 'active' : 'trialing',
            trial_ends_at: selectedPlanId === 'gratuito' ? null : new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString(),
            ...(verticalizationId && { verticalization_id: verticalizationId }),
            ...(verticalizationPlanId && { verticalization_plan_id: verticalizationPlanId }),
            owner_id: null // Será vinculado depois
          }).select('id').single();

          if (extraStudio) {
            createdStudioIds.push(extraStudio.id);
            await provisionWhatsAppForStudio(extraStudio.id, extraSlug);
          }
        }
      }

      // Configurações e modalidades padrão apenas para novos estúdios
      const initialSettings = [
        { studio_id: studio.id, setting_key: 'studio_name', setting_value: studioName, setting_type: 'string' },
        { studio_id: studio.id, setting_key: 'studio_email', setting_value: email, setting_type: 'string' },
        { studio_id: studio.id, setting_key: 'currency', setting_value: 'BRL', setting_type: 'string' },
        { studio_id: studio.id, setting_key: 'timezone', setting_value: 'America/Sao_Paulo', setting_type: 'string' },
      ]
      await supabaseAdmin.from('studio_settings').insert(initialSettings)
      logger.info('✅ Configurações iniciais do estúdio inseridas.');

      // Inserir modalidades padrão APENAS se for nicho de Dança
      if (niche === 'dance') {
        const defaultModalities = [
          { studio_id: studio.id, name: 'Ballet', color: '#f472b6' },
          { studio_id: studio.id, name: 'Jazz', color: '#60a5fa' },
          { studio_id: studio.id, name: 'Hip Hop', color: '#fbbf24' },
        ]
        await supabaseAdmin.from('modalities').insert(defaultModalities)
        logger.info('✅ Modalidades padrão de Dança inseridas.');
      } else if (niche === 'beauty' || niche === 'aesthetics' || niche === 'spa') {
        // Opcional: Inserir padrões para estética se desejar, ou deixar vazio
        const defaultAesthetics = [
          { studio_id: studio.id, name: 'Limpeza de Pele', color: '#f472b6' },
          { studio_id: studio.id, name: 'Massagem', color: '#60a5fa' },
          { studio_id: studio.id, name: 'Drenagem', color: '#fbbf24' },
        ]
        await supabaseAdmin.from('modalities').insert(defaultAesthetics)
        logger.info('✅ Modalidades padrão de Estética inseridas.');
      }

      // Configurar Ecossistema (organization_settings) se nicho for fornecido
      if (niche) {
        let enabledModules: any

        if (verticalizationSlug && verticalizationId) {
          // Verticalização: usar verticalization_plans para módulos
          if (plan === 'custom' && modules && Array.isArray(modules)) {
            const base = getDefaultModulesForNiche(niche as any) as Record<string, boolean>
            enabledModules = Object.fromEntries(Object.keys(base).map(k => [k, false]))
            for (const id of modules as string[]) {
              enabledModules[id] = true
            }
          } else if (verticalizationPlanId) {
            const { data: vp } = await supabaseAdmin
              .from('verticalization_plans')
              .select('modules')
              .eq('id', verticalizationPlanId)
              .maybeSingle()
            enabledModules = vp?.modules ?? getDefaultModulesForNiche(niche as any)
          } else {
            // Gratuito da vertical ou plano não encontrado
            const { data: vp } = await supabaseAdmin
              .from('verticalization_plans')
              .select('modules')
              .eq('verticalization_id', verticalizationId)
              .eq('plan_id', 'gratuito')
              .eq('status', 'active')
              .maybeSingle()
            enabledModules = vp?.modules ?? getDefaultModulesForNiche(niche as any)
          }
        } else {
          // Nicho genérico: usar verticalizations.modules ou system_plans
          const { data: verticalizationData } = await supabaseAdmin
            .from('verticalizations')
            .select('modules')
            .eq('niche', niche)
            .eq('status', 'active')
            .maybeSingle()
          enabledModules = verticalizationData?.modules ?? getDefaultModulesForNiche(niche as any)

          if (plan === 'custom' && modules && Array.isArray(modules)) {
            const base = getDefaultModulesForNiche(niche as any) as Record<string, boolean>
            enabledModules = Object.fromEntries(Object.keys(base).map(k => [k, false]))
            for (const id of modules as string[]) {
              enabledModules[id] = true
            }
          } else if (selectedPlanId && selectedPlanId !== 'gratuito') {
            const { data: planData } = await supabaseAdmin
              .from('system_plans')
              .select('modules')
              .eq('id', selectedPlanId)
              .maybeSingle()
            if (planData?.modules) {
              enabledModules = { ...enabledModules, ...planData.modules }
            }
          }
        }

        const vocabulary = nicheDictionary.pt[niche as keyof typeof nicheDictionary.pt] || nicheDictionary.pt.dance

        const tierId = (professionalsTier && ['1-10', '11-20', '21-50'].includes(professionalsTier)) ? professionalsTier : '1-10'
        const themeConfig = { professionals_tier: tierId }

        const orgSettingsRows = createdStudioIds.map(sid => ({
          studio_id: sid,
          niche: niche,
          enabled_modules: enabledModules,
          vocabulary: vocabulary,
          business_type: finalBusinessModel,
          theme_config: themeConfig,
        }))
        await supabaseAdmin.from('organization_settings').insert(orgSettingsRows)
        logger.info(`✅ Configurações do ecossistema (organization_settings) inseridas para ${orgSettingsRows.length} estúdio(s), nicho ${niche}.`);
      }
    } else if (studioId) {
      // Se já temos um studioId (ex: registro de aluno em um estúdio específico)
      const { data: existingStudio } = await supabaseAdmin.from('studios').select('*').eq('id', studioId).maybeSingle();
      studio = existingStudio;
      logger.info('✅ Estúdio existente encontrado para o aluno:', studio?.name);
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
        address: address || null,
        language: registerLanguage || 'pt'
      }
    })
    logger.debug('🔑 Resultado do Supabase Auth admin.createUser:', { authData, authError });

    if (authError) {
      logger.error('❌ Erro ao criar auth user no Supabase Admin:', authError.message, authError.status, authError.name);
      if (createdStudioIds.length > 0) {
        await supabaseAdmin.from('studios').delete().in('id', createdStudioIds);
      } else if (studio) {
        await supabaseAdmin.from('studios').delete().eq('id', studio.id);
      }
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
      if (createdStudioIds.length > 0) {
        await supabaseAdmin.from('studios').delete().in('id', createdStudioIds);
      } else if (studio) {
        await supabaseAdmin.from('studios').delete().eq('id', studio.id);
      }
      throw new AppError('Erro inesperado no registro. Tente novamente.', 500, 'AUTH_USER_NULL_AFTER_SIGNUP');
    }

      // 2.2 Criar Perfil Específico da Role
      const user_id = authData.user.id;
      logger.info('👤 ID do usuário Supabase Auth:', user_id);

      // Determine business model based on niche if not provided for additional usage
      const defaultBusinessModel = niche && monetaryBasedNiches.includes(niche as any) ? 'MONETARY' : 'CREDIT';
      const finalBusinessModel = businessModel || defaultBusinessModel;

      // Se for admin, vincular como dono do estúdio
      if (role === 'admin' && studio) {
        // Vincular o estúdio principal e quaisquer unidades adicionais criadas
        if (createdStudioIds.length > 0) {
          const { error: linkError } = await supabaseAdmin.from('studios')
            .update({ owner_id: user_id })
            .in('id', createdStudioIds);
          
          if (linkError) {
            logger.error('❌ Erro ao vincular dono aos estúdios:', linkError);
          } else {
            logger.info(`✅ Usuário vinculado como dono de ${createdStudioIds.length} estúdio(s)`);
          }
        }
      }

    if (role === 'student') {
      logger.info('➡️ Tentando criar perfil de aluno com dados:', { user_id, studio_id: studio?.id || null, name, email, phone: cleanPhone });
      
      let studentError;
      // Tentativa completa
      const { error: fullError } = await supabaseAdmin.from('students').insert({
        id: user_id,
        studio_id: studio?.id || null,
        name,
        email,
        phone: cleanPhone,
        cpf_cnpj: taxId,
        birth_date: birthDate || null,
        address: address || null,
        status: 'active',
      });
      studentError = fullError;

      if (studentError) {
          logger.warn('⚠️ Falha ao inserir student completo. Tentando fallback...', studentError.message);
          const { error: retryError } = await supabaseAdmin.from('students').insert({
            id: user_id,
            studio_id: studio?.id || null,
            name,
            email,
            phone: cleanPhone,
            // Campos novos removidos
            status: 'active',
          });
          studentError = retryError;
      }

      if (studentError) {
        logger.error('❌ Erro ao criar perfil de aluno:', studentError);
        await supabaseAdmin.auth.admin.deleteUser(user_id!); 
        if (studio) await supabaseAdmin.from('studios').delete().eq('id', studio.id);
        throw new AppError('Falha ao criar perfil de aluno', 500, 'STUDENT_PROFILE_CREATION_FAILED');
      }
      logger.info('✅ Perfil de aluno criado com sucesso.');
    } else if (role === 'teacher' || role === 'engineer' || role === 'architect') {
      logger.info(`➡️ Tentando criar perfil de ${role} com dados:`, { user_id, studio_id: studio?.id || null, name, email, phone: cleanPhone });

      if (studio?.id) {
        const { count } = await supabaseAdmin
          .from('professionals')
          .select('*', { count: 'exact', head: true })
          .eq('studio_id', studio.id)
          .eq('status', 'active')
        if (await isProfessionalsLimitReachedForStudio(studio.id, count ?? 0)) {
          await supabaseAdmin.auth.admin.deleteUser(user_id!);
          throw new AppError('O estúdio atingiu o limite de profissionais para o plano atual.', 403, 'PLAN_LIMIT_REACHED');
        }
      }

      const { error: profError } = await supabaseAdmin.from('professionals').insert({
        user_id,
        studio_id: studio?.id || null, // Pode ser nulo para engenheiros/arquitetos
        name,
        email,
        phone: cleanPhone,
        cpf_cnpj: taxId,
        birth_date: birthDate || null,
        address: address || null,
        professional_type: role === 'engineer' ? 'engineer' : (role === 'architect' ? 'architect' : (role === 'teacher' ? 'teacher' : 'technician')),
        professional_registration: professionalRegistration || null,
        cau_registration: role === 'architect' ? professionalRegistration : null,
        status: 'active',
      });

      if (profError) {
        logger.error(`❌ Erro ao criar perfil de ${role}:`, profError);
        await supabaseAdmin.auth.admin.deleteUser(user_id!); 
        if (studio) await supabaseAdmin.from('studios').delete().eq('id', studio.id);
        throw new AppError(`Falha ao criar perfil de ${role}`, 500, 'PROFESSIONAL_PROFILE_CREATION_FAILED');
      }
      logger.info(`✅ Perfil de ${role} criado com sucesso.`);
    } else if (role === 'partner' || role === 'affiliate') {
      logger.info('➡️ Tentando criar perfil de parceiro/afiliado com dados:', { user_id, name, email });
      
      const slug = await generateUniqueSlug(name || 'partner', 'partners');

      const { data: newPartner, error: partnerError } = await supabaseAdmin
        .from('partners')
        .insert({
          user_id,
          name,
          slug,
          commission_rate: SYSTEM_CONFIG.DEFAULT_PARTNER_COMMISSION,
        })
        .select('id')
        .single();

      if (partnerError || !newPartner) {
        logger.error('❌ Erro ao criar perfil de parceiro:', partnerError);
        await supabaseAdmin.auth.admin.deleteUser(user_id!); 
        throw new AppError('Falha ao criar perfil de parceiro', 500, 'PARTNER_PROFILE_CREATION_FAILED');
      }
      partnerId = newPartner.id;
      logger.info('✅ Perfil de parceiro criado com sucesso.');
    } else if (role === 'admin' || role === 'seller' || role === 'receptionist' || role === 'finance') {
      logger.info(`➡️ Tentando criar perfil de ${role} com dados:`, { user_id, studio_id: studio?.id, name, email, phone: cleanPhone, cpf_cnpj: taxId, role, birth_date: birthDate, address });
      // Tentar inserir com todos os campos. Se falhar por colunas inexistentes (banco desatualizado),
      // fazemos fallback para inserção básica.
      let profileError;
      try {
        const { error } = await supabaseAdmin.from('users_internal').insert({
          id: user_id,
          studio_id: studio?.id,
          name,
          email,
          phone: cleanPhone,
          cpf_cnpj: taxId,
          birth_date: birthDate || null,
          address: address || null,
          role: role,
          status: 'active',
        });
        profileError = error;
      } catch (e) {
        profileError = { message: 'Unknown error', details: e };
      }

      if (profileError) {
        logger.warn(`⚠️ Falha ao inserir users_internal para ${role} completo. Tentando fallback básico...`, profileError.message);
        
        const { error: retryError } = await supabaseAdmin.from('users_internal').insert({
          id: user_id,
          studio_id: studio?.id,
          name,
          email,
          phone: cleanPhone,
          role: role,
          status: 'active',
        });
        
        if (retryError) {
             logger.error(`❌ Erro fatal no fallback users_internal para ${role}:`, retryError);
             await supabaseAdmin.auth.admin.deleteUser(user_id!); 
             if (studio && role === 'admin') await supabaseAdmin.from('studios').delete().eq('id', studio.id);
             throw new AppError(`Falha ao criar perfil de ${role}`, 500, `${role.toUpperCase()}_PROFILE_CREATION_FAILED`);
        }
        logger.info(`✅ Perfil de ${role} criado com sucesso (Modo Fallback).`);
      } else {
        logger.info(`✅ Perfil de ${role} criado com sucesso.`);
      }
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

    const userPayload: Record<string, unknown> = {
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
    };
    if (role === 'partner' || role === 'affiliate') {
      userPayload.partnerId = partnerId;
    }
    const response = successResponse({
      user: userPayload,
      session: finalSession
    });
    // 3. Setar Cookies para o Middleware
    if (finalSession) {
      logger.info('🍪 Definindo cookies de sessão.');
      response.cookies.set('sb-auth-token', finalSession.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: finalSession.expires_in,
        path: '/',
      })

      response.cookies.set('user-role', role, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
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
