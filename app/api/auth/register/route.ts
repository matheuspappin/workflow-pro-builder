import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateCPF, validateCNPJ } from '@/lib/validation-utils'
import { createClient } from '@supabase/supabase-js'

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

    console.log('➡️ Tentativa de Registro para:', { email, role, taxId, phone });

    if (!name || !email || !password || !taxId || !phone) {
      console.error('❌ Campos obrigatórios faltando.');
      return NextResponse.json({ error: 'Nome, e-mail, documento, telefone e senha são obrigatórios' }, { status: 400 })
    }

    // 0. Verificar se o e-mail foi verificado
    const cleanPhone = phone.replace(/\D/g, '')
    console.log('📧 Verificando e-mail:', email);
    const { data: emailVerification, error: emailVerificationError } = await supabaseAdmin
      .from('email_verifications')
      .select('verified, created_at')
      .eq('email', email)
      .eq('verified', true)
      .maybeSingle()

    if (emailVerificationError) {
      console.error('❌ Erro ao verificar e-mail:', emailVerificationError);
      return NextResponse.json({ error: 'Erro ao verificar e-mail.' }, { status: 500 });
    }

    if (!emailVerification) {
      console.error('❌ E-mail não verificado.');
      return NextResponse.json({ error: 'O e-mail não foi verificado. Por favor, valide o código enviado ao seu e-mail.' }, { status: 400 })
    }
    console.log('✅ E-mail verificado.');
    console.log('📞 Telefone limpo:', cleanPhone);

    // Algoritmo de validação de documento
    const isDocumentValid = taxIdType === 'cnpj' ? validateCNPJ(taxId) : validateCPF(taxId)
    if (!isDocumentValid) {
      console.error('❌ Documento inválido:', taxId);
      return NextResponse.json({ error: `O ${taxIdType.toUpperCase()} informado é inválido.` }, { status: 400 })
    }
    console.log('✅ Documento válido.');

    // 0. Verificar se o CPF/CNPJ já existe em qualquer tabela de perfil
    const [checkAdmin, checkTeacher, checkStudent] = await Promise.all([
      supabaseAdmin.from('users_internal').select('id').eq('cpf_cnpj', taxId).maybeSingle(),
      supabaseAdmin.from('teachers').select('id').eq('cpf_cnpj', taxId).maybeSingle(),
      supabaseAdmin.from('students').select('id').eq('cpf_cnpj', taxId).maybeSingle()
    ])
    console.log('🔍 Verificação de CPF/CNPJ existente:', { checkAdmin: checkAdmin.data, checkTeacher: checkTeacher.data, checkStudent: checkStudent.data });

    if (checkAdmin.data || checkTeacher.data || checkStudent.data) {
      console.error('❌ CPF/CNPJ já existe.');
      return NextResponse.json({ 
        error: 'Este CPF/CNPJ já está vinculado a uma conta ativa. Use outro documento ou recupere sua senha.' 
      }, { status: 400 })
    }

    if (role === 'admin' && !studioName) {
      console.error('❌ Nome do estúdio é obrigatório para donos.');
      return NextResponse.json({ error: 'Nome do estúdio é obrigatório para donos' }, { status: 400 })
    }

    // Bloqueio de segurança: ninguém pode se registrar como super_admin diretamente
    if (role === 'super_admin') {
      console.error('❌ Tentativa de registro como super_admin.');
      return NextResponse.json({ error: 'Operação não permitida.' }, { status: 403 })
    }

    let studio = null;

    // 1. Se for ADMIN (Dono), criar o estúdio
    if (role === 'admin') {
      const slugBase = studioName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')

      const { data: newStudio, error: studioError } = await supabaseAdmin.from('studios')
        .insert({
          name: studioName,
          slug: `${slugBase}-${Math.floor(Math.random() * 1000)}`,
          plan: 'gratuito',
          status: 'active',
          subscription_status: 'trialing',
          trial_ends_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single()

      if (studioError) {
        console.error('❌ Erro ao criar estúdio:', studioError)
        return NextResponse.json({ error: 'Falha ao criar estúdio no banco de dados' }, { status: 500 })
      }
      studio = newStudio;
      console.log('✅ Estúdio criado:', studio);

      // Configurações e modalidades padrão apenas para novos estúdios
      const initialSettings = [
        { studio_id: studio.id, setting_key: 'studio_name', setting_value: studioName, setting_type: 'string' },
        { studio_id: studio.id, setting_key: 'studio_email', setting_value: email, setting_type: 'string' },
        { studio_id: studio.id, setting_key: 'currency', setting_value: 'BRL', setting_type: 'string' },
        { studio_id: studio.id, setting_key: 'timezone', setting_value: 'America/Sao_Paulo', setting_type: 'string' },
      ]
      await supabaseAdmin.from('studio_settings').insert(initialSettings)
      console.log('✅ Configurações iniciais do estúdio inseridas.');

      const defaultModalities = [
        { studio_id: studio.id, name: 'Ballet', color: '#f472b6' },
        { studio_id: studio.id, name: 'Jazz', color: '#60a5fa' },
        { studio_id: studio.id, name: 'Hip Hop', color: '#fbbf24' },
      ]
      await supabaseAdmin.from('modalities').insert(defaultModalities)
      console.log('✅ Modalidades padrão inseridas.');
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
    console.log('🔑 Resultado do Supabase Auth admin.createUser:', { authData, authError });

    if (authError) {
      console.error('❌ Erro ao criar auth user no Supabase Admin:', authError.message, authError.status, authError.name);
      if (studio) await supabaseAdmin.from('studios').delete().eq('id', studio.id);
      // Mensagem mais amigável para erros comuns do Supabase
      let userFriendlyError = 'Não foi possível criar sua conta agora. Por favor, tente novamente com outro e-mail.';
      if (authError.message.includes('AuthApiError: Email rate limit exceeded')) {
        userFriendlyError = 'Muitas tentativas de cadastro com este e-mail. Por favor, aguarde e tente novamente mais tarde.';
      } else if (authError.message.includes('AuthApiError: Email already registered')) {
        userFriendlyError = 'Este e-mail já está em uso. Por favor, faça login ou use outro e-mail.';
      } else if (authError.message.includes('AuthApiError: Invalid email credentials')) {
        userFriendlyError = 'Formato de e-mail inválido. Por favor, insira um e-mail válido.';
      }
      return NextResponse.json({ error: userFriendlyError }, { status: 400 });
    }

    if (!authData.user) {
      console.error('❌ Supabase Auth retornou authData.user nulo após signUp, mas sem erro explícito.', authData);
      if (studio) await supabaseAdmin.from('studios').delete().eq('id', studio.id);
      return NextResponse.json({ error: 'Erro inesperado no registro. Tente novamente.' }, { status: 500 });
    }

    // 2.2 Criar Perfil Específico da Role
    const user_id = authData.user.id;
    console.log('👤 ID do usuário Supabase Auth:', user_id);

    if (role === 'student') {
      console.log('➡️ Tentando criar perfil de aluno com dados:', { user_id, studio_id: studio?.id || null, name, email, phone: cleanPhone, cpf_cnpj: taxId, birth_date: birthDate, address });
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
        console.error('❌ Erro ao criar perfil de aluno:', studentError);
        await supabaseAdmin.auth.admin.deleteUser(user_id!); 
        if (studio) await supabaseAdmin.from('studios').delete().eq('id', studio.id);
        return NextResponse.json({ error: 'Falha ao criar perfil de aluno' }, { status: 500 });
      }
      console.log('✅ Perfil de aluno criado com sucesso.');
    } else if (role === 'teacher') {
      console.log('➡️ Tentando criar perfil de professor com dados:', { user_id, studio_id: studio?.id || null, name, email, phone: cleanPhone, cpf_cnpj: taxId, birth_date: birthDate, address });
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
        console.error('❌ Erro ao criar perfil de professor:', teacherError);
        await supabaseAdmin.auth.admin.deleteUser(user_id!); 
        if (studio) await supabaseAdmin.from('studios').delete().eq('id', studio.id);
        return NextResponse.json({ error: 'Falha ao criar perfil de professor' }, { status: 500 });
      }
      console.log('✅ Perfil de professor criado com sucesso.');
    } else if (role === 'partner' || role === 'affiliate') {
      console.log('➡️ Tentando criar perfil de parceiro/afiliado com dados:', { user_id, name, email });
      
      const slugBase = (name || 'partner').toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      const slug = `${slugBase}-${Math.floor(Math.random() * 1000)}`;

      const { error: partnerError } = await supabaseAdmin.from('partners').insert({
        user_id,
        name,
        slug,
        commission_rate: 10, // Default commission 10%
      });

      if (partnerError) {
        console.error('❌ Erro ao criar perfil de parceiro:', partnerError);
        await supabaseAdmin.auth.admin.deleteUser(user_id!); 
        return NextResponse.json({ error: 'Falha ao criar perfil de parceiro' }, { status: 500 });
      }
      console.log('✅ Perfil de parceiro criado com sucesso.');
    } else if (role === 'admin') {
      console.log('➡️ Tentando criar perfil de administrador com dados:', { user_id, studio_id: studio?.id, name, email, phone: cleanPhone, cpf_cnpj: taxId, role: 'admin', birth_date: birthDate, address });
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
        console.error('❌ Erro ao criar perfil de administrador:', adminError);
        await supabaseAdmin.auth.admin.deleteUser(user_id!); 
        if (studio) await supabaseAdmin.from('studios').delete().eq('id', studio.id);
        return NextResponse.json({ error: 'Falha ao criar perfil de administrador' }, { status: 500 });
      }
      console.log('✅ Perfil de administrador criado com sucesso.');
    }

    // 2.3 Garantir Sessão (Auto-login)
    let finalSession = (authData as any).session;
    if (!finalSession) {
      console.warn('⚠️ Nenhuma sessão retornada após createUser. Tentando signInWithPassword para auto-login...');
      
      // Tentar login imediato. Se falhar, tentar mais uma vez após pequeno delay.
      const authClient = createClient(supabaseUrl, supabaseAnonKey);
      let { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({ email, password });
      
      if (signInError) {
        console.warn('⚠️ Primeira tentativa de auto-login falhou, tentando novamente em 1.5s...', signInError.message);
        await new Promise(resolve => setTimeout(resolve, 1500));
        const retry = await authClient.auth.signInWithPassword({ email, password });
        signInData = retry.data;
        signInError = retry.error;
      }

      if (signInError) {
        console.error('❌ Erro no auto-login após registro:', signInError);
      }
      if (signInData?.session) finalSession = signInData.session;
    }
    console.log('✅ Sessão final:', finalSession ? 'Presente' : 'Ausente');

    const response = NextResponse.json({
      success: true,
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
        studioName: studio?.name || "DanceFlow AI",
        studioSlug: studio?.slug || "",
      },
      session: finalSession
    })

    // 3. Setar Cookies para o Middleware
    if (finalSession) {
      console.log('🍪 Definindo cookies de sessão.');
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
    console.error('💥 Erro fatal no registro:', error)
    return NextResponse.json({ error: 'Erro interno ao processar cadastro' }, { status: 500 })
  }
}
