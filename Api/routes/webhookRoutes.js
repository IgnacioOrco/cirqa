import express from 'express';
import { handleMercadoPagoWebhook } from '../controllers/webhookController.js';

const router = express.Router();

/**
 * @route   POST /api/webhooks/mercadopago
 * @route   POST /api/payments/webhook
 * @desc    Recibir notificaciones IPN/Webhook de Mercado Pago
 * @access  Público (Firma validada internamente)
 */
router.post('/mercadopago', handleMercadoPagoWebhook);
router.post('/webhook', handleMercadoPagoWebhook);

export default router;

