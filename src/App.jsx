import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ComingSoon from './pages/ComingSoon';
import PrivateRoute from './components/PrivateRoute';

/**
 * MODO PRÓXIMAMENTE / MANTENIMIENTO
 * - Cambiar a `false` cuando la tienda esté lista para publicarse oficialmente.
 * - Para previsualizar la tienda completa sin desactivar este modo, visita cualquier URL con: `?preview=cirqa`
 */
const COMING_SOON_MODE = true;

export default function App() {
  const isPreview = typeof window !== 'undefined' && window.location.search.includes('preview=cirqa');
  const showComingSoon = COMING_SOON_MODE && !isPreview;

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas de Administración accesibles para administradores */}
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          }
        />

        {showComingSoon ? (
          // Modo Próximamente activo: Se muestra la pantalla de prelanzamiento oficial
          <Route path="*" element={<ComingSoon />} />
        ) : (
          // Sitio web completo de CIRQA
          <>
            <Route path="/" element={<Home />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

