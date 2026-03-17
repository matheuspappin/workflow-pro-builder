import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import logger from '@/lib/logger';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Envia e-mail via Resend (prioridade) ou Nodemailer (fallback).
 * Use RESEND_API_KEY + domínio verificado no Resend para envio profissional.
 */
export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const fromAddress = process.env.EMAIL_SENDER_ADDRESS || 'onboarding@resend.dev';
  const fromName = process.env.EMAIL_SENDER_NAME || 'Workflow AI';
  const from = `"${fromName}" <${fromAddress}>`;

  // Resend (prioridade quando API key configurada)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const { data, error } = await resend.emails.send({
        from,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>?/gm, ''),
      });

      if (error) {
        logger.error('❌ Erro Resend:', error);
        return { success: false, error: error.message };
      }

      logger.info('✅ E-mail enviado via Resend:', data?.id);
      return { success: true, messageId: data?.id };
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('❌ Erro ao enviar e-mail (Resend):', err);
      return { success: false, error: err.message };
    }
  }

  // Fallback: Nodemailer (SMTP)
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_SMTP_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_SMTP_USER || process.env.EMAIL_SENDER_ADDRESS,
        pass: process.env.EMAIL_SENDER_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: text || html.replace(/<[^>]*>?/gm, ''),
      html,
    });

    logger.info('✅ E-mail enviado (SMTP):', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('❌ Erro ao enviar e-mail (SMTP):', err);
    return { success: false, error: err.message };
  }
}
