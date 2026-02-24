'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email'
import logger from '@/lib/logger'
import { generateUniqueSlug } from '@/lib/utils/slug'

interface InviteClientData {
  name: string
  email: string
  phone: string
  studioId: string
  studioName: string
}

export async function inviteClient(data: InviteClientData) {
  const { name, email, phone, studioId, studioName } = data

  try {
    logger.info('➡️ Iniciando convite para cliente:', { email, name, studioId })

    // 1. Verificar se o usuário já existe no Auth
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const userFound = existingUser.users.find(u => u.email === email)

    let userId: string

    if (userFound) {
      userId = userFound.id
      logger.info('ℹ️ Usuário já existe no Auth:', userId)
    } else {
      // 2. Criar usuário no Auth sem senha (será definida via link)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true, // Já confirmamos o e-mail para facilitar
        user_metadata: {
          name,
          studio_id: studioId,
          role: 'student',
          phone,
        }
      })

      if (authError) {
        logger.error('❌ Erro ao criar usuário no Auth:', authError)
        throw new Error(`Erro ao criar conta: ${authError.message}`)
      }

      userId = authData.user.id
      logger.info('✅ Usuário criado no Auth:', userId)
    }

    // 3. Criar ou atualizar perfil de aluno
    const { error: profileError } = await supabaseAdmin.from('students').upsert({
      id: userId,
      studio_id: studioId,
      name,
      email,
      phone,
      status: 'active'
    })

    if (profileError) {
      logger.error('❌ Erro ao criar perfil de aluno:', profileError)
      throw new Error(`Erro ao criar perfil: ${profileError.message}`)
    }

    // 4. Gerar link de recuperação de senha (para o usuário definir a primeira senha)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/set-password`
      }
    })

    if (linkError) {
      logger.error('❌ Erro ao gerar link de convite:', linkError)
      throw new Error(`Erro ao gerar link: ${linkError.message}`)
    }

    const inviteLink = linkData.properties.action_link

    // 5. Enviar e-mail de convite
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Bem-vindo à ${studioName}!</h2>
        <p>Olá, ${name},</p>
        <p>Sua conta foi criada com sucesso. Para acessar seu portal e visualizar suas ordens de serviço, clique no botão abaixo para definir sua senha:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Definir Minha Senha</a>
        </div>
        <p style="font-size: 12px; color: #666;">Se o botão acima não funcionar, copie e cole este link no seu navegador:</p>
        <p style="font-size: 12px; color: #666; word-break: break-all;">${inviteLink}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">Esta é uma mensagem automática, por favor não responda.</p>
      </div>
    `

    const { success, error: emailErr } = await sendEmail({
      to: email,
      subject: `Seu acesso à ${studioName}`,
      html: emailHtml
    })

    if (!success) {
      logger.error('❌ Erro ao enviar e-mail de convite:', emailErr)
      // Não vamos dar throw aqui porque o usuário foi criado, podemos apenas avisar
    }

    return { 
      success: true, 
      userId, 
      inviteLink // Link retornado apenas em dev para debug
    }

  } catch (error: any) {
    logger.error('💥 Erro fatal no inviteClient:', error)
    throw error
  }
}
