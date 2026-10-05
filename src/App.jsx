import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
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
 * - Cambiar a `false` cuando la tienda esté lista para publicarse oficialmente.
 * - Para previsualizar la tienda completa sin desactivar este modo, visita cualquier URL con: `?preview=cirqa`
 */
const COMING_SOON_MODE = true;

export default function App() {
  const isPreview = typeof window !== 'undefined' && window.location.search.includes('preview=cirqa');
  const showComingSoon = COMING_SOON_MODE && !isPreview;

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
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>

        {/* Modal Global de Checkout */}
        <CheckoutModal />
      </BrowserRouter>
    </CartProvider>
  );
}


