// Middleware para rutas no encontradas (404)
export const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Middleware centralizado de captura y respuesta de errores
export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Manejo de errores específicos de Mongoose (CastError y duplicados)
  let message = err.message;
  if (err.name === 'CastError') {
    message = `Recurso no encontrado. Formato de ID inválido: ${err.value}`;
  } else if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
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
