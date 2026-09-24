import { Router } from 'express';
import {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  updateProductStock,
  deleteProduct,
  updateProductImage,
} from '../controllers/productController.js';
import { protectAdmin } from '../middlewares/authMiddleware.js';
import { uploadProductImage } from '../middlewares/uploadMiddleware.js';

const router = Router();

// ==========================================
// Rutas Públicas
// ==========================================

/**
 * @route   GET /api/products
 * @desc    Listar todos los productos
 * @access  Público
 */
router.get('/', getProducts);

/**
 * @route   GET /api/products/:slug
 * @desc    Obtener un producto por slug
 * @access  Público
 */
router.get('/:slug', getProductBySlug);

// ==========================================
// Rutas de Administración / Modificación
// ==========================================

/**
 * @route   POST /api/products
 * @desc    Crear un nuevo producto
 * @access  Privado (Admin)
 */
router.post('/', protectAdmin, createProduct);

/**
 * @route   PATCH /api/products/:id/stock
 * @desc    Actualizar el stock de un producto específico
 * @access  Privado (Admin)
 */
router.patch('/:id/stock', protectAdmin, updateProductStock);

/**
 * @route   PUT /api/products/:id
 * @desc    Actualizar todos los datos de un producto
 * @access  Privado (Admin)
 */
router.put('/:id', protectAdmin, updateProduct);

/**
 * @route   POST /api/products/:id/image
 * @desc    Subir y asociar imagen al producto
 * @access  Privado (Admin)
 */
router.post('/:id/image', protectAdmin, uploadProductImage, updateProductImage);

/**
 * @route   DELETE /api/products/:id
 * @desc    Eliminar un producto
 * @access  Privado (Admin)
 */
router.delete('/:id', protectAdmin, deleteProduct);

export default router;
