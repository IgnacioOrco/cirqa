import { Router } from 'express';
import { login, register } from '../controllers/authController.js';

const router = Router();

// POST /api/auth/login - Validar credenciales y devolver token JWT
router.post('/login', login);

// POST /api/auth/register - Crear administrador inicial
router.post('/register', register);

export default router;
