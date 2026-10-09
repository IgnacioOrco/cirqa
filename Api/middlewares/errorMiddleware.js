// Middleware para rutas no encontradas (404)
export const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Middleware centralizado de captura y respuesta de errores
export const errorHandler = (err, req, res, next) => {
  console.error('[API Error]:', err);

  // Asegurar que el error mantenga cabeceras CORS para evitar bloqueo en el navegador
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  }

  // Manejo de errores específicos de Multer (subida de archivos pesados)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'Uno o más archivos superan el tamaño máximo permitido (25MB).',
      });
    }
    return res.status(400).json({
      success: false,
      message: `Error al procesar archivos: ${err.message}`,
    });
  }

  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  // Manejo de errores específicos de Mongoose (CastError, duplicados y validación)
  let message = err.message;
  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Recurso no encontrado. Formato de ID inválido: ${err.value}`;
  } else if (err.code === 11000) {
    statusCode = 400;
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'desconocido';
    message = `Ya existe un registro con ese valor en el campo '${field}'. Debe ser único.`;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
