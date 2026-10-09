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

// Subida individual (retrocompatibilidad)
export const uploadProductImage = multer({
  storage: productStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: imageFileFilter,
}).single('image');

// Subida múltiple para galería (soporte para archivos pesados y lotes de hasta 20 fotos simultáneas)
export const uploadProductImages = multer({
  storage: productStorage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB por archivo
    files: 20, // hasta 20 fotos simultáneas
  },
  fileFilter: imageFileFilter,
}).array('images', 20);
