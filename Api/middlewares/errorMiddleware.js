// Middleware para rutas no encontradas (404)
export const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Middleware centralizado de captura y respuesta de errores
export const errorHandler = (err, req, res, next) => {
  // Asegurar que el error mantenga cabeceras CORS para evitar bloqueo en el navegador
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
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

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Manejo de errores específicos de Mongoose (CastError y duplicados)
  let message = err.message;
  if (err.name === 'CastError') {
    message = `Recurso no encontrado. Formato de ID inválido: ${err.value}`;
  } else if (err.code === 11000) {
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'desconocido';
    message = `Ya existe un registro con ese valor en el campo '${field}'. Debe ser único.`;
  } else if (err.name === 'ValidationError') {
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
