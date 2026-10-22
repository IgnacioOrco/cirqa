import { Router } from 'express';
import { login, register, verifyToken } from '../controllers/authController.js';
import { protectAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

// POST /api/auth/login - Validar credenciales y devolver token JWT
router.post('/login', login);

// GET /api/auth/verify - Verificar token del administrador autenticado
router.get('/verify', protectAdmin, verifyToken);

// POST /api/auth/register - Crear administrador inicial
router.post('/register', register);

export default router;
