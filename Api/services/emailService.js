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
      from: process.env.EMAIL_FROM || 'CIRQA <onboarding@resend.dev>',
      to: toEmail,
      subject: 'Hello World - CIRQA Test',
      html: '<p>Congrats on sending your <strong>first email</strong> with CIRQA & Resend!</p>',
    });

    console.log('[Resend] Email de prueba enviado con éxito:', data);
    return data;
  } catch (error) {
    console.error('[Resend] Error enviando email de prueba:', error);
    return null;
  }
};

/**
 * Notificación de nuevos pedidos a administración (info@cirqa.com.ar)
 * @param {Object} params
 * @param {Object} params.order - Documento o datos de la orden
 * @param {string} [params.eventType='created'] - 'created' | 'paid'
 */
export const sendOrderNotificationToAdmin = async ({ order, eventType = 'created' }) => {
  try {
    if (!order) {
      console.warn('[EmailService] Notificación cancelada: Orden nula o indefinida.');
      return null;
    }

    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || 'info@cirqa.com.ar';
    const fromEmail = process.env.EMAIL_FROM || 'CIRQA Notificaciones <onboarding@resend.dev>';

    const customer = order.customer || {};
    const shippingAddress = customer.shippingAddress || {};
    const items = Array.isArray(order.items) ? order.items : [];
    const isPaid = eventType === 'paid' || (order.status || '').toLowerCase() === 'paid';

    const orderNumber = order.orderNumber || `CQ-${order._id?.toString().slice(-6).toUpperCase() || 'N/A'}`;
    const totalFormatted = `$${Number(order.totalAmount || 0).toLocaleString('es-AR')}`;
    const subtotalFormatted = `$${Number(order.subtotal || 0).toLocaleString('es-AR')}`;
    const discountFormatted = Number(order.discountAmount || 0) > 0
      ? `-$${Number(order.discountAmount).toLocaleString('es-AR')}`
      : '$0';
    const shippingFormatted = Number(order.shippingCost ?? order.shipping?.cost ?? 0) === 0
      ? 'GRATIS ($0)'
      : `$${Number(order.shippingCost ?? order.shipping?.cost ?? 0).toLocaleString('es-AR')}`;

    const paymentMethodDisplay = order.paymentMethod || order.payment?.method || 'No especificado';
    const paymentStatusDisplay = isPaid ? 'PAGADO / APROBADO' : (order.status || 'PENDIENTE').toUpperCase();

    const subject = isPaid
      ? `[CIRQA] 🟢 Pedido PAGADO #${orderNumber} - ${customer.name || 'Cliente'} (${totalFormatted})`
      : `[CIRQA] 🔔 Nuevo Pedido Creado #${orderNumber} - ${customer.name || 'Cliente'} (${paymentMethodDisplay})`;

    // Items en tabla HTML
    const itemsHtml = items.map((it) => {
      const priceUnit = Number(it.price || 0);
      const qty = Number(it.quantity || 1);
      const rowTotal = priceUnit * qty;
      const variantText = [it.variantName, it.filter, it.variantSubtitle].filter(Boolean).join(' · ') || 'Estándar';

      return `
        <tr style="border-bottom: 1px solid #f0ede8;">
          <td style="padding: 10px 8px; font-size: 13px; color: #111111;">
            <strong>${it.name || 'Armazón CIRQA'}</strong>
            ${it.modelCode ? `<span style="font-size: 11px; color: #B73302; margin-left: 6px;">[${it.modelCode}]</span>` : ''}
            <div style="font-size: 11px; color: #666666; margin-top: 2px;">Variante/Cristal: ${variantText}</div>
          </td>
          <td style="padding: 10px 8px; font-size: 13px; color: #111111; text-align: center;">${qty}</td>
          <td style="padding: 10px 8px; font-size: 13px; color: #111111; text-align: right; font-family: monospace;">$${priceUnit.toLocaleString('es-AR')}</td>
          <td style="padding: 10px 8px; font-size: 13px; color: #111111; text-align: right; font-family: monospace; font-weight: bold;">$${rowTotal.toLocaleString('es-AR')}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #faf9f6; margin: 0; padding: 24px; color: #111111;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #eae6df; overflow: hidden;">
          
          <!-- Header de Marca CIRQA -->
          <tr>
            <td style="background-color: #111111; padding: 24px 32px; text-align: left;">
              <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.25em; color: #E3A336; font-weight: 600; display: block; margin-bottom: 4px;">
                CIRQA ÓPTICA · SISTEMA DE GESTIÓN
              </span>
              <h1 style="color: #ffffff; font-size: 20px; font-weight: 400; margin: 0; letter-spacing: -0.5px;">
                ${isPaid ? '🟢 Pedido Confirmado y Pagado' : '🔔 Nuevo Pedido Ingresado'}
              </h1>
            </td>
          </tr>

          <!-- Resumen de Orden -->
          <tr>
            <td style="padding: 24px 32px 16px 32px;">
              <div style="background-color: #f7f6f2; border: 1px solid #ece7de; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size: 13px; color: #666666;">Número de Orden:</td>
                    <td style="font-size: 15px; font-weight: bold; font-family: monospace; color: #111111; text-align: right;">${orderNumber}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 13px; color: #666666; padding-top: 6px;">Estado del Pago:</td>
                    <td style="font-size: 12px; font-weight: bold; text-align: right; padding-top: 6px; color: ${isPaid ? '#047857' : '#B45309'};">
                      ${paymentStatusDisplay}
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size: 13px; color: #666666; padding-top: 6px;">Método de Pago:</td>
                    <td style="font-size: 13px; font-weight: 600; text-align: right; padding-top: 6px; color: #111111;">${paymentMethodDisplay}</td>
                  </tr>
                </table>
              </div>

              <!-- Bloque Datos del Cliente -->
              <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; color: #B73302; margin: 20px 0 10px 0; font-weight: bold;">
                1. Datos del Cliente
              </h3>
              <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 13px; border-collapse: collapse; margin-bottom: 16px;">
                <tr style="border-bottom: 1px solid #f3efe9;">
                  <td width="35%" style="color: #666666;">Nombre y Apellido:</td>
                  <td style="font-weight: 600; color: #111111;">${customer.name || '-'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3efe9;">
                  <td style="color: #666666;">DNI / Documento:</td>
                  <td style="font-family: monospace; color: #111111;">${customer.dni || 'No especificado'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3efe9;">
                  <td style="color: #666666;">Email de Contacto:</td>
                  <td><a href="mailto:${customer.email || ''}" style="color: #B73302; text-decoration: none;">${customer.email || '-'}</a></td>
                </tr>
                <tr style="border-bottom: 1px solid #f3efe9;">
                  <td style="color: #666666;">Teléfono:</td>
                  <td style="color: #111111;">${customer.phone || 'No especificado'}</td>
                </tr>
              </table>

              <!-- Bloque Dirección Completa de Envío -->
              <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; color: #B73302; margin: 20px 0 10px 0; font-weight: bold;">
                2. Destino y Dirección de Envío
              </h3>
              <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 13px; border-collapse: collapse; margin-bottom: 16px;">
                <tr style="border-bottom: 1px solid #f3efe9;">
                  <td width="35%" style="color: #666666;">Calle y Número:</td>
                  <td style="font-weight: 600; color: #111111;">${shippingAddress.street || 'S/D'} ${shippingAddress.number || 'S/N'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3efe9;">
                  <td style="color: #666666;">Piso / Departamento:</td>
                  <td style="color: #111111;">${[shippingAddress.floor ? `Piso ${shippingAddress.floor}` : '', shippingAddress.apartment ? `Depto ${shippingAddress.apartment}` : ''].filter(Boolean).join(' - ') || 'No aplica'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3efe9;">
                  <td style="color: #666666;">Ciudad / Localidad:</td>
                  <td style="color: #111111;">${shippingAddress.city || '-'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3efe9;">
                  <td style="color: #666666;">Provincia:</td>
                  <td style="color: #111111;">${shippingAddress.province || shippingAddress.state || '-'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3efe9;">
                  <td style="color: #666666;">Código Postal (CP):</td>
                  <td style="font-family: monospace; font-weight: bold; color: #111111;">${shippingAddress.postalCode || shippingAddress.zipCode || '-'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3efe9;">
                  <td style="color: #666666;">Método de Envío:</td>
                  <td style="color: #111111;">${order.shippingMethod || order.shipping?.carrier || 'Estándar'}</td>
                </tr>
              </table>

              <!-- Bloque Detalle de Productos -->
              <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; color: #B73302; margin: 24px 0 10px 0; font-weight: bold;">
                3. Artículos del Pedido
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                  <tr style="background-color: #f7f6f2; border-bottom: 2px solid #eae6df; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #666666;">
                    <th style="padding: 8px; text-align: left;">Producto</th>
                    <th style="padding: 8px; text-align: center;">Cant.</th>
                    <th style="padding: 8px; text-align: right;">Unitario</th>
                    <th style="padding: 8px; text-align: right;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Totales -->
              <div style="background-color: #fcfbf9; border: 1px solid #eae6df; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
                <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 13px;">
                  <tr>
                    <td style="color: #666666;">Subtotal Productos:</td>
                    <td style="text-align: right; font-family: monospace; color: #111111;">${subtotalFormatted}</td>
                  </tr>
                  ${Number(order.discountAmount || 0) > 0 ? `
                    <tr>
                      <td style="color: #047857;">Descuentos Aplicados:</td>
                      <td style="text-align: right; font-family: monospace; color: #047857; font-weight: bold;">${discountFormatted}</td>
                    </tr>
                  ` : ''}
                  <tr>
                    <td style="color: #666666;">Costo de Envío:</td>
                    <td style="text-align: right; font-family: monospace; color: #111111;">${shippingFormatted}</td>
                  </tr>
                  <tr style="border-top: 1px solid #e5e0d8;">
                    <td style="font-size: 15px; font-weight: bold; color: #111111; padding-top: 8px;">Total de la Orden:</td>
                    <td style="font-size: 17px; font-weight: bold; text-align: right; font-family: monospace; color: #B73302; padding-top: 8px;">
                      ${totalFormatted} ARS
                    </td>
                  </tr>
                </table>
              </div>

              ${order.receipt_url ? `
                <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 12px 16px; margin-bottom: 20px; font-size: 12px; color: #065f46;">
                  📎 <strong>Comprobante de Transferencia adjuntado:</strong>
                  <br><a href="${order.receipt_url}" target="_blank" style="color: #047857; font-weight: bold; text-decoration: underline; margin-top: 4px; display: inline-block;">Ver Comprobante Subido</a>
                </div>
              ` : ''}

              <!-- Enlace al Panel Administrador -->
              <div style="text-align: center; padding: 12px 0 20px 0;">
                <a href="${(process.env.CLIENT_URL || 'https://www.cirqa.com.ar').split(',')[0]}/admin" target="_blank" style="display: inline-block; background-color: #111111; color: #ffffff; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; padding: 12px 28px; border-radius: 999px; text-decoration: none;">
                  Abrir Panel Administrador CIRQA
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f7f6f2; padding: 16px 32px; text-align: center; font-size: 11px; color: #888888; border-top: 1px solid #eae6df;">
              Este es un correo automático generado por el e-commerce oficial de CIRQA (cirqa.com.ar).<br>
              Destinatario: ${adminEmail}
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    console.log(`[EmailService] Enviando correo de notificación de orden ${orderNumber} (${eventType}) a ${adminEmail}...`);

    const result = await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject,
      html,
    });

    console.log(`[EmailService] ✅ Notificación enviada exitosamente a ${adminEmail}:`, result);
    return result;
  } catch (err) {
    console.error('[EmailService] ❌ Error enviando notificación de pedido a admin:', err.message);
    // Nunca interrumpir la ejecución ni arrojar error
    return null;
  }
};

export default {
  resend,
  sendTestEmail,
  sendOrderNotificationToAdmin,
};
