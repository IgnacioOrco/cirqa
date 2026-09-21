import express from 'express';
import { createOrderPreference, uploadOrderReceipt } from '../controllers/orderController.js';
import { uploadReceipt } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/orders/:orderId/preference
 * @desc    Crear preferencia de Mercado Pago basada en los items de la orden
 * @access  Público
 */
router.post('/:orderId/preference', createOrderPreference);

/**
 * @route   POST /api/orders/:orderId/receipt
 * @desc    Subir comprobante de transferencia bancaria
 * @access  Público
 */
router.post('/:orderId/receipt', uploadReceipt.single('receipt'), uploadOrderReceipt);

export default router;

