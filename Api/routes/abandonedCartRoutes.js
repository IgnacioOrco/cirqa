import { Router } from 'express';
import {
  saveAbandonedCart,
  recoverAbandonedCart,
} from '../controllers/abandonedCartController.js';

const router = Router();

router.post('/', saveAbandonedCart);
router.get('/recover/:token', recoverAbandonedCart);

export default router;
