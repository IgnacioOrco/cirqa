import { Router } from 'express';
import { saveAbandonedCart } from '../controllers/abandonedCartController.js';

const router = Router();

router.post('/', saveAbandonedCart);

export default router;
