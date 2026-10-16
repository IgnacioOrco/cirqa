import { Router } from 'express';
import {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../controllers/couponController.js';
import { protectAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

// Ruta pública para validar cupones en el checkout
router.post('/validate', validateCoupon);

// Rutas de administración
router.get('/', protectAdmin, getCoupons);
router.post('/', protectAdmin, createCoupon);
router.put('/:id', protectAdmin, updateCoupon);
router.delete('/:id', protectAdmin, deleteCoupon);

export default router;
