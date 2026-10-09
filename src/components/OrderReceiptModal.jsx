import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  Building2,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';
import { BANK_DETAILS } from '../data/bankDetails';

const OFFICIAL_WHATSAPP = '5491125073598';

/**
 * Modal Desacoplado de Comprobante de Compra (Transferencia Bancaria)
 * - Mantiene su propio backdrop oscuro persistente sin cerrarse accidentalmente.
 * - Desglose detallado con 15% OFF y Zipnova.
 * - Datos bancarios con botones de copiado rápido (CBU, Alias, CUIT, Titular).
 * - Botón para reabrir WhatsApp Oficial y volver a la tienda.
 */
export default function OrderReceiptModal({ isOpen, onClose, order }) {
  const [copiedKey, setCopiedKey] = useState(null);

  if (!isOpen || !order) return null;

  const handleCopy = (key, text) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text).trim());
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const bankInfo = {
    holder: BANK_DETAILS.companyName || '4 GRADOS SRL',
    cuit: BANK_DETAILS.cuit || '30-71828820-3',
    cbu: BANK_DETAILS.cbu || '0720167320000005551804',
    alias: BANK_DETAILS.alias || '4GRADOS.FABRICA',
    bank: BANK_DETAILS.bank || 'Santander',
  };

  const orderNumber = order.orderNumber || order._id?.slice(-6)?.toUpperCase() || 'CQ-0001';
  const customerName = order.customerName || order.shipping?.fullName || 'Cliente CIRQA';
  const subtotal = Number(order.subtotal || order.subtotalAmount || 0);
  const discount = Number(order.discountAmount || Math.round(subtotal * 0.15) || 0);
  const shippingCost = Number(order.shippingCost || order.shipping?.cost || 0);
  const total = Number(order.totalAmount || order.total || subtotal - discount + shippingCost);

  // Link prearmado a WhatsApp Oficial
  const waMessage = encodeURIComponent(
    `Hola CIRQA, acabo de generar mi orden por transferencia *#${orderNumber}* a nombre de *${customerName}* por un total de *$${total.toLocaleString('es-AR')} ARS*.\nAdjunto comprobante bancario para confirmar el despacho.`
  );
  const waUrl = order.waUrl || `https://wa.me/${OFFICIAL_WHATSAPP}?text=${waMessage}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto font-montserrat">
        {/* Backdrop oscuro persistente (closeOnBackdropClick = false) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 24 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl z-10 border border-cirqa-negro/10 text-center space-y-5 my-auto max-h-[92vh] overflow-y-auto"
        >
          {/* Botón cerrar sutil */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-cirqa-negro/40 hover:text-cirqa-negro rounded-full hover:bg-black/5 transition-colors cursor-pointer"
            aria-label="Cerrar comprobante"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icono de Confirmación */}
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          {/* Encabezado */}
          <div className="space-y-1.5">
            <span className="inline-block text-[10px] font-mono uppercase tracking-widest text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Pedido Confirmado · 15% OFF Aplicado
            </span>
            <h3 className="text-2xl font-light text-cirqa-negro tracking-tight pt-1">
              ¡Gracias, {customerName}!
            </h3>
            <p className="text-xs sm:text-sm text-cirqa-negro/60 font-light max-w-sm mx-auto leading-relaxed">
              Tu orden quedó registrada. Para despachar tus lentes biomiméticos, realizá la transferencia y envianos el comprobante por WhatsApp.
            </p>
          </div>

          {/* Tarjeta del Número de Orden */}
          <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-cirqa-negro/10 space-y-3">
            <div className="flex items-center justify-between border-b border-cirqa-negro/10 pb-2.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-cirqa-negro/50 block">
                Número de Orden
              </span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono font-bold text-cirqa-negro tracking-wider">
                  #{orderNumber}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('orderNumber', orderNumber)}
                  className="p-1 px-2.5 rounded-lg bg-white border border-cirqa-negro/15 hover:border-cirqa-negro/30 text-cirqa-negro/70 text-[10px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="Copiar número de orden"
                >
                  {copiedKey === 'orderNumber' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Desglose Económico Transparente */}
            <div className="space-y-1.5 text-xs text-left pt-1">
              <div className="flex justify-between text-cirqa-negro/70">
                <span>Subtotal productos:</span>
                <span className="font-mono">$ {subtotal.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Descuento Transferencia (15% OFF):
                </span>
                <span className="font-mono">-$ {discount.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between text-cirqa-negro/70">
                <span className="flex items-center gap-1">
                  <Truck className="w-3 h-3 text-cirqa-primario" />
                  Envío Zipnova ({order.shippingMethod || 'Estándar'}):
                </span>
                <span className="font-mono">+$ {shippingCost.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-cirqa-negro pt-2.5 border-t border-cirqa-negro/10">
                <span>Total a Transferir:</span>
                <span className="font-mono text-emerald-700 text-lg">
                  $ {total.toLocaleString('es-AR')} ARS
                </span>
              </div>
            </div>
          </div>

          {/* Tarjeta de Datos Bancarios con Copiado en 1 Clic */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1C1917] to-[#2D2A26] text-white text-left space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-400">
                  Datos Bancarios CIRQA
                </span>
              </div>
              <span className="text-[10px] font-mono text-white/50">{bankInfo.bank}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[9px] text-white/50 block font-light">Titular:</span>
                <span className="font-semibold text-white/95 truncate block">{bankInfo.holder}</span>
              </div>
              <div>
                <span className="text-[9px] text-white/50 block font-light">CUIT:</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-white/95 text-[11px]">{bankInfo.cuit}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('cuit', bankInfo.cuit)}
                    className="text-[9px] text-white/70 hover:text-white underline cursor-pointer"
                  >
                    {copiedKey === 'cuit' ? '✓' : 'Copiar'}
                  </button>
                </div>
              </div>
            </div>

            {/* ALIAS */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10">
              <div>
                <span className="text-[9px] text-white/50 uppercase block font-mono">Alias CBU</span>
                <span className="font-mono font-bold text-xs text-emerald-300">
                  {bankInfo.alias}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('alias', bankInfo.alias)}
                className="p-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedKey === 'alias' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>

            {/* CBU */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10">
              <div className="min-w-0 pr-2">
                <span className="text-[9px] text-white/50 uppercase block font-mono">CBU Bancario</span>
                <span className="font-mono text-[11px] text-white/90 truncate block">
                  {bankInfo.cbu}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('cbu', bankInfo.cbu)}
                className="p-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
              >
                {copiedKey === 'cbu' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Acciones Finales */}
          <div className="space-y-2.5 pt-1">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs tracking-wider uppercase shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Reabrir WhatsApp Oficial</span>
              <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl border border-cirqa-negro/15 text-xs text-cirqa-negro/70 hover:text-cirqa-negro hover:bg-black/5 transition-colors font-medium cursor-pointer"
            >
              Cerrar y Volver a la Tienda
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
