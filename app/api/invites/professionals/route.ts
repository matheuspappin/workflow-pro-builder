import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { AppError } from '@/lib/errors'
import logger from '@/lib/logger'
import { successResponse, errorResponse } from '@/lib/api-response'
import { isProfessionalsLimitReachedForStudio } from '@/lib/studio-limits'
import { checkStudioAccess } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Handler para criar um novo convite
export async function POST(request: NextRequest) {
  try {
    const { email, studioId, professionalType = 'technician', role: internalRole, createdByUserId, niche } = await request.json()
    const isInternalInvite = internalRole && ['finance', 'seller', 'receptionist', 'admin'].includes(internalRole)

    if (!studioId) {
      throw new AppError('ID do estúdio é obrigatório', 400, 'MISSING_REQUIRED_FIELDS');
    }

    // Validação de segurança: verificar se o usuário logado tem acesso ao estúdio
    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) {
      return access.response
    }

    // Garantir que o createdByUserId corresponde ao usuário autenticado ou que o usuário autenticado é admin
    if (createdByUserId && access.userId !== createdByUserId) {
       // Se foi passado um createdByUserId diferente do usuário logado, logamos um aviso mas permitimos 
       // se o usuário logado tiver permissão (checkStudioAccess já garantiu isso).
       // No entanto, para consistência, forçamos o ID do usuário autenticado.
       logger.warn(`Tentativa de criar convite com createdByUserId ${createdByUserId} diferente do usuário autenticado ${access.userId}. Usando ID autenticado.`);
    }
    const finalCreatorId = access.userId;

    // 1. Verificar se o estúdio existe e obter o plano
    const { data: studio, error: studioError } = await supabaseAdmin
      .from('studios')
      .select('id, name, plan')
      .eq('id', studioId)
      .maybeSingle()

    if (studioError || !studio) {
      throw new AppError('Estúdio não encontrado', 404, 'STUDIO_NOT_FOUND');
    }

    // (Opcional) Verificar se já existe um convite pendente para este e-mail e estúdio
    if (email) {
      const { data: existingInvite, error: existingInviteError } = await supabaseAdmin
        .from('studio_invites')
        .select('id')
        .eq('email', email)
        .eq('studio_id', studioId)
        .is('used_at', null)
        .maybeSingle()

      if (existingInviteError) logger.error('Erro ao buscar convite existente:', existingInviteError);
      if (existingInvite) {
        throw new AppError('Já existe um convite pendente para este e-mail neste estúdio.', 409, 'INVITE_ALREADY_EXISTS');
      }
    }

    // 3. Gerar token de convite único
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // 4. Inserir convite no banco de dados
    const metadataPayload = isInternalInvite
      ? { role: internalRole, ...(niche ? { niche } : {}) }
      : { professional_type: professionalType, ...(niche ? { niche } : {}) }

    const { data: newInvite, error: insertError } = await supabaseAdmin.from('studio_invites').insert({
      studio_id: studioId,
      email: email || null,
      token,
      created_by: finalCreatorId,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: metadataPayload,
      role: isInternalInvite ? internalRole : professionalType,
    }).select().single()

    if (insertError) {
      logger.error('Erro ao criar convite:', insertError);
      throw new AppError('Falha ao criar convite', 500, 'INVITE_CREATION_FAILED');
    }

    const inviteLink = `${request.headers.get('origin')}/setup/invite/${token}`;
    logger.info(`✉️ Link de convite ${email ? 'para ' + email : 'público'} gerado: ${inviteLink}`);
    
    return successResponse({ message: 'Convite criado com sucesso', inviteLink, inviteId: newInvite.id }, 201);

  } catch (error: any) {
    logger.error('💥 Erro na API de criação de convite:', error);
    return errorResponse(error, 500);
  }
}

// Handler para aceitar um convite (usado na página /setup/invite/[token])
export async function PUT(request: NextRequest) {
  try {
    const { token, userId, email } = await request.json()

    if (!token || !userId || !email) {
      throw new AppError('Token, ID do usuário e e-mail são obrigatórios', 400, 'MISSING_REQUIRED_FIELDS');
    }

    // 1. Buscar e validar o convite
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('studio_invites')
      .select('*, studio:studio_id(id, name, plan)')
      .eq('token', token)
      .maybeSingle()

    if (inviteError) logger.error('Erro ao buscar convite para validação:', inviteError);
    
    if (!invite) {
      throw new AppError('Convite inválido ou expirado.', 404, 'INVALID_OR_EXPIRED_INVITE');
    }

    // Se o convite tem um e-mail definido, ele é de uso único
    if (invite.email && invite.used_at) {
        throw new AppError('Este convite individual já foi utilizado.', 403, 'INVITE_ALREADY_USED');
    }

    if (new Date(invite.expires_at as string) < new Date()) {
      throw new AppError('Convite expirado.', 400, 'INVITE_EXPIRED');
    }

    const internalRole = invite.metadata?.role;
    const inviteNiche = invite.metadata?.niche || null;
    const isInternalInvite = internalRole && ['finance', 'seller', 'receptionist', 'admin'].includes(internalRole);
    const profType = invite.metadata?.professional_type || invite.role || 'technician'
    const isStudentInvite = !isInternalInvite && profType === 'student'

    if (isInternalInvite) {
      const { data: existingInternal } = await supabaseAdmin
        .from('users_internal')
        .select('id')
        .eq('id', userId)
        .eq('studio_id', invite.studio_id)
        .maybeSingle();

      if (existingInternal) {
        await supabaseAdmin.from('studio_invites').update({ used_at: new Date().toISOString() }).eq('id', invite.id);
        return successResponse({ message: 'Convite já aceito', studioId: invite.studio_id, role: internalRole }, 200);
      }

      const { error: internalError } = await supabaseAdmin.from('users_internal').insert({
        id: userId,
        studio_id: invite.studio_id,
        name: email.split('@')[0],
        email: email,
        role: internalRole,
        status: 'active',
      });

      if (internalError) {
        logger.error('Erro ao criar usuário interno:', internalError);
        throw new AppError('Falha ao vincular perfil financeiro/vendedor.', 500, 'INTERNAL_USER_LINK_FAILED');
      }

      await supabaseAdmin.from('studio_invites').update({ used_at: new Date().toISOString() }).eq('id', invite.id);

      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { studio_id: invite.studio_id, role: internalRole },
      });

      return successResponse({
        message: 'Convite aceito com sucesso',
        studioId: invite.studio_id,
        role: internalRole,
      }, 200);
    }

    // ── FLUXO: Convite de ALUNO (DanceFlow) ──────────────────────────────────
    if (isStudentInvite) {
      // Upsert do aluno na tabela students
      const { error: studentErr } = await supabaseAdmin
        .from('students')
        .upsert({
          id: userId,
          studio_id: invite.studio_id,
          name: email.split('@')[0],
          email,
          status: 'active',
        }, { onConflict: 'id' })

      if (studentErr) {
        logger.error('Erro ao upsert aluno:', studentErr)
        throw new AppError('Falha ao vincular perfil de aluno.', 500, 'STUDENT_LINK_FAILED')
      }

      // Inicializar créditos se não existirem
      const { data: existingCredits } = await supabaseAdmin
        .from('student_lesson_credits')
        .select('id')
        .eq('student_id', userId)
        .maybeSingle()

      if (!existingCredits) {
        const nextYear = new Date()
        nextYear.setFullYear(nextYear.getFullYear() + 1)
        await supabaseAdmin.from('student_lesson_credits').insert({
          student_id: userId,
          studio_id: invite.studio_id,
          total_credits: 0,
          remaining_credits: 0,
          expiry_date: nextYear.toISOString().split('T')[0],
        })
      }

      // Atualizar metadata auth
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { studio_id: invite.studio_id, role: 'student' },
      }).catch(e => logger.warn('Aviso: metadata auth aluno:', e))

      // Marcar convite como usado se nominal
      if (invite.email) {
        await supabaseAdmin.from('studio_invites').update({ used_at: new Date().toISOString() }).eq('id', invite.id)
      }

      logger.info(`✅ Aluno ${email} vinculado ao estúdio ${invite.studio_id}`)
      return successResponse({ message: 'Convite aceito com sucesso', studioId: invite.studio_id, role: 'student', niche: inviteNiche }, 200)
    }

    // Verificar limite antes de aceitar (respeita verticalization_plans)
    const { count: currentProfessionalsCount, error: countError } = await supabaseAdmin
      .from('professionals')
      .select('*', { count: 'exact', head: true })
      .eq('studio_id', invite.studio_id)
      .eq('status', 'active')

    if (!countError) {
      if (await isProfessionalsLimitReachedForStudio(invite.studio_id, currentProfessionalsCount || 0)) {
        throw new AppError('O estúdio atingiu o limite de profissionais para o plano atual.', 403, 'PLAN_LIMIT_REACHED');
      }
    }

    // 2. (Removido) Verificar se o e-mail do usuário autenticado corresponde ao do convite
    // A pedido do usuário, permitimos que qualquer conta logada aceite o convite via link.
    
    // 3. Verificar se o profissional já está vinculado a este estúdio (para evitar duplicatas)
    // OU se existe um perfil "órfão" (sem estúdio) que deve ser vinculado
    const { data: existingProfessionals, error: existingProfError } = await supabaseAdmin
      .from('professionals')
      .select('id, studio_id')
      .eq('user_id', userId)

    if (existingProfError) logger.error('Erro ao verificar profissionais existentes:', existingProfError);

    const existingProfessional = existingProfessionals?.find(p => p.studio_id === invite.studio_id);
    const orphanProfessional = existingProfessionals?.find(p => p.studio_id === null);

    if (existingProfessional) {
        // Se já existe, apenas marca o convite como usado e retorna sucesso.
        // Isso pode acontecer se o usuário tentar aceitar o mesmo convite várias vezes.
        logger.info(`Profissional ${userId} já está vinculado ao estúdio ${invite.studio_id}. Marcando convite como usado.`);
        const { error: updateInviteError } = await supabaseAdmin.from('studio_invites').update({ used_at: new Date().toISOString() }).eq('id', invite.id);
        if (updateInviteError) logger.error('Erro ao marcar convite como usado (duplicata):', updateInviteError);
        return successResponse({ message: 'Convite já aceito e profissional vinculado', studioId: invite.studio_id, professionalId: existingProfessional.id }, 200);
    }

    let newProfessional;

    if (orphanProfessional) {
        // Atualizar perfil órfão
        logger.info(`Atualizando perfil profissional órfão ${orphanProfessional.id} para o estúdio ${invite.studio_id}`);
        const { data: updatedProf, error: updateError } = await supabaseAdmin
            .from('professionals')
            .update({
                studio_id: invite.studio_id,
                professional_type: invite.metadata?.professional_type || 'technician',
                status: 'active'
            })
            .eq('id', orphanProfessional.id)
            .select()
            .single();
        
        if (updateError) {
            logger.error('Erro ao vincular perfil órfão:', updateError);
            throw new AppError('Falha ao vincular perfil existente.', 500, 'PROFESSIONAL_LINK_FAILED');
        }
        newProfessional = updatedProf;
    } else {
        // 4. Criar entrada na tabela 'professionals'
        const professionalData = {
          user_id: userId,
          studio_id: invite.studio_id,
          name: email.split('@')[0], // Nome provisório, pode ser atualizado depois
          email: email,
          professional_type: invite.metadata?.professional_type || 'technician', // Usar o tipo do convite
          status: 'active', // Já ativo ao aceitar o convite
        };

        const { data: createdProf, error: profInsertError } = await supabaseAdmin
          .from('professionals')
          .insert(professionalData)
          .select()
          .single();

        if (profInsertError) {
          logger.error('Erro ao criar perfil profissional:', profInsertError);
          throw new AppError('Falha ao vincular perfil profissional.', 500, 'PROFESSIONAL_LINK_FAILED');
        }
        newProfessional = createdProf;
    }

    // 5. Atualizar metadados do usuário no Supabase Auth para o novo studio_id
    // Isso garante que ao redirecionar para o dashboard, ele carregue o estúdio recém-aceito
    try {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: { 
                studio_id: invite.studio_id,
                role: invite.metadata?.professional_type || 'technician'
            }
        });
        logger.info(`Sessão do usuário ${userId} atualizada para studio_id ${invite.studio_id}`);
    } catch (authUpdateError) {
        logger.error('Erro ao atualizar metadados do auth:', authUpdateError);
        // Não travamos o processo se falhar o metadado, pois o vínculo na tabela professionals já foi feito
    }

    // 6. Marcar convite como usado APENAS se for um convite nominal (com e-mail)
    if (invite.email) {
      const { error: updateInviteError } = await supabaseAdmin.from('studio_invites').update({ used_at: new Date().toISOString() }).eq('id', invite.id);
      if (updateInviteError) logger.error('Erro ao marcar convite como usado:', updateInviteError);
    }

    logger.info(`✅ Convite ${invite.email ? 'nominal' : 'público'} aceito por ${email} para o estúdio ${invite.studio_id}. Profissional ID: ${newProfessional.id}`);

    return successResponse({ message: 'Convite aceito com sucesso', studioId: invite.studio_id, professionalId: newProfessional.id, niche: inviteNiche, role: profType }, 200);

  } catch (error: any) {
    logger.error('💥 Erro na API de aceitação de convite:', error);
    return errorResponse(error, 500);
  }
}

// Handler para verificar a validade de um convite (GET)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      throw new AppError('Token de convite não fornecido', 400, 'MISSING_TOKEN');
    }

    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('studio_invites')
      .select('*, studio:studio_id(id, name), role')
      .eq('token', token)
      .maybeSingle();

    if (inviteError) logger.error('Erro ao buscar convite para validação (GET):', inviteError);

    if (!invite) {
      return errorResponse(new AppError('Convite inválido.', 404, 'INVALID_INVITE'), 404);
    }

    if (invite.email && invite.used_at) {
      return errorResponse(new AppError('Convite já utilizado.', 403, 'INVITE_USED'), 403);
    }

    if (new Date(invite.expires_at as string) < new Date()) {
      return errorResponse(new AppError('Convite expirado.', 400, 'INVITE_EXPIRED'), 400);
    }

    // Mapear 'role' diretamente para 'professional_type' dentro de metadata
    const inviteWithMetadata = {
      ...invite,
      metadata: {
        ...invite.metadata,
        professional_type: invite.role, // Assumindo que 'role' existe e é o tipo correto
      },
    };
    delete (inviteWithMetadata as any).role; // Remover o campo 'role' do objeto raiz, se desejar

    return successResponse({ message: 'Convite válido', invite: inviteWithMetadata });

  } catch (error: any) {
    logger.error('💥 Erro na API de verificação de convite (GET):', error);
    return errorResponse(error, 500);
  }
}
