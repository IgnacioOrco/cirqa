import express from 'express';
import {
  quoteShippingController,
  getShippingLabelController,
} from '../controllers/shippingController.js';

const router = express.Router();

/**
 * @route   GET /api/shipping/label/:orderId
 * @desc    Obtener e imprimir etiqueta de envío oficial Shipnova / Zipnova
 * @access  Público / Admin
 */
router.get('/label/:orderId', getShippingLabelController);

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
