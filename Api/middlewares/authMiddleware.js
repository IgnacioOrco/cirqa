import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

export const protectAdmin = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      // Extraer token del header
      token = req.headers.authorization.split(' ')[1];

      // Verificar firma del token JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Buscar el administrador en base de datos excluyendo la contraseña
      req.admin = await Admin.findById(decoded.id).select('-password');

      if (!req.admin) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado. El administrador asociado a este token ya no existe.',
        });
      }

      next();
    } catch (error) {
      console.error(`[Auth Middleware Error]: ${error.message}`);
      return res.status(401).json({
        success: false,
        message: 'No autorizado. Token inválido, expirado o adulterado.',
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'No autorizado. Se requiere un header de autorización: Bearer <token>.',
    });
  }
};
