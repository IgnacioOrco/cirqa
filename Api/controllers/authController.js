import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

// Generador de Token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * @desc    Autenticar administrador y obtener token JWT
 * @route   POST /api/auth/login
 * @access  Público
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validación básica de campos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporciona email y contraseña.',
      });
    }

    // Buscar administrador por email
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas. Usuario no encontrado.',
      });
    }

    // Validar contraseña
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas. Contraseña incorrecta.',
      });
    }

    // Respuesta exitosa con Token JWT
    return res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso.',
      token: generateToken(admin._id),
      admin: {
        id: admin._id,
        email: admin.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Crear un nuevo administrador (Solo para configuración inicial)
 * @route   POST /api/auth/register
 * @access  Público (o protegido)
 */
export const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son obligatorios.',
      });
    }

    const adminExists = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (adminExists) {
      return res.status(400).json({
        success: false,
        message: 'El administrador con este correo ya existe.',
      });
    }

    const newAdmin = await Admin.create({
      email,
      password,
    });

    return res.status(201).json({
      success: true,
      message: 'Administrador registrado con éxito.',
      token: generateToken(newAdmin._id),
      admin: {
        id: newAdmin._id,
        email: newAdmin.email,
      },
    });
  } catch (error) {
    next(error);
  }
};
