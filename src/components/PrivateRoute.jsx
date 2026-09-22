import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Componente Guard de Ruta Privada para CIRQA Admin
 * Protege las rutas administrativas verificando la existencia del token JWT en localStorage.
 * Si no está autenticado, redirige inmediatamente a /login preservando la ubicación original.
 */
export default function PrivateRoute({ children }) {
  const location = useLocation();
  const token = typeof window !== 'undefined' ? localStorage.getItem('cirqa_token') : null;

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
