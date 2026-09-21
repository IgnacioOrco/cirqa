import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';

// Asegurar que la carpeta de destino exista
const uploadDir = path.resolve('uploads/receipts');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento local
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `receipt-${uniqueSuffix}${ext}`);
  },
});

// Filtro de tipos de archivo permitidos (.jpg, .jpeg, .png, .pdf)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de archivo no válido. Solo se aceptan .jpg, .png o .pdf'), false);
  }
};

// Límite de 5 MB
export const uploadReceipt = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter,
});
