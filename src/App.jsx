import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ComingSoon from './pages/ComingSoon';
import CheckoutSuccess from './pages/CheckoutSuccess';
import CheckoutFailure from './pages/CheckoutFailure';
import CheckoutPending from './pages/CheckoutPending';
import PrivateRoute from './components/PrivateRoute';
import CheckoutModal from './components/CheckoutModal';
import { CartProvider } from './context/CartContext';

/**
 * MODO PRÓXIMAMENTE / MANTENIMIENTO
 * - Cambiar a `true` para activar la pantalla de prelanzamiento oficial.
 * - Cambiar a `false` cuando la tienda esté lista para publicarse oficialmente.
 * - Para previsualizar la tienda completa sin desactivar este modo, visita cualquier URL con: `?preview=cirqa`
 */
const COMING_SOON_MODE = true;

export default function App() {
  const [isPreview, setIsPreview] = useState(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('preview') === 'cirqa') {
      try {
        sessionStorage.setItem('cirqa_preview_mode', 'true');
      } catch {}
      return true;
    }
    if (params.get('preview') === 'exit' || params.get('preview') === 'false') {
      try {
        sessionStorage.removeItem('cirqa_preview_mode');
      } catch {}
      return false;
    }
    try {
      return sessionStorage.getItem('cirqa_preview_mode') === 'true';
    } catch {
      return false;
    }
  });

  const showComingSoon = COMING_SOON_MODE && !isPreview;

  const handleExitPreview = () => {
    try {
      sessionStorage.removeItem('cirqa_preview_mode');
    } catch {}
    setIsPreview(false);
    window.location.href = window.location.pathname;
  };

  return (
    <CartProvider>
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

          {/* Rutas Públicas de Retorno de Checkout Pro (Mercado Pago back_urls) */}
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/checkout/failure" element={<CheckoutFailure />} />
          <Route path="/checkout/pending" element={<CheckoutPending />} />

          {showComingSoon ? (
            // Modo Próximamente activo: Se muestra la pantalla de prelanzamiento oficial
            <Route path="*" element={<ComingSoon />} />
          ) : (
            // Sitio web completo de CIRQA
            <>
              <Route path="/" element={<Home />} />
              <Route path="/catalogo" element={<Catalog />} />
              <Route path="/catalog" element={<Navigate to="/catalogo" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>

        {/* Modal Global de Checkout */}
        <CheckoutModal />

        {/* Indicador flotante cuando se navega en modo preview */}
        {COMING_SOON_MODE && isPreview && (
          <div className="fixed bottom-4 left-4 z-50 bg-cirqa-negro/95 backdrop-blur-md text-white text-[11px] font-mono px-3.5 py-1.5 rounded-full border border-white/20 shadow-2xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>MODO PREVIEW ACTIVO (?preview=cirqa)</span>
            <button
              onClick={handleExitPreview}
              className="ml-1 text-white/50 hover:text-white underline cursor-pointer text-[10px]"
            >
              Salir
            </button>
          </div>
        )}
      </BrowserRouter>
    </CartProvider>
  );
}


