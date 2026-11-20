import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Copy, Check, Loader2, ArrowRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { leadService } from '../services/api';
import { useCart } from '../context/CartContext';

const LEAD_DONE_KEY = 'cirqa_lead_done';
const LEAD_SESSION_DISMISS_KEY = 'cirqa_lead_dismissed_at';

export default function LeadPopup() {
  const location = useLocation();
  const { isCheckoutOpen, receiptOrder } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const path = location.pathname || '';
    if (
      isCheckoutOpen ||
      Boolean(receiptOrder) ||
      path.startsWith('/admin') ||
      path.startsWith('/login') ||
      path.startsWith('/checkout')
    ) {
      setIsOpen(false);
      return;
    }

    try {
      if (localStorage.getItem(LEAD_DONE_KEY)) return;
      if (sessionStorage.getItem(LEAD_SESSION_DISMISS_KEY)) return;
    } catch {
      // Ignorar errores de storage
    }

    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 4000);

    return () => clearTimeout(timer);
}, [location.pathname, isCheckoutOpen, receiptOrder]);

const handleClose = () => {
  if (!couponCode) {
    try {
      sessionStorage.setItem(LEAD_SESSION_DISMISS_KEY, String(Date.now()));
    } catch { }
  }
  setIsOpen(false);
};

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');

  if (!name.trim()) {
    setError('Por favor, ingresá tu nombre.');
    return;
  }

  if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    setError('Por favor, ingresá un correo electrónico válido.');
    return;
  }

  setLoading(true);
  try {
    const res = await leadService.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
    });
    const code = res?.couponCode || 'BIENVENIDA5';
    setCouponCode(code);
    try {
      localStorage.setItem(LEAD_DONE_KEY, 'true');
    } catch { }
  } catch (err) {
    setError(err?.message || 'No pudimos registrar tu solicitud. Intentá nuevamente.');
  } finally {
    setLoading(false);
  }
};

const handleCopyCode = async () => {
  if (!couponCode) return;
  try {
    await navigator.clipboard.writeText(couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  } catch {
    setCopied(false);
  }
};

return (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-cirqa-negro/60 backdrop-blur-xs"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-white rounded-3xl border border-cirqa-negro/10 shadow-2xl overflow-hidden z-10 font-montserrat"
        >
          {/* Cabecera oscura CIRQA */}
          <div className="bg-cirqa-negro text-white px-7 pt-7 pb-6 relative">
            <button
              type="button"
              onClick={handleClose}
              aria-label="Cerrar popup"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] font-bold text-cirqa-arena mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Regalo de Bienvenida
            </span>
            <h2 className="text-2xl font-light tracking-tight leading-snug">
              Obtené <span className="font-bold text-cirqa-arena">5% OFF</span> en tu primer CIRQA
            </h2>
            <p className="text-xs text-white/70 mt-1.5 font-light">
              Sumate a nuestra comunidad de wellness visual y recibí tu código exclusivo al instante.
            </p>
          </div>

          {/* Contenido */}
          <div className="p-7">
            {couponCode ? (
              <div className="text-center space-y-5">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-widest font-bold text-cirqa-primario">
                    ¡Tu código está listo!
                  </p>
                  <p className="text-xs text-cirqa-negro/70">
                    Ingresalo en el checkout para aplicar tu 5% OFF adicional.
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl bg-[#FAF9F6] border border-dashed border-cirqa-primario/50">
                  <span className="font-mono text-lg font-bold tracking-[0.18em] text-cirqa-negro">
                    {couponCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cirqa-negro hover:bg-cirqa-primario text-white text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar código</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-3.5 rounded-full bg-cirqa-primario hover:bg-cirqa-negro text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Seguir explorando
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-cirqa-negro/70 mb-1.5">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full px-4 py-2.5 rounded-xl border border-cirqa-negro/15 bg-[#FBFBFA] focus:bg-white focus:border-cirqa-primario focus:outline-none text-xs text-cirqa-negro transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-cirqa-negro/70 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-cirqa-negro/15 bg-[#FBFBFA] focus:bg-white focus:border-cirqa-primario focus:outline-none text-xs text-cirqa-negro transition-all"
                  />
                </div>

                {error && (
                  <p className="text-[11px] text-cirqa-carmin font-medium">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full bg-cirqa-negro hover:bg-cirqa-primario disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generando código...</span>
                    </>
                  ) : (
                    <>
                      <span>Obtener mi 5% OFF</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-cirqa-negro/50">
                  Válido para 1 uso por correo electrónico. Acumulable con 15% OFF por transferencia.
                </p>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);
}
