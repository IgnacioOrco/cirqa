import express from 'express';
import { handleMercadoPagoWebhook } from '../controllers/webhookController.js';

const router = express.Router();

/**
 * @route   POST /api/webhooks/mercadopago
 * @desc    Recibir notificaciones IPN/Webhook de Mercado Pago
 * @access  Público (Firma validada internamente)
 */
router.post('/mercadopago', handleMercadoPagoWebhook);

export default router;
