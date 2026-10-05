import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock,
  AlertCircle,
  ArrowRight,
  Info,
  CheckCircle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { orderService } from '../services/api';
import { useCart } from '../context/CartContext';

export default function CheckoutPending() {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();

  const orderId =
    searchParams.get('orderId') ||
    searchParams.get('order_id') ||
    searchParams.get('external_reference') ||
    searchParams.get('collection_id') ||
    searchParams.get('payment_id');

  const [order, setOrder] = useState(null);

  // Limpiar carrito local para no duplicar compra pendiente
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) return;
      try {
        const data = await orderService.getOrderById(orderId);
        setOrder(data);
      } catch (e) {
        console.error('[CheckoutPending] Error:', e);
      }
    }
    loadOrder();
  }, [orderId]);

  const orderNumber =
    order?.orderNumber ||
    (order?._id ? `CQ-${order._id.slice(-6).toUpperCase()}` : (orderId ? `CQ-${orderId.slice(-6).toUpperCase()}` : 'CQ-PENDIENTE'));

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
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider text-amber-700 bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>PAGO PENDIENTE DE ACREDITACIÓN</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex-grow w-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full bg-white rounded-3xl p-8 sm:p-12 border border-cirqa-negro/10 shadow-lg text-center space-y-6 relative overflow-hidden"
        >
          {/* Halo sutil ámbar */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-gradient-to-b from-amber-100/40 to-transparent blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-amber-700">
                Instrucciones de Pago
              </span>
              <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-cirqa-negro">
                Tu pago está en proceso de revisión
              </h1>
              <p className="text-xs sm:text-sm text-cirqa-negro/60 font-light leading-relaxed max-w-md mx-auto">
                Si elegiste abonar en efectivo (Pago Fácil o Rapipago) o por transferencia bancaria, estamos a la espera de la confirmación automática del banco o entidad receptora.
              </p>
            </div>

            {/* Código de Orden */}
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-cirqa-surface border border-cirqa-negro/10">
              <span className="text-xs text-cirqa-negro/60 font-medium">Código de Orden:</span>
              <span className="font-mono text-sm font-bold text-cirqa-negro tracking-wider">
                {orderNumber}
              </span>
            </div>

            {/* Instrucciones paso a paso */}
            <div className="p-4 rounded-2xl bg-cirqa-surface border border-cirqa-negro/5 text-left text-xs text-cirqa-negro/70 space-y-2.5">
              <span className="font-semibold text-cirqa-negro block text-[11px] uppercase tracking-wider">
                Próximos pasos:
              </span>
              <div className="space-y-2 text-[11px] font-light">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-cirqa-negro text-white flex items-center justify-center text-[9px] font-bold mt-0.5 flex-shrink-0">
                    1
                  </div>
                  <p>
                    Aboná el cupón de pago en cualquier sucursal antes de su fecha de vencimiento.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-cirqa-negro text-white flex items-center justify-center text-[9px] font-bold mt-0.5 flex-shrink-0">
                    2
                  </div>
                  <p>
                    Apenas Mercado Pago registre la acreditación (suele demorar de 1 a 24 horas hábiles), tu pedido cambiará automáticamente a estado <strong className="text-cirqa-negro font-medium">Pagado</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-cirqa-negro text-white flex items-center justify-center text-[9px] font-bold mt-0.5 flex-shrink-0">
                    3
                  </div>
                  <p>
                    Recibirás un correo electrónico de confirmación con la guía de seguimiento de logística.
                  </p>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="pt-2 space-y-3">
              <Link
                to="/"
                className="w-full bg-cirqa-negro hover:bg-cirqa-negro/85 text-white font-bold text-xs tracking-wider uppercase py-4 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Volver a la Tienda</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="pt-3 border-t border-cirqa-negro/5 flex items-center justify-center gap-1.5 text-[11px] text-cirqa-negro/50">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>¿Tenés dudas sobre tu cupón? Contactanos a soporte@cirqa.com.ar</span>
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
