import express from 'express';
import { quoteShippingController } from '../controllers/shippingController.js';

const router = express.Router();

/**
 * @route   POST /api/shipping/quote & POST /api/shipping
 * @desc    Cotizar tarifas y tiempos de entrega de Zipnova Logistics
 * @access  Público
 */
router.post('/quote', quoteShippingController);
router.post('/', quoteShippingController);
router.get('/quote', quoteShippingController);
router.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Zipnova Logistics Shipping Quotation API',
    endpoints: ['POST /quote', 'POST /'],
  });
});

export default router;
