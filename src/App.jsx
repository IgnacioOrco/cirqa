import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ComingSoon from './pages/ComingSoon';

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
      {showComingSoon ? (
        // Modo Próximamente activo: Solo se muestra la pantalla de lanzamiento oficial
        <Routes>
          <Route path="*" element={<ComingSoon />} />
        </Routes>
      ) : (
        // Sitio web completo de CIRQA (100% preservado e intacto)
        <Routes>
          {/* Ruta Pública Principal: E-commerce CIRQA */}
          <Route path="/" element={<Home />} />

          {/* Ruta de Acceso Administrativo */}
          <Route path="/login" element={<Login />} />

          {/* Ruta Privada: Panel de Administración */}
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Redirección ante cualquier ruta no coincidente */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}

