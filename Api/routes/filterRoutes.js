import { Router } from 'express';
import {
  getFilters,
  createFilter,
  seedDefaultFilters,
} from '../controllers/filterController.js';
import { protectAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

// Ruta Pública: Listar los filtros y sus precios
router.get('/', getFilters);

// Rutas Protegidas (Solo Administrador)
router.post('/', protectAdmin, createFilter);
router.post('/seed', protectAdmin, seedDefaultFilters);

export default router;
