import nodemailer from 'nodemailer';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_SMTP_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_SMTP_USER || process.env.EMAIL_SENDER_ADDRESS,
        pass: process.env.EMAIL_SENDER_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_SENDER_NAME || 'Workflow AI'}" <${process.env.EMAIL_SENDER_ADDRESS}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>?/gm, ''), // Fallback text version
      html,
    });

    console.log('✅ E-mail enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('❌ Erro ao enviar e-mail:', error);
    return { success: false, error: error.message };
  }
}
