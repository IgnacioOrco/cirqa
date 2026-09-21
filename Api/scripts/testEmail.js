import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'node:path';

// Cargar variables de entorno desde Api/.env
dotenv.config({ path: path.resolve('Api/.env') });

const apiKey = process.env.RESEND_API_KEY || 're_xxxxxxxxx';
const resend = new Resend(apiKey);

async function main() {
  console.log('[Resend] Iniciando envío de prueba...');

  if (apiKey === 're_xxxxxxxxx') {
    console.warn('⚠️ ATENCIÓN: Debes reemplazar "re_xxxxxxxxx" con tu API Key real en Api/.env');
  }

  try {
    const response = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'ignacioorco@gmail.com',
      subject: 'Hello World',
      html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
    });

    console.log('[Resend] Respuesta:', response);
  } catch (err) {
    console.error('[Resend] Error:', err);
  }
}

main();
