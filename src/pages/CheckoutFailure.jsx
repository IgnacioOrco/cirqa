import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, RefreshCw, ArrowLeft, HelpCircle, ShieldAlert } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CheckoutFailure() {
  const [searchParams] = useSearchParams();
  const { openCheckout } = useCart();

  const orderId =
    searchParams.get('orderId') ||
    searchParams.get('order_id') ||
    searchParams.get('external_reference');

  return (
    <div className="min-h-screen bg-[#FBF9F6] text-cirqa-negro font-montserrat flex flex-col justify-between selection:bg-cirqa-arena selection:text-cirqa-negro">
      {/* Header */}
      <header className="border-b border-cirqa-negro/5 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-extrabold tracking-[0.25em] text-lg text-cirqa-negro uppercase">
              CIRQA
            </span>
          </Link>
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider text-cirqa-carmin bg-cirqa-carmin/5 px-3.5 py-1.5 rounded-full border border-cirqa-carmin/20">
            <XCircle className="w-3.5 h-3.5" />
            <span>PAGO NO COMPLETADO</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex-grow w-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full bg-white rounded-3xl p-8 sm:p-12 border border-cirqa-negro/10 shadow-lg text-center space-y-6 relative overflow-hidden"
        >
          {/* Resplandor */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-gradient-to-b from-red-100/40 to-transparent blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-50 text-cirqa-carmin border border-red-200 flex items-center justify-center mx-auto shadow-sm">
              <XCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-cirqa-carmin">
                Estado de la Transacción
              </span>
              <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-cirqa-negro">
                El pago no pudo ser completado
              </h1>
              <p className="text-xs sm:text-sm text-cirqa-negro/60 font-light leading-relaxed max-w-md mx-auto">
                Mercado Pago no pudo procesar la operación. No se ha realizado ningún cobro en tu cuenta o tarjeta.
              </p>
            </div>

            {orderId && (
              <p className="text-[11px] font-mono text-cirqa-negro/50">
                Referencia: #{orderId}
              </p>
            )}

            {/* Motivos Frecuentes */}
            <div className="p-4 rounded-2xl bg-cirqa-surface border border-cirqa-negro/5 text-left text-xs text-cirqa-negro/70 space-y-2">
              <span className="font-semibold text-cirqa-negro block text-[11px] uppercase tracking-wider">
                Posibles causas:
              </span>
              <ul className="list-disc list-inside space-y-1 font-light text-[11px]">
                <li>Fondos o límite de compra insuficiente en la tarjeta.</li>
                <li>Rechazo de seguridad preventiva por parte del banco emisor.</li>
                <li>Cancelación voluntaria antes de completar el proceso en Mercado Pago.</li>
              </ul>
            </div>

            {/* Acciones */}
            <div className="pt-2 space-y-3">
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/';
                }}
                className="w-full bg-cirqa-negro hover:bg-cirqa-negro/85 text-white font-bold text-xs tracking-wider uppercase py-4 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reintentar Compra</span>
              </button>

              <Link
                to="/"
                className="w-full bg-white hover:bg-cirqa-surface text-cirqa-negro font-medium text-xs tracking-wider uppercase py-3.5 rounded-2xl border border-cirqa-negro/15 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver al Catálogo</span>
              </Link>
            </div>

            <div className="pt-3 border-t border-cirqa-negro/5 flex items-center justify-center gap-1.5 text-[11px] text-cirqa-negro/50">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>¿Necesitás asistencia? Escribinos a soporte@cirqa.com.ar</span>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-cirqa-negro/5 text-center text-[11px] text-cirqa-negro/40">
        CIRQA Óptica de Precisión &copy; 2026 · Buenos Aires, Argentina
      </footer>
    </div>
  );
}
