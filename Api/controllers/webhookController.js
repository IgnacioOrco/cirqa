import crypto from 'node:crypto';
import Order from '../models/Order.js';

/**
 * Valida la firma HMAC-SHA256 enviada por Mercado Pago en el header 'x-signature'
 * Documentación oficial de Mercado Pago:
 * Manifest: "id:[data.id];request-id:[x-request-id];ts:[ts];"
 */
const verifyMercadoPagoSignature = ({ xSignature, xRequestId, dataId, secret }) => {
  if (!xSignature || !secret) {
    return false;
  }

  // Desglosar partes de x-signature: "ts=...,v1=..."
  const parts = xSignature.split(',').reduce((acc, part) => {
    const [key, value] = part.trim().split('=');
    if (key && value) acc[key] = value;
    return acc;
  }, {});

  const ts = parts['ts'];
  const hash = parts['v1'];

  if (!ts || !hash) {
    return false;
  }

  // Construir la plantilla manifest según la especificación de Mercado Pago
  // Formato: id:[data.id];request-id:[x-request-id];ts:[ts];
  const manifest = `id:${dataId || ''};request-id:${xRequestId || ''};ts:${ts};`;

  // Calcular HMAC-SHA256
  const calculatedHash = crypto
    .createHmac('sha256', secret)
    .update(manifest)
    .digest('hex');

  // Comparación segura contra ataques de temporización (timing attacks)
  try {
    const calculatedBuffer = Buffer.from(calculatedHash, 'hex');
    const signatureBuffer = Buffer.from(hash, 'hex');

    if (calculatedBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(calculatedBuffer, signatureBuffer);
  } catch {
    return false;
  }
};

/**
 * Procesa la actualización del pago de forma asíncrona tras responder 200 OK
 */
const processPaymentUpdate = async (paymentId) => {
  try {
    const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mpAccessToken) {
      console.error('[Webhook MP] MERCADOPAGO_ACCESS_TOKEN no configurado.');
      return;
    }

    // 1. Consultar estado real del pago en la API de Mercado Pago
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
      },
    });

    if (!response.ok) {
      console.error(`[Webhook MP] Error al consultar pago ${paymentId}: ${response.statusText}`);
      return;
    }

    const payment = await response.json();
    const { status, external_reference: orderId, id: gatewayId } = payment;

    console.log(`[Webhook MP] Pago ${gatewayId} recibido con estado: '${status}' para orden: '${orderId}'`);

    if (status !== 'approved') {
      console.log(`[Webhook MP] El pago no está en estado 'approved' (estado actual: ${status}). Sin cambios.`);
      return;
    }

    if (!orderId) {
      console.warn(`[Webhook MP] El pago ${gatewayId} no posee external_reference (Order ID asociado).`);
      return;
    }

    // 2. VALIDACIÓN DE IDEMPOTENCIA ATÓMICA EN MONGODB:
    // Se busca la orden asegurando que el estado actual NO sea 'PAID'.
    // Esto garantiza que múltiples llamadas concurrentes o reintentos del webhook
    // sólo ejecuten la transición una única vez.
    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: orderId,
        status: { $ne: 'PAID' }, // Condición clave de idempotencia
      },
      {
        $set: {
          status: 'PAID',
          gateway_id: String(gatewayId),
          paymentMethod: 'MERCADO_PAGO',
        },
      },
      { new: true }
    );

    if (updatedOrder) {
      console.log(`[Webhook MP] ✅ Orden ${orderId} actualizada a PAID exitosamente.`);
      // Aquí se pueden disparar acciones secundarias: enviar email de confirmación, descontar stock, etc.
    } else {
      // Si no se actualizó, verificamos si ya estaba paga o si la orden no existe
      const existingOrder = await Order.findById(orderId);
      if (existingOrder && existingOrder.status === 'PAID') {
        console.log(`[Webhook MP] ℹ️ Idempotencia: La orden ${orderId} ya se encontraba en estado PAID. Operación ignorada.`);
      } else if (!existingOrder) {
        console.warn(`[Webhook MP] ⚠️ No se encontró ninguna orden con el ID: ${orderId}`);
      }
    }
  } catch (err) {
    console.error(`[Webhook MP] Error procesando el pago ${paymentId}:`, err);
  }
};

/**
 * @desc    Recepción de notificaciones Webhook de Mercado Pago
 * @route   POST /api/webhooks/mercadopago
 * @access  Público (Validado por firma x-signature)
 */
export const handleMercadoPagoWebhook = async (req, res) => {
  const xSignature = req.headers['x-signature'];
  const xRequestId = req.headers['x-request-id'];

  // Extraer ID del evento: puede venir en req.body.data.id o en req.query['data.id'] / req.query.id
  const dataId = req.body?.data?.id || req.query['data.id'] || req.query.id;
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  // 1. Validación de la firma x-signature
  if (webhookSecret) {
    const isValid = verifyMercadoPagoSignature({
      xSignature,
      xRequestId,
      dataId,
      secret: webhookSecret,
    });

    if (!isValid) {
      console.warn('[Webhook MP] Firma inválida o no provista. Rechazando solicitud.');
      return res.status(401).json({ error: 'Firma inválida' });
    }
  } else {
    console.warn('[Webhook MP] ADVERTENCIA: MERCADOPAGO_WEBHOOK_SECRET no configurada en variables de entorno.');
  }

  // 2. RETORNO INMEDIATO 200 OK
  // Mercado Pago exige una respuesta rápida (< 3000ms) para no disparar reintentos en bucle.
  res.status(200).send('OK');

  // 3. Procesamiento en segundo plano
  const eventType = req.body?.type || req.body?.topic || req.query.topic || req.query.type;

  if (eventType === 'payment' && dataId) {
    // Procesar asincrónicamente sin bloquear la respuesta HTTP ya enviada
    setImmediate(() => {
      processPaymentUpdate(dataId);
    });
  } else {
    console.log(`[Webhook MP] Evento ignorado (tipo: ${eventType}, dataId: ${dataId})`);
  }
};
