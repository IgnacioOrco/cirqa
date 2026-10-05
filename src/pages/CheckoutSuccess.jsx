import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Printer,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { orderService, formatMediaUrl } from '../services/api';
import { useCart } from '../context/CartContext';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();

  // Mercado Pago puede devolver el ID en diferentes parámetros según la configuración
  const orderId =
    searchParams.get('orderId') ||
    searchParams.get('order_id') ||
    searchParams.get('external_reference') ||
    searchParams.get('collection_id') ||
    searchParams.get('payment_id');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Limpiar carrito de compras al confirmar éxito
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  // Cargar datos de la orden
  useEffect(() => {
    let isMounted = true;

    async function fetchOrder() {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await orderService.getOrderById(orderId);
        if (isMounted) {
          setOrder(data);
          setError(null);
        }
      } catch (err) {
        console.error('[CheckoutSuccess] Error consultando orden:', err);
        if (isMounted) {
          setError('No fue posible recuperar el detalle en vivo de la orden.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchOrder();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const orderNumber =
    order?.orderNumber ||
    (order?._id ? `CQ-${order._id.slice(-6).toUpperCase()}` : (orderId ? `CQ-${orderId.slice(-6).toUpperCase()}` : 'CQ-CONFIRMADA'));

  const items = order?.items || [];
  const customer = order?.customer || {};
  const shippingAddress = customer.shippingAddress || {};

  return (
    <div className="min-h-screen bg-[#FBF9F6] text-cirqa-negro font-montserrat flex flex-col justify-between selection:bg-cirqa-arena selection:text-cirqa-negro">
      {/* Barra de Navegación Minimalista */}
      <header className="border-b border-cirqa-negro/5 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-extrabold tracking-[0.25em] text-lg text-cirqa-negro uppercase">
              CIRQA
            </span>
          </Link>
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider text-emerald-600 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>PAGO APROBADO</span>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex-grow w-full">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="space-y-8"
        >
          {/* Tarjeta de Agradecimiento Principal */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-cirqa-negro/10 shadow-sm text-center relative overflow-hidden">
            {/* Halo sutil de fondo */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-gradient-to-b from-emerald-100/40 to-transparent blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-emerald-700">
                  Transacción Aprobada por Mercado Pago
                </span>
                <h1 className="text-2xl sm:text-4xl font-light tracking-tight text-cirqa-negro">
                  Tu compra ha sido procesada con éxito
                </h1>
                <p className="text-xs sm:text-sm text-cirqa-negro/60 font-light max-w-lg mx-auto pt-1">
                  Muchas gracias por confiar en la ingeniería circadiana de CIRQA. Ya estamos preparando tu pieza óptica para su calibrado y despacho.
                </p>
              </div>

              {/* Código de Orden Destacado */}
              <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-4 px-6 py-3.5 rounded-2xl bg-cirqa-surface border border-cirqa-negro/10 mt-4">
                <span className="text-xs text-cirqa-negro/60 font-medium">Código de Orden:</span>
                <span className="font-mono text-base font-bold text-cirqa-negro tracking-wider">
                  {orderNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Desglose de Pedido y Dirección */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Columna Izquierda: Productos comprados */}
            <div className="md:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-cirqa-negro/10 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-cirqa-negro/10 pb-4">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-cirqa-primario" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-cirqa-negro">
                    Resumen de lo comprado
                  </h2>
                </div>
                <span className="text-xs text-cirqa-negro/50 font-mono">
                  {items.length} {items.length === 1 ? 'producto' : 'productos'}
                </span>
              </div>

              {loading ? (
                <div className="py-8 text-center text-xs text-cirqa-negro/50">
                  Cargando detalle de los productos...
                </div>
              ) : items.length > 0 ? (
                <div className="space-y-4">
                  {items.map((it, idx) => (
                    <div
                      key={it._id || idx}
                      className="flex items-center gap-4 p-3 rounded-2xl bg-cirqa-surface/60 border border-cirqa-negro/5"
                    >
                      <div className="w-14 h-14 rounded-xl bg-white border border-cirqa-negro/5 p-1 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <img
                          src={formatMediaUrl(it.image || it.product?.images?.[0]?.url || it.product?.primaryImage)}
                          alt={it.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/products/_DSC8649.webp';
                          }}
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h3 className="text-xs font-semibold text-cirqa-negro truncate">
                          {it.name}
                        </h3>
                        <p className="text-[11px] text-cirqa-negro/60 truncate">
                          {it.filter ? `Cristal ${it.filter}` : 'Cristal Circadiano'} · Cantidad: {it.quantity || 1}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-cirqa-negro block">
                          ${((Number(it.price) || 0) * (it.quantity || 1)).toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 border-t border-cirqa-negro/10 flex items-center justify-between text-xs">
                    <span className="font-semibold text-cirqa-negro">Total abonado</span>
                    <span className="font-bold text-base text-cirqa-negro">
                      ${(Number(order?.totalAmount) || 0).toLocaleString('es-AR')} ARS
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-cirqa-negro/50">
                  Orden registrada en el sistema. Recibirás el desglose por email.
                </div>
              )}
            </div>

            {/* Columna Derecha: Envío y Notificaciones */}
            <div className="md:col-span-5 space-y-6">
              {/* Tarjeta Dirección */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-cirqa-negro/10 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-cirqa-negro/10 pb-4">
                  <MapPin className="w-4 h-4 text-cirqa-primario" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-cirqa-negro">
                    Dirección de Entrega
                  </h2>
                </div>

                <div className="text-xs space-y-1.5 text-cirqa-negro/80">
                  <p className="font-semibold text-cirqa-negro">
                    {customer.name || 'Cliente CIRQA'}
                  </p>
                  <p className="font-light">
                    {shippingAddress.street || 'Dirección informada en Mercado Pago'}
                    {shippingAddress.floor ? `, Piso ${shippingAddress.floor}` : ''}
                    {shippingAddress.apartment ? ` Depto ${shippingAddress.apartment}` : ''}
                  </p>
                  <p className="font-light">
                    {shippingAddress.city ? `${shippingAddress.city}, ` : ''}
                    {shippingAddress.state || ''}
                    {shippingAddress.zipCode ? ` (CP ${shippingAddress.zipCode})` : ''}
                  </p>
                  {customer.phone && (
                    <p className="font-light text-cirqa-negro/60 pt-1">
                      Tel: {customer.phone}
                    </p>
                  )}
                  {customer.email && (
                    <p className="font-light text-cirqa-negro/60">
                      Email: {customer.email}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-cirqa-negro/10 flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                  <Truck className="w-4 h-4 flex-shrink-0" />
                  <span>Envío asegurado bonificado. Te enviaremos el número de tracking por email.</span>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="space-y-2.5">
                <Link
                  to="/"
                  className="w-full bg-cirqa-negro hover:bg-cirqa-negro/85 text-white font-bold text-xs tracking-wider uppercase py-4 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <span>Volver a la Tienda</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full bg-white hover:bg-cirqa-surface text-cirqa-negro font-medium text-xs tracking-wider uppercase py-3.5 rounded-2xl border border-cirqa-negro/15 transition-all flex items-center justify-center gap-2"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Comprobante</span>
                </button>
              </div>
            </div>

          </div>
        </motion.div>
      </main>

      {/* Footer Mínimo */}
      <footer className="py-6 border-t border-cirqa-negro/5 text-center text-[11px] text-cirqa-negro/40">
        CIRQA Óptica de Precisión &copy; 2026 · Buenos Aires, Argentina
      </footer>
    </div>
  );
}
