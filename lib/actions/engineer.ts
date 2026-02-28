'use server'

import { supabaseAdmin } from "@/lib/supabase-admin"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// -------------------------------------------------------------------------
// PROJETOS DO ENGENHEIRO
// -------------------------------------------------------------------------

export type ProjectStatus = 'pending_acceptance' | 'open' | 'in_progress' | 'waiting_parts' | 'finished' | 'cancelled' | 'draft'

export interface EngineerProject {
    id: string
    title: string | null
    description: string | null
    status: ProjectStatus
    project_type: string
    tracking_code: string | null
    opened_at: string
    scheduled_at: string | null
    finished_at: string | null
    engineer_accepted_at: string | null
    engineer_rejected_at: string | null
    engineer_rejection_reason: string | null
    professional_commission_value: number
    professional_commission_status: string
    studio: { id: string; name: string; slug: string } | null
    customer: { id: string; name: string; email: string; phone: string | null } | null
    milestones_count?: number
    completed_milestones_count?: number
}

export async function getEngineerProjects(userId: string, filters?: { status?: string; search?: string }) {
    if (!userId) return { success: false, error: "Usuário inválido.", data: [] }

    try {
        const { data: professionals, error: profError } = await supabaseAdmin
            .from('professionals')
            .select('id, studio_id')
            .eq('user_id', userId)

        if (profError || !professionals?.length) {
            return { success: true, data: [] }
        }

        const professionalIds = professionals.map(p => p.id)

        let query = supabaseAdmin
            .from('service_orders')
            .select(`
                id,
                title,
                description,
                status,
                project_type,
                tracking_code,
                opened_at,
                scheduled_at,
                finished_at,
                engineer_accepted_at,
                engineer_rejected_at,
                engineer_rejection_reason,
                professional_commission_value,
                professional_commission_status,
                studio:studios(id, name, slug),
                customer:students(id, name, email, phone)
            `)
            .in('professional_id', professionalIds)
            .order('opened_at', { ascending: false })

        if (filters?.status && filters.status !== 'all') {
            query = query.eq('status', filters.status as any)
        }

        if (filters?.search) {
            query = query.or(`title.ilike.%${filters.search}%,tracking_code.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
        }

        const { data, error } = await query

        if (error) throw error

        // Enriquecer com contagem de milestones
        const enriched = await Promise.all((data || []).map(async (project) => {
            const { count: totalCount } = await supabaseAdmin
                .from('service_order_milestones')
                .select('*', { count: 'exact', head: true })
                .eq('service_order_id', project.id)

            const { count: completedCount } = await supabaseAdmin
                .from('service_order_milestones')
                .select('*', { count: 'exact', head: true })
                .eq('service_order_id', project.id)
                .eq('status', 'completed')

            return {
                ...project,
                milestones_count: totalCount || 0,
                completed_milestones_count: completedCount || 0,
            }
        }))

        return { success: true, data: enriched as unknown as EngineerProject[] }
    } catch (error: any) {
        console.error('Erro ao carregar projetos do engenheiro:', error)
        return { success: false, error: error.message, data: [] }
    }
}

export async function getEngineerProjectDetails(projectId: string, userId: string) {
    if (!projectId || !userId) return { success: false, error: "Dados inválidos.", data: null }

    try {
        const { data: professionals, error: profError } = await supabaseAdmin
            .from('professionals')
            .select('id')
            .eq('user_id', userId)

        if (profError || !professionals?.length) {
            return { success: false, error: "Perfil profissional não encontrado.", data: null }
        }

        const professionalIds = professionals.map(p => p.id)

        // Query em etapas para evitar falhas em relações aninhadas complexas
        const { data: base, error: baseError } = await supabaseAdmin
            .from('service_orders')
            .select(`
                *,
                studio:studios(id, name, slug),
                customer:students(id, name, email, phone)
            `)
            .eq('id', projectId)
            .in('professional_id', professionalIds)
            .single()

        if (baseError || !base) {
            if (baseError) {
                console.error('[getEngineerProjectDetails] Erro ao buscar projeto:', baseError.message, { projectId, code: baseError.code })
            }
            return { success: false, error: "Projeto não encontrado ou sem permissão.", data: null }
        }

        // Buscar milestones, documents e comments em paralelo
        const [milestonesRes, documentsRes, commentsRes] = await Promise.all([
            supabaseAdmin
                .from('service_order_milestones')
                .select('id, title, description, status, completed_at, order_index, metadata')
                .eq('service_order_id', projectId)
                .order('order_index', { ascending: true }),
            supabaseAdmin
                .from('service_order_documents')
                .select('id, title, file_name, file_url, file_type, file_size, description, signed_at, created_at')
                .eq('service_order_id', projectId),
            supabaseAdmin
                .from('service_order_comments')
                .select('id, content, user_id, created_at')
                .eq('service_order_id', projectId)
        ])

        const data = {
            ...base,
            milestones: milestonesRes.data || [],
            documents: documentsRes.data || [],
            comments: commentsRes.data || [],
        }

        return { success: true, data }
    } catch (error: any) {
        console.error('Erro ao carregar detalhes do projeto:', error)
        return { success: false, error: error.message, data: null }
    }
}

export async function acceptProject(projectId: string, userId: string) {
    if (!projectId || !userId) return { success: false, error: "Dados inválidos." }

    try {
        const { data: professionals, error: profError } = await supabaseAdmin
            .from('professionals')
            .select('id, studio_id')
            .eq('user_id', userId)

        if (profError || !professionals?.length) {
            return { success: false, error: "Perfil profissional não encontrado." }
        }

        const professionalIds = professionals.map(p => p.id)

        const { data: project, error: fetchError } = await supabaseAdmin
            .from('service_orders')
            .select('id, status, studio_id')
            .eq('id', projectId)
            .in('professional_id', professionalIds)
            .single()

        if (fetchError || !project) {
            return { success: false, error: "Projeto não encontrado ou sem permissão." }
        }

        if (project.status !== 'pending_acceptance' && project.status !== 'open') {
            return { success: false, error: "Este projeto não está disponível para aceite." }
        }

        const { error: updateError } = await supabaseAdmin
            .from('service_orders')
            .update({
                status: 'in_progress',
                engineer_accepted_at: new Date().toISOString(),
                engineer_rejected_at: null,
                engineer_rejection_reason: null,
            })
            .eq('id', projectId)

        if (updateError) throw updateError

        // Criar milestones padrão PPCI se o projeto for do tipo ppci e não tiver milestones
        const { count: existingMilestones } = await supabaseAdmin
            .from('service_order_milestones')
            .select('*', { count: 'exact', head: true })
            .eq('service_order_id', projectId)

        if ((existingMilestones || 0) === 0 && project.studio_id) {
            await createDefaultPPCIMilestones(projectId, project.studio_id)
        }

        // Log de histórico
        await supabaseAdmin.from('service_order_history').insert({
            studio_id: project.studio_id,
            service_order_id: projectId,
            previous_status: project.status,
            new_status: 'in_progress',
            notes: 'Projeto aceito pelo engenheiro responsável',
        })

        revalidatePath('/solutions/fire-protection/engineer/projetos')
        revalidatePath(`/solutions/fire-protection/engineer/projetos/${projectId}`)
        return { success: true }
    } catch (error: any) {
        console.error('Erro ao aceitar projeto:', error)
        return { success: false, error: error.message }
    }
}

export async function rejectProject(projectId: string, userId: string, reason: string) {
    if (!projectId || !userId) return { success: false, error: "Dados inválidos." }

    try {
        const { data: professionals, error: profError } = await supabaseAdmin
            .from('professionals')
            .select('id, studio_id')
            .eq('user_id', userId)

        if (profError || !professionals?.length) {
            return { success: false, error: "Perfil profissional não encontrado." }
        }

        const professionalIds = professionals.map(p => p.id)

        const { data: project, error: fetchError } = await supabaseAdmin
            .from('service_orders')
            .select('id, status, studio_id')
            .eq('id', projectId)
            .in('professional_id', professionalIds)
            .single()

        if (fetchError || !project) {
            return { success: false, error: "Projeto não encontrado ou sem permissão." }
        }

        const { error: updateError } = await supabaseAdmin
            .from('service_orders')
            .update({
                status: 'open',
                professional_id: null,
                engineer_rejected_at: new Date().toISOString(),
                engineer_rejection_reason: reason || 'Sem motivo informado',
            })
            .eq('id', projectId)

        if (updateError) throw updateError

        // Log de histórico
        await supabaseAdmin.from('service_order_history').insert({
            studio_id: project.studio_id,
            service_order_id: projectId,
            previous_status: project.status,
            new_status: 'open',
            notes: `Projeto recusado pelo engenheiro. Motivo: ${reason || 'Não informado'}`,
        })

        revalidatePath('/solutions/fire-protection/engineer/projetos')
        return { success: true }
    } catch (error: any) {
        console.error('Erro ao recusar projeto:', error)
        return { success: false, error: error.message }
    }
}

export async function updateEngineerProjectStatus(
    projectId: string,
    userId: string,
    newStatus: 'in_progress' | 'waiting_parts' | 'finished'
) {
    try {
        const { data: professionals, error: profError } = await supabaseAdmin
            .from('professionals')
            .select('id, studio_id')
            .eq('user_id', userId)

        if (profError || !professionals?.length) {
            return { success: false, error: "Perfil profissional não encontrado." }
        }

        const professionalIds = professionals.map(p => p.id)

        const { data: project } = await supabaseAdmin
            .from('service_orders')
            .select('id, status, studio_id')
            .eq('id', projectId)
            .in('professional_id', professionalIds)
            .single()

        if (!project) return { success: false, error: "Projeto não encontrado." }

        const updateData: any = { status: newStatus }
        if (newStatus === 'finished') {
            updateData.finished_at = new Date().toISOString()
        }

        const { error: updateError } = await supabaseAdmin
            .from('service_orders')
            .update(updateData)
            .eq('id', projectId)

        if (updateError) throw updateError

        await supabaseAdmin.from('service_order_history').insert({
            studio_id: project.studio_id,
            service_order_id: projectId,
            previous_status: project.status,
            new_status: newStatus,
            notes: `Status atualizado pelo engenheiro`,
        })

        revalidatePath('/solutions/fire-protection/engineer/projetos')
        revalidatePath(`/solutions/fire-protection/engineer/projetos/${projectId}`)
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function addEngineerProjectDocumentLink(
    projectId: string,
    userId: string,
    data: { url: string; title?: string; description?: string }
) {
    if (!data?.url?.trim()) return { success: false, error: "Informe o link (URL)." }

    const url = data.url.trim()
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return { success: false, error: "O link deve começar com http:// ou https://" }
    }

    try {
        const { data: professionals } = await supabaseAdmin
            .from("professionals")
            .select("id")
            .eq("user_id", userId)

        if (!professionals?.length) return { success: false, error: "Perfil não encontrado." }

        const professionalIds = professionals.map((p) => p.id)

        const { data: project, error: fetchError } = await supabaseAdmin
            .from("service_orders")
            .select("id, studio_id")
            .eq("id", projectId)
            .in("professional_id", professionalIds)
            .single()

        if (fetchError || !project) {
            return { success: false, error: "Projeto não encontrado." }
        }

        let displayTitle = data.title?.trim()
        if (!displayTitle) {
            try {
                displayTitle = new URL(url).hostname || "Link externo"
            } catch {
                displayTitle = "Link externo"
            }
        }
        const { error } = await supabaseAdmin.from("service_order_documents").insert({
            service_order_id: projectId,
            studio_id: project.studio_id,
            title: displayTitle,
            file_url: url,
            file_type: "link",
            category: "outro",
            description: data.description?.trim() || null,
        })

        if (error) throw error

        revalidatePath(`/solutions/fire-protection/engineer/projetos/${projectId}`)
        revalidatePath(`/solutions/fire-protection/architect/projetos/${projectId}`)
        return { success: true }
    } catch (error: any) {
        console.error("Erro ao adicionar link:", error)
        return { success: false, error: error.message || "Erro ao adicionar link." }
    }
}

export async function addEngineerComment(projectId: string, userId: string, content: string) {
    if (!content?.trim()) return { success: false, error: "Comentário vazio." }

    try {
        const { data: professionals } = await supabaseAdmin
            .from('professionals')
            .select('id')
            .eq('user_id', userId)

        if (!professionals?.length) return { success: false, error: "Perfil não encontrado." }

        const professionalIds = professionals.map(p => p.id)

        const { data: project } = await supabaseAdmin
            .from('service_orders')
            .select('studio_id')
            .eq('id', projectId)
            .in('professional_id', professionalIds)
            .single()

        if (!project) return { success: false, error: "Projeto não encontrado." }

        const { error } = await supabaseAdmin
            .from('service_order_comments')
            .insert({
                service_order_id: projectId,
                studio_id: project.studio_id,
                user_id: userId,
                content: content.trim(),
            })

        if (error) throw error

        revalidatePath(`/solutions/fire-protection/engineer/projetos/${projectId}`)
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function updateEngineerMilestone(
    milestoneId: string,
    projectId: string,
    userId: string,
    status: 'pending' | 'completed' | 'cancelled'
) {
    try {
        const { data: professionals } = await supabaseAdmin
            .from('professionals')
            .select('id')
            .eq('user_id', userId)

        if (!professionals?.length) return { success: false, error: "Perfil não encontrado." }

        const professionalIds = professionals.map(p => p.id)

        const { data: project } = await supabaseAdmin
            .from('service_orders')
            .select('studio_id')
            .eq('id', projectId)
            .in('professional_id', professionalIds)
            .single()

        if (!project) return { success: false, error: "Projeto não encontrado." }

        const { error } = await supabaseAdmin
            .from('service_order_milestones')
            .update({
                status,
                completed_at: status === 'completed' ? new Date().toISOString() : null,
            })
            .eq('id', milestoneId)
            .eq('service_order_id', projectId)
            .eq('studio_id', project.studio_id)

        if (error) throw error

        revalidatePath(`/solutions/fire-protection/engineer/projetos/${projectId}`)
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function sendProjectToEngineer(projectId: string, studioId: string) {
    try {
        const { error } = await supabaseAdmin
            .from('service_orders')
            .update({ status: 'pending_acceptance' as any })
            .eq('id', projectId)
            .eq('studio_id', studioId)

        if (error) throw error

        await supabaseAdmin.from('service_order_history').insert({
            studio_id: studioId,
            service_order_id: projectId,
            previous_status: 'open',
            new_status: 'pending_acceptance',
            notes: 'Projeto enviado ao engenheiro para aceite',
        })

        revalidatePath('/dashboard/projetos')
        revalidatePath('/dashboard/os')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

const DEFAULT_PPCI_MILESTONES = [
    { title: 'Vistoria Técnica no Local', description: 'Visita ao local para levantamento das condições existentes', order_index: 0 },
    { title: 'Levantamento de Dados e Planta', description: 'Coleta das plantas arquitetônicas e dados do imóvel', order_index: 1 },
    { title: 'Elaboração do Projeto PPCI', description: 'Desenvolvimento do projeto de prevenção e combate a incêndio', order_index: 2 },
    { title: 'Revisão e Correções', description: 'Análise crítica do projeto e ajustes necessários', order_index: 3 },
    { title: 'Envio ao Corpo de Bombeiros', description: 'Protocolo do projeto para análise e aprovação', order_index: 4 },
    { title: 'Acompanhamento de Aprovação', description: 'Resposta a exigências e acompanhamento junto ao CBMRS/CBMSP', order_index: 5 },
    { title: 'Emissão do Laudo/ART', description: 'Emissão do laudo técnico e Anotação de Responsabilidade Técnica', order_index: 6 },
    { title: 'Entrega Final ao Cliente', description: 'Entrega de toda a documentação aprovada ao cliente', order_index: 7 },
]

async function createDefaultPPCIMilestones(projectId: string, studioId: string) {
    const milestones = DEFAULT_PPCI_MILESTONES.map(m => ({
        ...m,
        service_order_id: projectId,
        studio_id: studioId,
        status: 'pending' as const,
    }))

    const { error } = await supabaseAdmin
        .from('service_order_milestones')
        .insert(milestones)

    if (error) {
        console.error('Erro ao criar milestones padrão PPCI:', error)
    }
}

export async function getEngineerStats(userId: string) {
    try {
        const { data: professionals } = await supabaseAdmin
            .from('professionals')
            .select('id')
            .eq('user_id', userId)

        if (!professionals?.length) return { success: true, data: { pending: 0, active: 0, finished: 0, total: 0 } }

        const ids = professionals.map(p => p.id)

        const { data: projects } = await supabaseAdmin
            .from('service_orders')
            .select('status')
            .in('professional_id', ids)

        const pending = projects?.filter(p => p.status === 'pending_acceptance' || p.status === 'open').length || 0
        const active = projects?.filter(p => p.status === 'in_progress' || p.status === 'waiting_parts').length || 0
        const finished = projects?.filter(p => p.status === 'finished').length || 0

        return { success: true, data: { pending, active, finished, total: projects?.length || 0 } }
    } catch (error: any) {
        return { success: false, error: error.message, data: { pending: 0, active: 0, finished: 0, total: 0 } }
    }
}

// -------------------------------------------------------------------------
// EMPRESAS VINCULADAS (mantido)
// -------------------------------------------------------------------------

export async function getLinkedCompanies(userId: string) {
    if (!userId) return { success: false, error: "Usuário inválido.", data: [] }

    try {
        const { data, error } = await supabaseAdmin
            .from('professionals')
            .select(`
                id,
                role:professional_type,
                created_at,
                studio:studios (
                    id,
                    name,
                    slug,
                    plan,
                    settings:studio_settings(setting_key, setting_value),
                    organization:organization_settings(niche)
                )
            `)
            .eq('user_id', userId)
            .not('studio_id', 'is', null)

        if (error) throw error

        return { success: true, data: data || [] }
    } catch (error: any) {
        console.error('Erro ao carregar empresas vinculadas:', error)
        return { success: false, error: error.message, data: [] }
    }
}

export async function joinStudioByLink(link: string, userId: string, userEmail: string) {
    if (!link || !userId || !userEmail) {
        return { success: false, error: "Link ou usuário inválido." };
    }

    try {
        let identifier = link.trim();
        let type: 'token' | 'slug' | 'invite_code' = 'token';

        try {
            if (identifier.startsWith('http')) {
                const url = new URL(identifier);

                if (url.pathname.includes('/s/')) {
                    const pathParts = url.pathname.split('/');
                    const slugIndex = pathParts.findIndex(p => p === 's');
                    if (slugIndex !== -1 && pathParts[slugIndex + 1]) {
                        identifier = pathParts[slugIndex + 1];
                        type = 'slug';
                    }
                } else if (url.pathname.includes('/invite/')) {
                    identifier = (url.pathname.split('/invite/')[1] || '').split('?')[0];
                    type = /^[A-Za-z0-9]{6,10}$/.test(identifier) ? 'invite_code' : 'token';
                } else {
                    identifier = (url.pathname.split('/').pop() || identifier).split('?')[0];
                    if (/^[A-Za-z0-9]{6,10}$/.test(identifier)) type = 'invite_code';
                }
            } else {
                identifier = identifier.split('?')[0];
                if (!identifier.includes('/')) {
                    if (identifier.length > 50) {
                        type = 'token';
                    } else if (/^[A-Za-z0-9]{6,10}$/.test(identifier)) {
                        type = 'invite_code';
                    } else {
                        type = 'slug';
                    }
                }
            }
        } catch (e) {
            type = 'token';
        }

        if (type === 'invite_code') {
            // Tenta primeiro engineer_invite_code (códigos E...), depois technician_invite_code
            const codeResult = await handleJoinByInviteCode(identifier.toUpperCase(), userId, userEmail);
            if (codeResult.success) return codeResult;
            return await handleJoinBySlug(identifier, userId, userEmail);
        }
        if (type === 'slug') {
            const slugResult = await handleJoinBySlug(identifier, userId, userEmail);
            if (slugResult.success) return slugResult;
            return await handleJoinByInviteCode(identifier.toUpperCase(), userId, userEmail);
        }
        return await handleJoinByToken(identifier, userId, userEmail);

    } catch (error: any) {
        console.error("Erro ao processar link:", error);
        return { success: false, error: error.message || "Erro desconhecido." };
    }
}

async function handleJoinBySlug(slug: string, userId: string, userEmail: string) {
    const { data: studio, error: studioError } = await supabaseAdmin
        .from('studios')
        .select('id, name')
        .eq('slug', slug)
        .single();

    if (studioError || !studio) {
        return { success: false, error: "Estúdio não encontrado para este link." };
    }

    // Verificar se já está vinculado a este estúdio
    const { data: existingLink } = await supabaseAdmin
        .from('professionals')
        .select('id')
        .eq('user_id', userId)
        .eq('studio_id', studio.id)
        .maybeSingle();

    if (existingLink) {
        return { success: true, message: `Você já está vinculado ao ${studio.name}!` };
    }

    // Verificar se existe registro sem estúdio (standalone) para atualizar
    const { data: standaloneRecord } = await supabaseAdmin
        .from('professionals')
        .select('id, professional_type')
        .eq('user_id', userId)
        .is('studio_id', null)
        .maybeSingle();

    const profType = standaloneRecord?.professional_type === 'architect' ? 'architect' : 'engineer';

    if (standaloneRecord) {
        // Atualiza o registro existente com o studio_id (preserva professional_type se for architect)
        const { error: updateError } = await supabaseAdmin
            .from('professionals')
            .update({
                studio_id: studio.id,
                email: userEmail,
                status: 'active',
                professional_type: profType,
            })
            .eq('id', standaloneRecord.id);

        if (updateError) {
            console.error("Erro ao atualizar vínculo profissional (slug):", updateError);
            return { success: false, error: "Erro ao criar vínculo com o estúdio." };
        }
    } else {
        // Inserir novo registro de vínculo (ou buscar tipo de outro vínculo do user)
        const { data: anyProf } = await supabaseAdmin.from('professionals').select('professional_type').eq('user_id', userId).limit(1).maybeSingle();
        const insertType = anyProf?.professional_type === 'architect' ? 'architect' : profType;
        const { error: insertError } = await supabaseAdmin
            .from('professionals')
            .insert({
                user_id: userId,
                studio_id: studio.id,
                email: userEmail,
                name: userEmail.split('@')[0],
                professional_type: insertType,
                status: 'active',
            });

        if (insertError) {
            console.error("Erro ao vincular profissional (slug):", insertError);
            return { success: false, error: "Erro ao criar vínculo com o estúdio." };
        }
    }

    // Atualizar metadados mantendo os dados existentes
    const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(userId);
    const currentMetadata = authUserData.user?.user_metadata || {};

    await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
            ...currentMetadata,
            studio_id: studio.id,
            role: profType,
        }
    });

    revalidatePath('/solutions/fire-protection/engineer/perfil');
    revalidatePath('/solutions/fire-protection/architect/perfil');
    return { success: true, message: `Você agora faz parte do ${studio.name}!` };
}

async function handleJoinByInviteCode(code: string, userId: string, userEmail: string) {
    const codeUpper = code.toUpperCase();

    // 1. Código de engenheiro (formato E + 7 chars) - valida que a conta é de engenheiro/arquiteto
    if (codeUpper.startsWith('E') && codeUpper.length >= 7) {
        const engineerResult = await handleJoinByEngineerInviteCode(codeUpper, userId, userEmail);
        if (engineerResult.success) return engineerResult;
        if (engineerResult.error && !engineerResult.error.includes('não encontrado')) {
            return engineerResult; // Erro de validação (ex: conta não é de engenheiro)
        }
    }

    // 2. Código de técnico (8 chars) - fallback para compatibilidade
    const { data: studio, error: studioError } = await supabaseAdmin
        .from('studios')
        .select('id, name')
        .eq('technician_invite_code', codeUpper)
        .single();

    if (studioError || !studio) {
        return { success: false, error: "Código de convite inválido ou não encontrado." };
    }

    return await performProfessionalLink(studio.id, studio.name, userId, userEmail, 'engineer');
}

/** Valida e vincula usando engineer_invite_code - exige que a conta seja de engenheiro ou arquiteto */
async function handleJoinByEngineerInviteCode(code: string, userId: string, userEmail: string) {
    const { data: studio, error: studioError } = await supabaseAdmin
        .from('studios')
        .select('id, name')
        .eq('engineer_invite_code', code)
        .single();

    if (studioError || !studio) {
        return { success: false, error: "Código de convite de engenheiro não encontrado." };
    }

    // Validar que a conta é de engenheiro ou arquiteto (não técnico)
    const { data: userProf } = await supabaseAdmin
        .from('professionals')
        .select('professional_type')
        .eq('user_id', userId)
        .maybeSingle();

    const { data: userInternal } = await supabaseAdmin
        .from('users_internal')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

    const isTechnician = 
        userProf?.professional_type === 'technician' || 
        userInternal?.role === 'teacher' || userInternal?.role === 'technician';

    if (isTechnician) {
        return { success: false, error: "Este código é exclusivo para engenheiros. Sua conta está registrada como técnico. Use o código de convite de técnicos no portal de técnicos." };
    }

    return await performProfessionalLink(studio.id, studio.name, userId, userEmail, userProf?.professional_type === 'architect' ? 'architect' : 'engineer');
}

async function performProfessionalLink(studioId: string, studioName: string, userId: string, userEmail: string, profType: 'engineer' | 'architect') {
    const { data: existingLink } = await supabaseAdmin
        .from('professionals')
        .select('id')
        .eq('user_id', userId)
        .eq('studio_id', studioId)
        .maybeSingle();

    if (existingLink) {
        return { success: true, message: `Você já está vinculado ao ${studioName}!` };
    }

    const { data: standaloneRecord } = await supabaseAdmin
        .from('professionals')
        .select('id')
        .eq('user_id', userId)
        .is('studio_id', null)
        .maybeSingle();

    if (standaloneRecord) {
        const { error: updateError } = await supabaseAdmin
            .from('professionals')
            .update({
                studio_id: studioId,
                email: userEmail,
                status: 'active',
                professional_type: profType,
            })
            .eq('id', standaloneRecord.id);

        if (updateError) {
            console.error("Erro ao atualizar vínculo (código):", updateError);
            return { success: false, error: "Erro ao vincular à empresa." };
        }
    } else {
        const { error: insertError } = await supabaseAdmin
            .from('professionals')
            .insert({
                user_id: userId,
                studio_id: studioId,
                email: userEmail,
                name: userEmail.split('@')[0],
                professional_type: profType,
                status: 'active',
            });

        if (insertError) {
            console.error("Erro ao vincular profissional (código):", insertError);
            return { success: false, error: insertError.code === '23505' ? "Você já está vinculado a esta empresa." : "Erro ao vincular à empresa." };
        }
    }

    const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(userId);
    const currentMetadata = authUserData.user?.user_metadata || {};

    await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
            ...currentMetadata,
            studio_id: studioId,
            role: profType,
        }
    });

    revalidatePath('/solutions/fire-protection/engineer/perfil');
    revalidatePath('/solutions/fire-protection/architect/perfil');
    return { success: true, message: `Você agora faz parte do ${studioName}!` };
}

async function handleJoinByToken(token: string, userId: string, userEmail: string) {
    const { data: invite, error: inviteError } = await supabaseAdmin
        .from('studio_invites')
        .select('*, studio:studios(id, name)')
        .eq('token', token)
        .single();

    if (inviteError || !invite) {
        return { success: false, error: "Convite inválido ou expirado." };
    }

    if (invite.email && invite.used_at) {
        return { success: false, error: "Este convite já foi utilizado." };
    }

    if (new Date(invite.expires_at) < new Date()) {
        return { success: false, error: "Convite expirado." };
    }

    // Verificar se já está vinculado a este estúdio
    const { data: existingLink } = await supabaseAdmin
        .from('professionals')
        .select('id')
        .eq('user_id', userId)
        .eq('studio_id', invite.studio_id)
        .maybeSingle();

    if (!existingLink) {
        // Verificar se existe registro sem estúdio (standalone) para atualizar
        const { data: standaloneRecord } = await supabaseAdmin
            .from('professionals')
            .select('id')
            .eq('user_id', userId)
            .is('studio_id', null)
            .maybeSingle();

        if (standaloneRecord) {
            const { error: updateError } = await supabaseAdmin
                .from('professionals')
                .update({
                    studio_id: invite.studio_id,
                    email: userEmail,
                    status: 'active',
                    professional_type: invite.metadata?.professional_type || 'engineer',
                })
                .eq('id', standaloneRecord.id);

            if (updateError) {
                console.error("Erro ao atualizar vínculo profissional (token):", updateError);
                return { success: false, error: "Erro ao aceitar convite." };
            }
        } else {
            const { error: insertError } = await supabaseAdmin
                .from('professionals')
                .insert({
                    user_id: userId,
                    studio_id: invite.studio_id,
                    email: userEmail,
                    name: userEmail.split('@')[0],
                    professional_type: invite.metadata?.professional_type || 'engineer',
                    status: 'active',
                });

            if (insertError) {
                console.error("Erro ao vincular profissional (token):", insertError);
                return { success: false, error: "Erro ao aceitar convite." };
            }
        }
    }

    // Marcar convite como usado (se nominal)
    if (invite.email) {
        await supabaseAdmin
            .from('studio_invites')
            .update({ used_at: new Date().toISOString() })
            .eq('id', invite.id);
    }

    // Atualizar metadados mantendo os dados existentes
    const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(userId);
    const currentMetadata = authUserData.user?.user_metadata || {};

    await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
            ...currentMetadata,
            studio_id: invite.studio_id,
            role: 'engineer',
        }
    });

    revalidatePath('/solutions/fire-protection/engineer/perfil');
    return { success: true, message: `Convite aceito! Bem-vindo ao ${invite.studio?.name}.` };
}
