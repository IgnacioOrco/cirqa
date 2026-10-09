import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';

// =========================================================================
// 1. Configuración para Comprobantes de Pago (/uploads/receipts)
// =========================================================================
const receiptUploadDir = path.resolve('uploads/receipts');
if (!fs.existsSync(receiptUploadDir)) {
  fs.mkdirSync(receiptUploadDir, { recursive: true });
}

const receiptStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, receiptUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `receipt-${uniqueSuffix}${ext}`);
  },
});

const receiptFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de comprobante no válido. Se aceptan JPG, PNG, WEBP o PDF'), false);
  }
};

export const uploadReceipt = multer({
  storage: receiptStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: receiptFilter,
});

// =========================================================================
// 2. Configuración para Galería de Productos (/uploads)
// =========================================================================
const productUploadDir = path.resolve('uploads');
if (!fs.existsSync(productUploadDir)) {
  fs.mkdirSync(productUploadDir, { recursive: true });
}

const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.webp';
    const cleanName = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `product-${cleanName}-${uniqueSuffix}${ext}`);
  },
});

const imageFileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de imagen no soportado. Formatos válidos: JPG, PNG, WEBP, AVIF'), false);
  }
};

/**
 * Inyecta cabeceras CORS en respuestas de error de Multer para evitar
 * que el navegador enmascare el error como un fallo de CORS huérfano.
 */
const setCorsHeaders = (req, res) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  }
};

// Instancias base de Multer configuradas a 25 MB
const multerSingleImage = multer({
  storage: productStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: imageFileFilter,
}).single('image');

const multerMultipleImages = multer({
  storage: productStorage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB por archivo
    files: 20, // hasta 20 fotos simultáneas
  },
  fileFilter: imageFileFilter,
}).array('images', 20);

/**
 * Middleware robusto para subida individual de imagen (retrocompatibilidad).
 * Captura errores de Multer (tamaño, tipo) con JSON 400 y cabeceras CORS activas.
 */
export const uploadProductImage = (req, res, next) => {
  multerSingleImage(req, res, (err) => {
    if (err) {
      setCorsHeaders(req, res);
      if (err instanceof multer.MulterError) {
        let message = `Error de carga: ${err.message}`;
        if (err.code === 'LIMIT_FILE_SIZE') {
          message = 'El archivo supera el tamaño máximo permitido de 25 MB.';
        }
        return res.status(400).json({
          success: false,
          error: err.code,
          message,
        });
      }
      return res.status(400).json({
        success: false,
        error: 'INVALID_FILE',
        message: err.message || 'Formato de imagen no soportado.',
      });
    }
    next();
  });
};

/**
 * Middleware robusto para subida múltiple a la galería de productos.
 * Captura errores de Multer (tamaño, cantidad, campo) con JSON 400 y cabeceras CORS activas.
 */
export const uploadProductImages = (req, res, next) => {
  multerMultipleImages(req, res, (err) => {
    if (err) {
      setCorsHeaders(req, res);
      if (err instanceof multer.MulterError) {
        let message = `Error de carga: ${err.message}`;
        if (err.code === 'LIMIT_FILE_SIZE') {
          message = 'Uno o más archivos superan el tamaño máximo permitido de 25 MB.';
        } else if (err.code === 'LIMIT_FILE_COUNT') {
          message = 'Se superó el límite máximo de 20 imágenes por lote.';
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          message = 'Campo de archivo inesperado. Los archivos deben enviarse en el campo "images".';
        }
        return res.status(400).json({
          success: false,
          error: err.code,
          message,
        });
      }
      return res.status(400).json({
        success: false,
        error: 'INVALID_FILE',
        message: err.message || 'Formato de archivo no soportado. Formatos válidos: JPG, PNG, WEBP, AVIF.',
      });
    }
    next();
  });
};
