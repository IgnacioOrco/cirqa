import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShieldCheck,
  Truck,
  CreditCard,
  Lock,
  Loader2,
  AlertCircle,
  ArrowRight,
  Package,
  CheckCircle2,
  Trash2,
  Plus,
  Minus,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { orderService, formatMediaUrl } from '../services/api';

const PROVINCIAS_ARG = [
  'Buenos Aires',
  'Ciudad Autónoma de Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
];

export default function CheckoutModal() {
  const {
    isCheckoutOpen,
    closeCheckout,
    items,
    checkoutTargetItem,
    removeFromCart,
    updateQuantity,
  } = useCart();

  // Si hay un producto target directo (compra rápida), usamos ese; si no, el carrito
  const activeItems = checkoutTargetItem
    ? [checkoutTargetItem]
    : items;

  // Estados del formulario
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    confirmEmail: '',
    phone: '',
    dni: '',
    street: '',
    number: '',
    floor: '',
    apartment: '',
    city: '',
    province: 'Ciudad Autónoma de Buenos Aires',
    zipCode: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);

  const subtotal = activeItems.reduce(
    (acc, it) => acc + (Number(it.price) || 0) * (it.quantity || 1),
    0
  );
  const shippingCost = 0; // Envío asegurado bonificado de lanzamiento
  const total = subtotal + shippingCost;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Ingresá tu nombre y apellido completo';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ingresá un email válido';
    }

    if (!formData.confirmEmail.trim()) {
      newErrors.confirmEmail = 'Confirmá tu email';
    } else if (formData.email.trim().toLowerCase() !== formData.confirmEmail.trim().toLowerCase()) {
      newErrors.confirmEmail = 'Los correos electrónicos no coinciden';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Ingresá un teléfono de contacto para el correo';
    }

    if (!formData.dni.trim()) {
      newErrors.dni = 'Ingresá tu DNI o CUIL para la factura oficial';
    }

    if (!formData.street.trim()) {
      newErrors.street = 'Ingresá la calle o avenida';
    }

    if (!formData.number.trim()) {
      newErrors.number = 'Número';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Ingresá la localidad o ciudad';
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'Código Postal';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionError(null);

    if (activeItems.length === 0) {
      setSubmissionError('Tu carrito está vacío. Agregá al menos un armazón para continuar.');
      return;
    }

    if (!validateForm()) {
      const firstError = Object.keys(errors)[0];
      const el = document.getElementById(firstError);
      if (el) el.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      // Estructurar el payload para el backend de CIRQA
      const payload = {
        customer: {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          dni: formData.dni.trim(),
          shippingAddress: {
            street: `${formData.street.trim()} ${formData.number.trim()}`,
            floor: formData.floor.trim() || undefined,
            apartment: formData.apartment.trim() || undefined,
            city: formData.city.trim(),
            state: formData.province,
            zipCode: formData.zipCode.trim(),
          },
        },
        items: activeItems.map((item) => ({
          product: item.productId || item.id,
          name: item.name || 'Armazón CIRQA',
          modelCode: item.modelCode || 'Q-001',
          price: Number(item.price) || 0,
          quantity: item.quantity || 1,
          variantKey: item.variantKey || undefined,
          variantName: item.variantName || undefined,
          variantSubtitle: item.variantSubtitle || undefined,
          filter: item.variantName || (typeof item.filter === 'object' ? item.filter.name : item.filter),
          prescription: item.prescription?.notes || (item.prescription ? 'Con receta médica adjunta' : null),
          image: item.image || '/products/_DSC8649.webp',
        })),
        shippingCost: shippingCost,
      };

      const response = await orderService.createPreference(payload);

      // Extraer punto de inicio para Checkout Pro
      const initPoint =
        response?.initPoint ||
        response?.data?.initPoint ||
        response?.init_point ||
        response?.data?.init_point ||
        response?.sandboxInitPoint ||
        response?.data?.sandboxInitPoint ||
        response?.sandbox_init_point ||
        response?.data?.sandbox_init_point;

      if (!initPoint) {
        throw new Error(
          response?.message || 'No se recibió la dirección de pago de Mercado Pago. Reintenta en unos instantes.'
        );
      }

      // Redirigir a la pasarela de pago oficial de Mercado Pago
      window.location.href = initPoint;
    } catch (err) {
      console.error('[Checkout Error]:', err);
      setSubmissionError(
        err.message || 'Ocurrió un error al conectar con Mercado Pago. Verificá tu conexión e intentá de nuevo.'
      );
      setIsSubmitting(false);
    }
  };

  if (!isCheckoutOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6">
        {/* Backdrop suave */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !isSubmitting && closeCheckout()}
          className="fixed inset-0 bg-cirqa-negro/60 backdrop-blur-md"
        />

        {/* Contenedor Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-3xl border border-cirqa-negro/10 shadow-2xl overflow-hidden z-10 my-auto text-cirqa-negro font-montserrat"
        >
          {/* Header */}
          <div className="px-6 sm:px-8 py-5 border-b border-cirqa-negro/10 flex items-center justify-between bg-cirqa-surface/80 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-cirqa-negro text-white flex items-center justify-center font-bold text-xs tracking-wider">
                C
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-cirqa-primario font-semibold block">
                  CIRQA · Checkout Oficial
                </span>
                <h2 className="text-xl sm:text-2xl font-light tracking-tight text-cirqa-negro">
                  Completar Pedido
                </h2>
              </div>
            </div>

            <button
              onClick={closeCheckout}
              disabled={isSubmitting}
              className="p-2 text-cirqa-negro/60 hover:text-cirqa-negro rounded-full hover:bg-black/5 transition-colors disabled:opacity-30"
              aria-label="Cerrar checkout"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Formulario y Resumen */}
          <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto flex-grow divide-y lg:divide-y-0 lg:divide-x divide-cirqa-negro/10">
            {/* Columna Izquierda: Formulario de Datos */}
            <form onSubmit={handleSubmit} className="lg:col-span-7 p-6 sm:p-8 space-y-6">
              {submissionError && (
                <div className="p-4 rounded-2xl bg-cirqa-carmin/10 border border-cirqa-carmin/20 text-cirqa-carmin text-xs flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p className="leading-relaxed">{submissionError}</p>
                </div>
              )}

              {/* 1. Datos Personales */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-5 h-5 rounded-full bg-cirqa-negro text-white text-[10px] font-bold flex items-center justify-center">
                    1
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cirqa-negro">
                    Datos del Comprador
                  </h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1">
                      Nombre y Apellido *
                    </label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Ej: Sofía Albarracín"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-white text-cirqa-negro focus:outline-none transition-all ${
                        errors.name
                          ? 'border-cirqa-carmin ring-1 ring-cirqa-carmin/30'
                          : 'border-cirqa-negro/15 focus:border-cirqa-negro focus:ring-1 focus:ring-cirqa-negro/20'
                      }`}
                    />
                    {errors.name && (
                      <span className="text-[10px] text-cirqa-carmin mt-1 block">{errors.name}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1">
                        Email *
                      </label>
                      <input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="tu@email.com"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-white text-cirqa-negro focus:outline-none transition-all ${
                          errors.email
                            ? 'border-cirqa-carmin ring-1 ring-cirqa-carmin/30'
                            : 'border-cirqa-negro/15 focus:border-cirqa-negro focus:ring-1 focus:ring-cirqa-negro/20'
                        }`}
                      />
                      {errors.email && (
                        <span className="text-[10px] text-cirqa-carmin mt-1 block">{errors.email}</span>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1">
                        Confirmar Email *
                      </label>
                      <input
                        id="confirmEmail"
                        type="email"
                        name="confirmEmail"
                        value={formData.confirmEmail}
                        onChange={handleChange}
                        placeholder="Reiterá tu email"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-white text-cirqa-negro focus:outline-none transition-all ${
                          errors.confirmEmail
                            ? 'border-cirqa-carmin ring-1 ring-cirqa-carmin/30'
                            : 'border-cirqa-negro/15 focus:border-cirqa-negro focus:ring-1 focus:ring-cirqa-negro/20'
                        }`}
                      />
                      {errors.confirmEmail && (
                        <span className="text-[10px] text-cirqa-carmin mt-1 block">{errors.confirmEmail}</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1">
                        Teléfono / Móvil *
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Ej: +54 9 11 2345-6789"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-white text-cirqa-negro focus:outline-none transition-all ${
                          errors.phone
                            ? 'border-cirqa-carmin ring-1 ring-cirqa-carmin/30'
                            : 'border-cirqa-negro/15 focus:border-cirqa-negro focus:ring-1 focus:ring-cirqa-negro/20'
                        }`}
                      />
                      {errors.phone && (
                        <span className="text-[10px] text-cirqa-carmin mt-1 block">{errors.phone}</span>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1">
                        DNI / CUIL *
                      </label>
                      <input
                        id="dni"
                        type="text"
                        name="dni"
                        value={formData.dni}
                        onChange={handleChange}
                        placeholder="Para factura y logística"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-white text-cirqa-negro focus:outline-none transition-all ${
                          errors.dni
                            ? 'border-cirqa-carmin ring-1 ring-cirqa-carmin/30'
                            : 'border-cirqa-negro/15 focus:border-cirqa-negro focus:ring-1 focus:ring-cirqa-negro/20'
                        }`}
                      />
                      {errors.dni && (
                        <span className="text-[10px] text-cirqa-carmin mt-1 block">{errors.dni}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Dirección de Entrega */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-5 h-5 rounded-full bg-cirqa-negro text-white text-[10px] font-bold flex items-center justify-center">
                    2
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cirqa-negro">
                    Dirección de Entrega
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1">
                        Calle / Avenida *
                      </label>
                      <input
                        id="street"
                        type="text"
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                        placeholder="Ej: Av. del Libertador"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-white text-cirqa-negro focus:outline-none transition-all ${
                          errors.street
                            ? 'border-cirqa-carmin ring-1 ring-cirqa-carmin/30'
                            : 'border-cirqa-negro/15 focus:border-cirqa-negro focus:ring-1 focus:ring-cirqa-negro/20'
                        }`}
                      />
                      {errors.street && (
                        <span className="text-[10px] text-cirqa-carmin mt-1 block">{errors.street}</span>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1">
                        Altura *
                      </label>
                      <input
                        id="number"
                        type="text"
                        name="number"
                        value={formData.number}
                        onChange={handleChange}
                        placeholder="Ej: 2450"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-white text-cirqa-negro focus:outline-none transition-all ${
                          errors.number
                            ? 'border-cirqa-carmin ring-1 ring-cirqa-carmin/30'
                            : 'border-cirqa-negro/15 focus:border-cirqa-negro focus:ring-1 focus:ring-cirqa-negro/20'
                        }`}
                      />
                      {errors.number && (
                        <span className="text-[10px] text-cirqa-carmin mt-1 block">{errors.number}</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1">
                        Piso (Opcional)
                      </label>
                      <input
                        type="text"
                        name="floor"
                        value={formData.floor}
                        onChange={handleChange}
                        placeholder="Ej: 4"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-cirqa-negro/15 text-xs bg-white text-cirqa-negro focus:outline-none focus:border-cirqa-negro"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1">
                        Depto / Unidad (Opcional)
                      </label>
                      <input
                        type="text"
                        name="apartment"
                        value={formData.apartment}
                        onChange={handleChange}
                        placeholder="Ej: B"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-cirqa-negro/15 text-xs bg-white text-cirqa-negro focus:outline-none focus:border-cirqa-negro"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1">
                        Ciudad / Localidad *
                      </label>
                      <input
                        id="city"
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Ej: Palermo"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-white text-cirqa-negro focus:outline-none transition-all ${
                          errors.city
                            ? 'border-cirqa-carmin ring-1 ring-cirqa-carmin/30'
                            : 'border-cirqa-negro/15 focus:border-cirqa-negro focus:ring-1 focus:ring-cirqa-negro/20'
                        }`}
                      />
                      {errors.city && (
                        <span className="text-[10px] text-cirqa-carmin mt-1 block">{errors.city}</span>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1">
                        Provincia *
                      </label>
                      <select
                        name="province"
                        value={formData.province}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 rounded-xl border border-cirqa-negro/15 text-xs bg-white text-cirqa-negro focus:outline-none focus:border-cirqa-negro"
                      >
                        {PROVINCIAS_ARG.map((prov) => (
                          <option key={prov} value={prov}>
                            {prov}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1">
                        Código Postal *
                      </label>
                      <input
                        id="zipCode"
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        placeholder="Ej: 1425"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-white text-cirqa-negro focus:outline-none transition-all ${
                          errors.zipCode
                            ? 'border-cirqa-carmin ring-1 ring-cirqa-carmin/30'
                            : 'border-cirqa-negro/15 focus:border-cirqa-negro focus:ring-1 focus:ring-cirqa-negro/20'
                        }`}
                      />
                      {errors.zipCode && (
                        <span className="text-[10px] text-cirqa-carmin mt-1 block">{errors.zipCode}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón CTA para Desktop / Mobile */}
              <div className="pt-4 border-t border-cirqa-negro/10">
                <button
                  type="submit"
                  disabled={isSubmitting || activeItems.length === 0}
                  className="w-full bg-[#009EE3] hover:bg-[#0089C7] disabled:bg-gray-300 text-white font-bold text-xs tracking-wider uppercase py-4 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 group cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Conectando con Mercado Pago...</span>
                    </>
                  ) : (
                    <>
                      <span>Continuar a Mercado Pago</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-cirqa-negro/50">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    Pago seguro cifrado SSL
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-cirqa-arena" />
                    Garantía CIRQA 12 meses
                  </span>
                </div>
              </div>
            </form>

            {/* Columna Derecha: Resumen del Pedido */}
            <div className="lg:col-span-5 p-6 sm:p-8 bg-cirqa-surface/50 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-cirqa-negro mb-4">
                  Resumen de Compra ({activeItems.length} {activeItems.length === 1 ? 'ítem' : 'ítems'})
                </h3>

                {activeItems.length === 0 ? (
                  <div className="text-center py-12 text-cirqa-negro/50 space-y-2">
                    <Package className="w-8 h-8 mx-auto text-cirqa-negro/20" />
                    <p className="text-xs">No hay productos seleccionados.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                    {activeItems.map((item) => {
                      const variantLabel =
                        item.variantName ||
                        (typeof item.filter === 'object' ? item.filter?.name : item.filter) ||
                        'Día (84%)';
                      const badgeHex =
                        item.badgeColor ||
                        (typeof item.filter === 'object' ? item.filter?.hexCode : '#F3B93A') ||
                        '#F3B93A';

                      return (
                        <div
                          key={item.id}
                          className="p-3.5 bg-white rounded-2xl border border-cirqa-negro/10 flex items-center gap-3 relative shadow-xs"
                        >
                          {/* Miniatura correspondiente a la variante elegida */}
                          <div className="w-16 h-16 rounded-xl bg-[#F6F5F2] border border-cirqa-negro/5 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            <img
                              src={formatMediaUrl(item.image)}
                              alt={item.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/products/_DSC8649.webp';
                              }}
                            />
                          </div>

                          {/* Detalle */}
                          <div className="flex-grow min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <h4 className="text-xs font-semibold text-cirqa-negro truncate">
                                {item.name}
                              </h4>
                              {!checkoutTargetItem && (
                                <button
                                  type="button"
                                  onClick={() => removeFromCart(item.id)}
                                  className="text-cirqa-negro/30 hover:text-cirqa-carmin transition-colors p-1"
                                  title="Quitar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full border flex-shrink-0"
                                style={{ backgroundColor: badgeHex, borderColor: `${badgeHex}88` }}
                              />
                              <span className="text-[11px] text-cirqa-negro/80 font-medium truncate">
                                {variantLabel}
                              </span>
                              {item.variantSubtitle && (
                                <span className="text-[9px] font-mono text-cirqa-primario font-semibold uppercase tracking-wider truncate">
                                  · {item.variantSubtitle}
                                </span>
                              )}
                            </div>

                            {item.prescription && (
                              <span className="inline-block mt-1 text-[9px] bg-cirqa-arena/20 text-cirqa-negro font-medium px-2 py-0.5 rounded-full border border-cirqa-arena/40">
                                Receta oftalmológica adjunta
                              </span>
                            )}

                            <div className="flex items-center justify-between mt-2 pt-1 border-t border-cirqa-negro/5">
                              <span className="text-xs font-bold text-cirqa-negro">
                                ${((Number(item.price) || 0) * (item.quantity || 1)).toLocaleString('es-AR')}
                              </span>

                              {!checkoutTargetItem && (
                                <div className="flex items-center gap-1 bg-cirqa-surface rounded-lg border border-cirqa-negro/10 px-1 py-0.5">
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                                    className="p-1 hover:text-cirqa-negro text-cirqa-negro/60"
                                  >
                                    <Minus className="w-2.5 h-2.5" />
                                  </button>
                                  <span className="text-[11px] font-semibold px-1">
                                    {item.quantity || 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                                    className="p-1 hover:text-cirqa-negro text-cirqa-negro/60"
                                  >
                                    <Plus className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Beneficios de Envío */}
                <div className="mt-4 p-3.5 bg-white rounded-2xl border border-cirqa-negro/10 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div className="text-[11px]">
                    <span className="font-semibold text-cirqa-negro block">
                      Envío Asegurado a Todo el País
                    </span>
                    <span className="text-emerald-600 font-medium">Bonificado (Gratis)</span>
                  </div>
                </div>
              </div>

              {/* Totales */}
              <div className="mt-6 pt-4 border-t border-cirqa-negro/10 space-y-2">
                <div className="flex justify-between text-xs text-cirqa-negro/70 font-light">
                  <span>Subtotal</span>
                  <span>$ {subtotal.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-xs text-cirqa-negro/70 font-light">
                  <span>Envío asegurado</span>
                  <span className="text-emerald-600 font-medium">Gratis</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-cirqa-negro pt-2 border-t border-cirqa-negro/10">
                  <span>Total</span>
                  <span className="text-base font-extrabold text-cirqa-negro">
                    $ {total.toLocaleString('es-AR')} ARS
                  </span>
                </div>
                <p className="text-[10px] text-cirqa-negro/40 text-center font-light mt-2">
                  Tarjetas de crédito, débito y dinero en cuenta vía Mercado Pago.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
