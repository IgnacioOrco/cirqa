import express from 'express';
import { quoteShippingController } from '../controllers/shippingController.js';

const router = express.Router();

/**
 * @route   POST /api/shipping/quote
 * @desc    Cotizar tarifas y tiempos de entrega de Zipnova Logistics
 * @access  Público
 */
router.post('/quote', quoteShippingController);

export default router;
