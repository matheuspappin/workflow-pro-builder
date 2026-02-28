import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendEmail } from '@/lib/email'
import { AppError } from '@/lib/errors'
import { errorResponse, successResponse } from '@/lib/api-response'
import { maskEmail } from '@/lib/sanitize-logs'
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { phone, email } = await request.json()

    if (!phone) {
      return errorResponse(new AppError('Telefone é obrigatório', 400, 'MISSING_PHONE'))
    }
    
    // Agora exigimos e-mail para enviar o código
    if (!email) {
      return errorResponse(new AppError('E-mail é obrigatório para enviar o código', 400, 'MISSING_EMAIL'))
    }

    // Limpar o número para apenas dígitos
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      return errorResponse(new AppError('Telefone inválido', 400, 'INVALID_PHONE'))
    }

    // 1. Verificar se o número já está em uso em qualquer conta
    const [checkAdmin, checkTeacher, checkStudent] = await Promise.all([
      supabase.from('users_internal').select('id').eq('phone', cleanPhone).maybeSingle(),
      supabase.from('teachers').select('id').eq('phone', cleanPhone).maybeSingle(),
      supabase.from('students').select('id').eq('phone', cleanPhone).maybeSingle()
    ])

    if (checkAdmin.data || checkTeacher.data || checkStudent.data) {
      return errorResponse(new AppError('Este número de telefone já está vinculado a uma conta ativa.', 400, 'PHONE_IN_USE'))
    }

    // 2. Gerar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Expira em 10 minutos
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // Deletar códigos antigos para este número
    await supabase.from('phone_verifications').delete().eq('phone', cleanPhone)

    // Salvar novo código
    const { error: dbError } = await supabase.from('phone_verifications').insert({
      phone: cleanPhone,
      code,
      expires_at: expiresAt,
      verified: false
    })

    if (dbError) {
      logger.error('❌ Erro ao salvar código no banco:', dbError)
      return errorResponse(new AppError('Erro ao gerar código de verificação', 500, 'CODE_GENERATION_FAILED'))
    }

    // Enviar via E-mail
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #4f46e5; text-align: center;">Código de Verificação</h2>
        <p style="text-align: center; color: #333;">Use o código abaixo para verificar seu telefone e continuar seu cadastro:</p>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937; margin: 20px 0;">
          ${code}
        </div>
        <p style="color: #666; font-size: 12px; text-align: center; margin-top: 20px;">Este código expira em 10 minutos.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 10px; text-align: center;">Se você não solicitou este código, ignore esta mensagem.</p>
      </div>
    `

    logger.info(`📧 Enviando código de verificação para ${maskEmail(email)}`)

    const { success, error: emailError } = await sendEmail({
      to: email,
      subject: 'Seu código de verificação - Workflow AI',
      html
    })

    if (!success) {
      logger.warn('⚠️ Falha no envio de e-mail de verificação', { target: maskEmail(email), error: String(emailError) })
      
      // Em desenvolvimento, retornamos sucesso se falhar o envio (para teste sem SMTP configurado)
      if (process.env.NODE_ENV === 'development') {
        return successResponse({ 
          message: 'Código gerado (Verifique o console do servidor em modo DEV)',
          _dev_code: code 
        })
      }

      return errorResponse(new AppError('Falha ao enviar código por e-mail. Verifique se o e-mail está correto.', 500, 'EMAIL_SEND_FAILED'))
    }

    return successResponse({ message: 'Código enviado para seu e-mail!' })

  } catch (error) {
    logger.error('💥 Erro fatal no envio de código:', error)
    return errorResponse(error instanceof Error ? error : new AppError('Erro interno ao processar solicitação', 500, 'INTERNAL_ERROR'))
  }
}
