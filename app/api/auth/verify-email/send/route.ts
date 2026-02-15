import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email'
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 })
    }
    
    // 1. Verificar se o e-mail já está em uso
    const [checkAdmin, checkTeacher, checkStudent] = await Promise.all([
      supabaseAdmin.from('users_internal').select('id').eq('email', email).maybeSingle(),
      supabaseAdmin.from('teachers').select('id').eq('email', email).maybeSingle(),
      supabaseAdmin.from('students').select('id').eq('email', email).maybeSingle()
    ])

    if (checkAdmin.data || checkTeacher.data || checkStudent.data) {
      return NextResponse.json({ 
        error: 'Este e-mail já está vinculado a uma conta ativa.' 
      }, { status: 400 })
    }

    // 2. Gerar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Expira em 10 minutos
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // Deletar códigos antigos para este e-mail
    await supabaseAdmin.from('email_verifications').delete().eq('email', email)

    // Salvar novo código
    const { error: dbError } = await supabaseAdmin.from('email_verifications').insert({
      email,
      code,
      expires_at: expiresAt,
      verified: false
    })

    if (dbError) {
      logger.error('❌ Erro ao salvar código no banco:', dbError)
      return NextResponse.json({ error: 'Erro ao gerar código de verificação' }, { status: 500 })
    }

    // Enviar via E-mail
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #4f46e5; text-align: center;">Código de Verificação</h2>
        <p style="text-align: center; color: #333;">Use o código abaixo para verificar seu e-mail e continuar seu cadastro:</p>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937; margin: 20px 0;">
          ${code}
        </div>
        <p style="color: #666; font-size: 12px; text-align: center; margin-top: 20px;">Este código expira em 10 minutos.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 10px; text-align: center;">Se você não solicitou este código, ignore esta mensagem.</p>
      </div>
    `

    logger.info(`📧 Enviando código ${code} para ${email}...`)

    const { success, error: emailError } = await sendEmail({
      to: email,
      subject: 'Seu código de verificação - Workflow AI',
      html
    })

    if (!success) {
      logger.warn('-----------------------------------------')
      logger.warn('⚠️ FALHA NO ENVIO DE E-MAIL')
      logger.warn(`PARA O E-MAIL: ${email}`)
      logger.warn(`CÓDIGO DE VERIFICAÇÃO: ${code}`)
      logger.warn(`ERRO: ${emailError}`)
      logger.warn('-----------------------------------------')
      
      // Em desenvolvimento, retornamos sucesso se falhar o envio (para teste sem SMTP configurado)
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({ 
          success: true, 
          message: 'Código gerado (Verifique o console do servidor em modo DEV)',
          _dev_code: code 
        })
      }

      return NextResponse.json({ error: 'Falha ao enviar código por e-mail.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Código enviado para seu e-mail!' })

  } catch (error) {
    logger.error('💥 Erro fatal no envio de código:', error)
    return NextResponse.json({ error: 'Erro interno ao processar solicitação' }, { status: 500 })
  }
}
