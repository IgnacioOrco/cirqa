import express from 'express';
import {
  createPreference,
  createOrderPreference,
  uploadOrderReceipt,
  getOrders,
  getOrderById,
  updateOrderShipping,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { protectAdmin } from '../middlewares/authMiddleware.js';
import { uploadReceipt } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/orders/create-preference
 * @desc    Crear preferencia de Mercado Pago Checkout Pro o registrar orden por Transferencia
 * @access  Público
 */
router.post('/create-preference', createPreference);

/**
 * @route   GET /api/orders
 * @desc    Obtener todas las órdenes registradas
 * @access  Privado (Admin)
 */
router.get('/', protectAdmin, getOrders);

/**
 * @route   GET /api/orders/:orderId
 * @desc    Obtener detalle de una orden por ID o orderNumber
 * @access  Público / Admin
 */
router.get('/:orderId', getOrderById);

/**
 * @route   PATCH /api/orders/:orderId/shipping
 * @desc    Actualizar datos y estado logístico del envío
 * @access  Privado (Admin)
 */
router.patch('/:orderId/shipping', protectAdmin, updateOrderShipping);

/**
 * @route   PATCH /api/orders/:orderId/status
 * @desc    Actualizar estado de pago / progreso de una orden (ej: confirmar transferencia a 'paid')
 * @access  Privado (Admin)
 */
router.patch('/:orderId/status', protectAdmin, updateOrderStatus);

/**
 * @route   POST /api/orders/:orderId/preference
 * @desc    Crear preferencia de Mercado Pago basada en los items de una orden preexistente
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
