import { Router } from 'express';
import {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  updateProductStock,
  deleteProduct,
  updateProductImage,
  uploadProductImagesController,
  deleteProductImage,
  updateProductImageMetadata,
} from '../controllers/productController.js';
import { protectAdmin } from '../middlewares/authMiddleware.js';
import {
  uploadProductImage,
  uploadProductImages,
} from '../middlewares/uploadMiddleware.js';

const router = Router();

// ==========================================
// Rutas Públicas
// ==========================================

/**
 * @route   GET /api/products
 * @desc    Listar productos (con ?all=true para administradores)
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
// Rutas Protegidas de Administración
// ==========================================

/**
 * @route   POST /api/products
 * @desc    Crear un nuevo producto
 * @access  Privado (Admin)
 */
router.post('/', protectAdmin, createProduct);

/**
 * @route   PUT /api/products/:id
 * @desc    Actualizar todos los datos de un producto (incluye reorganización de galería)
 * @access  Privado (Admin)
 */
router.put('/:id', protectAdmin, updateProduct);

/**
 * @route   PATCH /api/products/:id/stock
 * @desc    Actualizar stock de un producto
 * @access  Privado (Admin)
 */
router.patch('/:id/stock', protectAdmin, updateProductStock);

/**
 * @route   POST /api/products/:id/image
 * @desc    Subir imagen individual (retrocompatibilidad)
 * @access  Privado (Admin)
 */
router.post('/:id/image', protectAdmin, uploadProductImage, updateProductImage);

/**
 * @route   POST /api/products/:id/images
 * @desc    Subir múltiples imágenes a la galería clasificada (hasta 5 simultáneas)
 * @access  Privado (Admin)
 */
router.post('/:id/images', protectAdmin, uploadProductImages, uploadProductImagesController);

/**
 * @route   DELETE /api/products/:id/images/:imageId
 * @desc    Eliminar una imagen puntual del producto y del disco
 * @access  Privado (Admin)
 */
router.delete('/:id/images/:imageId', protectAdmin, deleteProductImage);

/**
 * @route   PATCH /api/products/:id/images/:imageId
 * @desc    Modificar rol (tag), si es principal (isPrimary) o posición (order)
 * @access  Privado (Admin)
 */
router.patch('/:id/images/:imageId', protectAdmin, updateProductImageMetadata);

/**
 * @route   DELETE /api/products/:id
 * @desc    Eliminar un producto por completo
 * @access  Privado (Admin)
 */
router.delete('/:id', protectAdmin, deleteProduct);

export default router;
