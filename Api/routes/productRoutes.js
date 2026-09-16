import { Router } from 'express';
import {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { protectAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

// Rutas Públicas
router.get('/', getProducts);
router.get('/:slug', getProductBySlug);

// Rutas Protegidas (Solo Administrador Autenticado)
router.post('/', protectAdmin, createProduct);
router.put('/:id', protectAdmin, updateProduct);
router.delete('/:id', protectAdmin, deleteProduct);

export default router;
