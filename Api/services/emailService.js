import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// Inicialización de cliente Resend
export const resend = new Resend(process.env.RESEND_API_KEY || 're_xxxxxxxxx');

/**
 * Enviar un correo electrónico de prueba
 */
export const sendTestEmail = async (toEmail = 'ignacioorco@gmail.com') => {
  try {
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: toEmail,
      subject: 'Hello World',
      html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
    });

    console.log('[Resend] Email enviado con éxito:', data);
    return data;
  } catch (error) {
    console.error('[Resend] Error enviando email:', error);
    throw error;
  }
};

export default resend;
