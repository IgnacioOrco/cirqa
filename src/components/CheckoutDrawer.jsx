import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShieldCheck,
  CreditCard,
  Building2,
  Lock,
  Loader2,
  AlertCircle,
  ArrowRight,
  Package,
  CheckCircle2,
  Trash2,
  Plus,
  Minus,
  Sparkles,
  MapPin,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  Truck,
  Percent,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { orderService, shippingService, couponService, formatMediaUrl } from '../services/api';

const PROVINCIAS_ARG = [
  'Ciudad Autónoma de Buenos Aires',
  'Buenos Aires',
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

const BANK_DETAILS = {
  bank: 'Banco Santander',
  holder: 'CIRQA S.A.S.',
  cuit: '30-71829482-4',
  cbu: '0720194820000003928174',
  alias: 'CIRQA.OPTICA.ARS',
};

const OFFICIAL_WHATSAPP = '5491125073598';

// Detección precisa de Ciudad Autónoma de Buenos Aires (CABA) para Envío Gratis Express
const isCABA = (cp, province) => {
  const postal = parseInt(cp, 10);
  const isPostalCABA = !isNaN(postal) && postal >= 1000 && postal <= 1499;
  const isProvCABA = (province || '').toLowerCase().includes('caba') || 
                     (province || '').toLowerCase().includes('autónoma') || 
                     (province || '').toLowerCase().includes('capital');
  return isPostalCABA || isProvCABA;
};

// Mapeo inteligente de Código Postal (CP) argentino a Provincia y Localidad
function detectProvinceFromZip(zipCode) {
  const cleanZip = String(zipCode).trim().replace(/\D/g, '');
  if (!cleanZip) return null;
  const num = parseInt(cleanZip.slice(0, 4), 10);

  if (num >= 1000 && num <= 1499) {
    return { province: 'Ciudad Autónoma de Buenos Aires', city: 'CABA' };
  }
  if ((num >= 1600 && num <= 1999) || (num >= 2700 && num <= 2999) || (num >= 6000 && num <= 7999)) {
    return { province: 'Buenos Aires', city: '' };
  }
  if (num >= 5000 && num <= 5999) {
    return { province: 'Córdoba', city: num === 5000 ? 'Córdoba Capital' : '' };
  }
  if ((num >= 2000 && num <= 2699) || (num >= 3000 && num <= 3099)) {
    return { province: 'Santa Fe', city: num === 2000 ? 'Rosario' : (num === 3000 ? 'Santa Fe' : '') };
  }
  if (num >= 5500 && num <= 5699) {
    return { province: 'Mendoza', city: num === 5500 ? 'Mendoza' : '' };
  }
  if (num >= 4000 && num <= 4199) {
    return { province: 'Tucumán', city: num === 4000 ? 'San Miguel de Tucumán' : '' };
  }
  if (num >= 4400 && num <= 4599) {
    return { province: 'Salta', city: num === 4400 ? 'Salta Capital' : '' };
  }
  if (num >= 3100 && num <= 3299) {
    return { province: 'Entre Ríos', city: num === 3100 ? 'Paraná' : '' };
  }
  if (num >= 3300 && num <= 3399) {
    return { province: 'Misiones', city: num === 3300 ? 'Posadas' : '' };
  }
  if (num >= 3400 && num <= 3499) {
    return { province: 'Corrientes', city: num === 3400 ? 'Corrientes' : '' };
  }
  if (num >= 3500 && num <= 3799) {
    return { province: 'Chaco', city: num === 3500 ? 'Resistencia' : '' };
  }
  if (num >= 8300 && num <= 8399) {
    return { province: 'Neuquén', city: num === 8300 ? 'Neuquén' : '' };
  }
  if (num >= 8400 && num <= 8599) {
    return { province: 'Río Negro', city: num === 8400 ? 'Bariloche' : '' };
  }
  if (num >= 9000 && num <= 9299) {
    return { province: 'Chubut', city: '' };
  }
  if (num >= 9400 && num <= 9499) {
    return { province: 'Tierra del Fuego', city: num === 9410 ? 'Ushuaia' : '' };
  }
  if (num >= 5400 && num <= 5499) {
    return { province: 'San Juan', city: num === 5400 ? 'San Juan' : '' };
  }
  if (num >= 5700 && num <= 5899) {
    return { province: 'San Luis', city: num === 5700 ? 'San Luis' : '' };
  }
  if (num >= 4600 && num <= 4699) {
    return { province: 'Jujuy', city: num === 4600 ? 'San Salvador de Jujuy' : '' };
  }
  return null;
}

export default function CheckoutDrawer() {
  const {
    isCheckoutOpen,
    closeCheckout,
    items,
    checkoutTargetItem,
    removeFromCart,
    updateQuantity,
    clearCart,
    openReceipt,
  } = useCart();

  // Si hay compra directa desde configurador, se usa ese item; si no, todos los items del carrito
  const activeItems = checkoutTargetItem ? [checkoutTargetItem] : items;

  // Selector de Medio de Pago: 'mercadopago' | 'transfer'
  const [paymentMethod, setPaymentMethod] = useState('mercadopago');

  // Estado de cotización de envío con Zipnova Logistics
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShippingOption, setSelectedShippingOption] = useState(null);
  const [isQuotingShipping, setIsQuotingShipping] = useState(false);
  const [shippingError, setShippingError] = useState(null);

  // Formulario ágil de envío
  const [formData, setFormData] = useState({
    name: '',
    email: '',
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

  // Estado de confirmación de transferencia
  const [transferSuccessOrder, setTransferSuccessOrder] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // Estado de Cupones de Descuento
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Detección en tiempo real de CABA
  const isCustomerCABA = isCABA(formData.zipCode, formData.province);

  // 1. Subtotal de productos a precio regular
  const subtotal = activeItems.reduce(
    (acc, it) => acc + (Number(it.price) || 0) * (it.quantity || 1),
    0
  );

  // 2. Costo de Envío: 100% bonificado para el cliente a todo el país ($0 reales)
  const shippingCost = 0;

  // 3. Descuento por Cupón
  const couponDiscount = appliedCoupon ? Math.min(subtotal, Number(appliedCoupon.discountAmount) || 0) : 0;
  const subtotalAfterCoupon = Math.max(0, subtotal - couponDiscount);

  // 4. Descuento Transferencia Bancaria (15% OFF) y Acumulación
  let transferDiscount = 0;
  if (paymentMethod === 'transfer') {
    if (!appliedCoupon || appliedCoupon.combinableWithTransfer !== false) {
      transferDiscount = Math.round(subtotalAfterCoupon * 0.15);
    }
  }

  // 5. Descuento total combinado
  const totalDiscount = Math.min(subtotal, couponDiscount + transferDiscount);
  const discountAmount = totalDiscount;

  // 6. Total Final a pagar: (subtotal - totalDiscount) sin cargo de envío
  const total = Math.max(0, subtotal - totalDiscount);

  // Función para validar y aplicar cupón
  const handleApplyCoupon = async (e) => {
    if (e) e.preventDefault();
    if (!couponInput.trim()) return;

    setIsValidatingCoupon(true);
    setCouponError(null);

    try {
      const res = await couponService.validate({
        code: couponInput.trim(),
        items: activeItems,
        subtotal,
        customerEmail: formData.email,
      });

      if (res.valid) {
        setAppliedCoupon({
          code: res.coupon.code,
          discountAmount: res.discountAmount,
          description: res.coupon.description,
          discountType: res.coupon.discountType,
          combinableWithTransfer: res.coupon.combinableWithTransfer,
        });
        setCouponInput('');
        setCouponError(null);
      } else {
        setCouponError(res.message || 'Código de descuento no válido.');
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || err.message || 'No se pudo aplicar el cupón.');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  // Re-validar cupón si cambia subtotal o items
  useEffect(() => {
    if (appliedCoupon) {
      couponService.validate({
        code: appliedCoupon.code,
        items: activeItems,
        subtotal,
        customerEmail: formData.email,
      }).then((res) => {
        if (res.valid) {
          setAppliedCoupon({
            code: res.coupon.code,
            discountAmount: res.discountAmount,
            description: res.coupon.description,
            discountType: res.coupon.discountType,
            combinableWithTransfer: res.coupon.combinableWithTransfer,
          });
        } else {
          setAppliedCoupon(null);
        }
      }).catch(() => {});
    }
  }, [subtotal, activeItems.length]);

  // Cotización automática y reactiva con detección inmediata de CABA y Andreani / OCA
  useEffect(() => {
    const cleanZip = String(formData.zipCode || '').trim().replace(/\D/g, '');
    const postalCode = parseInt(cleanZip, 10);
    const isPostalCABA = !isNaN(postalCode) && postalCode >= 1000 && postalCode <= 1499;
    const isDestCABA = isPostalCABA || isCABA(cleanZip, formData.province);

    if (activeItems.length === 0) {
      setShippingOptions([]);
      setSelectedShippingOption(null);
      return;
    }

    // 1. Detección Inmediata de CABA: No esperar cotización paga, setear inmediatamente Motomensajería Express (24 hs)
    if (isDestCABA) {
      const cabaOption = {
        id: 'caba_express_free',
        carrier: 'Motomensajería',
        service: 'express_caba_24h',
        name: 'Envío Gratis CABA · Motomensajería Express (24 hs)',
        price: 0,
        cost: 0,
        description: 'Entrega express en 24 hs en tu domicilio',
        estimatedDays: '24 hs hábiles',
        type: 'home',
        isFree: true,
      };
      setShippingOptions([cabaOption]);
      setSelectedShippingOption(cabaOption);
      setIsQuotingShipping(false);
      setShippingError(null);
      return;
    }

    // 2. Resto de Buenos Aires y el Interior del País: Andreani / OCA
    if (cleanZip.length >= 4) {
      let isCancelled = false;
      const timer = setTimeout(async () => {
        setIsQuotingShipping(true);
        setShippingError(null);
        try {
          const res = await shippingService.quote({
            postalCode: cleanZip,
            items: activeItems,
          });
          if (isCancelled) return;
          const rawOptions = Array.isArray(res?.options) ? res.options : [];
          
          // Estandarizar bajo nombres comerciales:
          // "Envío a Domicilio · Correo Andreani / OCA"
          // "Retiro en Sucursal · Correo Andreani / OCA"
          const mappedOptions = rawOptions.map((opt) => {
            const isPickup = opt.type === 'pickup' || (opt.name || '').toLowerCase().includes('punto') || (opt.name || '').toLowerCase().includes('sucursal');
            return {
              ...opt,
              name: isPickup
                ? 'Retiro en Sucursal · Correo Andreani / OCA'
                : 'Envío a Domicilio · Correo Andreani / OCA',
              carrier: 'Correo Andreani / OCA',
              description: opt.description
                ? opt.description.replace(/Zipnova/gi, 'Andreani / OCA')
                : (isPickup ? `Sucursal cercana a CP ${cleanZip}` : 'Entrega puerta a puerta certificada'),
            };
          });

          setShippingOptions(mappedOptions);
          if (mappedOptions.length > 0) {
            setSelectedShippingOption((prev) => {
              if (prev) {
                const match = mappedOptions.find((o) => o.id === prev.id || o.type === prev.type);
                if (match) return match;
              }
              return mappedOptions[0];
            });
          }
        } catch (err) {
          if (isCancelled) return;
          console.warn('[Shipping Quote Error]:', err);
          // Fallback seguro con Andreani / OCA
          const fallbackOptions = [
            {
              id: 'andreani_home_fb',
              name: 'Envío a Domicilio · Correo Andreani / OCA',
              description: 'Entrega puerta a puerta certificada en tu domicilio',
              carrier: 'Correo Andreani / OCA',
              cost: 4900,
              price: 4900,
              estimatedDays: '3 a 5 días hábiles',
              type: 'home',
            },
            {
              id: 'andreani_pickup_fb',
              name: 'Retiro en Sucursal · Correo Andreani / OCA',
              description: `Sucursal cercana a CP ${cleanZip}`,
              carrier: 'Correo Andreani / OCA',
              cost: 3800,
              price: 3800,
              estimatedDays: '2 a 4 días hábiles',
              type: 'pickup',
            },
          ];
          setShippingOptions(fallbackOptions);
          setSelectedShippingOption((prev) => prev ? fallbackOptions.find(o => o.type === prev.type) || fallbackOptions[0] : fallbackOptions[0]);
        } finally {
          if (!isCancelled) setIsQuotingShipping(false);
        }
      }, 400);

      return () => {
        isCancelled = true;
        clearTimeout(timer);
      };
    } else {
      setShippingOptions([]);
      setSelectedShippingOption(null);
    }
  }, [formData.zipCode, formData.province, activeItems.length]);

  // Autocompletado reactivo de CP y provincia
  const handleZipCodeChange = (e) => {
    const rawVal = e.target.value;
    setFormData((prev) => {
      const next = { ...prev, zipCode: rawVal };
      const detected = detectProvinceFromZip(rawVal);
      if (detected) {
        if (detected.province) next.province = detected.province;
        if (detected.city && (!prev.city || prev.city === 'CABA')) next.city = detected.city;
      }
      return next;
    });

    if (errors.zipCode) {
      setErrors((prev) => ({ ...prev, zipCode: null }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Ingresá tu nombre y apellido';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ingresá un email válido';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Teléfono requerido para el seguimiento';
    }
    if (!formData.dni.trim()) {
      newErrors.dni = 'DNI / CUIL requerido';
    }
    if (!formData.street.trim()) {
      newErrors.street = 'Ingresá la calle o avenida';
    }
    if (!formData.number.trim()) {
      newErrors.number = 'Número';
    }
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'Código Postal';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'Localidad o ciudad';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildOrderPayload = (selectedMethod) => {
    const isDestCABA = isCABA(formData.zipCode, formData.province);
    const shippingPrice = 0;
    const shippingMethodTitle = selectedShippingOption?.name || (isDestCABA
      ? 'Envío Gratis CABA · Motomensajería Express (24 hs)'
      : 'Envío Bonificado a todo el país · Correo Andreani / OCA');
    const subtotalAmount = subtotal;

    const shippingPayload = {
      carrier: selectedShippingOption?.carrier || (isDestCABA ? 'Motomensajería' : 'Correo Andreani / OCA'),
      service: selectedShippingOption?.service || selectedShippingOption?.serviceType || (isDestCABA ? 'express_caba_24h' : 'standard'),
      price: 0,
      cost: 0,
      originalCost: Number(selectedShippingOption?.originalCost ?? selectedShippingOption?.cost ?? 0),
      status: 'PENDIENTE',
      deliveryStatus: 'pending',
      trackingNumber: '',
      zipnovaShipmentId: '',
      labelUrl: '',
    };

    return {
      paymentMethod: selectedMethod === 'transfer' ? 'transfer' : 'mercadopago',
      couponCode: appliedCoupon?.code || null,
      couponDiscount,
      transferDiscount,
      subtotal: subtotalAmount,
      discountAmount: totalDiscount,
      shippingCost: shippingPrice,
      totalAmount: total,
      customer: {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        dni: formData.dni.trim(),
        shippingAddress: {
          street: `${formData.street.trim()} ${formData.number.trim()}`.trim(),
          number: formData.number.trim() || 'S/N',
          floor: formData.floor.trim() || undefined,
          apartment: formData.apartment.trim() || undefined,
          city: formData.city.trim(),
          province: formData.province,
          state: formData.province,
          postalCode: formData.zipCode.trim(),
          zipCode: formData.zipCode.trim(),
        },
      },
      items: activeItems.map((item) => {
        const rawId = item.productId || item._id || item.product || item.id;
        const cleanId = rawId && String(rawId).includes('_') ? String(rawId).split('_')[0] : rawId;
        const cleanCode = item.modelCode || (cleanId ? String(cleanId).split('_')[0] : 'Q-001');

        return {
          product: cleanId,
          productId: cleanId,
          id: cleanId,
          name: item.name || 'Armazón CIRQA',
          modelCode: cleanCode,
          slug: item.slug || String(cleanCode).toLowerCase(),
          price: Number(item.price) || 0,
          quantity: item.quantity || 1,
          variantKey: item.variantKey || undefined,
          variantName: item.variantName || undefined,
          variantSubtitle: item.variantSubtitle || undefined,
          filter: item.variantName || (typeof item.filter === 'object' ? item.filter.name : item.filter),
          prescription: item.prescription?.notes || (item.prescription ? 'Con receta médica adjunta' : null),
          image: item.image || '/products/_DSC8649.webp',
        };
      }),
      shippingMethod: shippingMethodTitle,
      shipping: shippingPayload,
      payment: {
        method: selectedMethod === 'transfer' ? 'transfer' : 'mercadopago',
        provider: selectedMethod === 'transfer' ? 'transfer' : 'mercadopago',
      },
    };
  };

  // Submit unificado según método de pago seleccionado
  const handleSubmitCheckout = async (e) => {
    e.preventDefault();
    setSubmissionError(null);

    if (activeItems.length === 0) {
      setSubmissionError('Tu carrito está vacío. Agregá al menos un armazón para continuar.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const activeMethod = paymentMethod === 'transfer' ? 'transfer' : 'mercadopago';
      const payload = buildOrderPayload(activeMethod);
      const response = await orderService.createPreference(payload);

      // CASO A: TRANSFERENCIA BANCARIA (15% OFF)
      if (paymentMethod === 'transfer') {
        const orderNum =
          response?.orderNumber ||
          response?.data?.orderNumber ||
          `CQ-${Math.floor(100000 + Math.random() * 900000)}`;

        const createdOrderId = response?.orderId || response?.data?.orderId;
        const finalCalculatedTotal = response?.totalAmount || response?.data?.totalAmount || total;

        // Construir mensaje preformateado para WhatsApp oficial de CIRQA
        const waMessage = `Hola CIRQA! Acabo de realizar el pedido *#${orderNum}* por un total de *$${finalCalculatedTotal.toLocaleString('es-AR')}*. Adjunto el comprobante de transferencia.`;

        const waUrl = `https://wa.me/${OFFICIAL_WHATSAPP}?text=${encodeURIComponent(waMessage)}`;

        // Abrir WhatsApp en nueva pestaña
        window.open(waUrl, '_blank', 'noopener,noreferrer');

        // Desacople completo: cerrar Drawer y abrir OrderReceiptModal independiente
        openReceipt({
          orderNumber: orderNum,
          orderId: createdOrderId,
          customerName: formData.name.trim(),
          subtotal,
          discountAmount,
          shippingCost,
          shippingMethod: selectedShippingOption ? selectedShippingOption.name : 'Envío a Domicilio - Zipnova',
          totalAmount: finalCalculatedTotal,
          waUrl,
        });

        // Limpiar carrito si no fue compra directa
        if (!checkoutTargetItem) {
          clearCart();
        }

        setIsSubmitting(false);
        return;
      }

      // CASO B: MERCADO PAGO CHECKOUT PRO
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
          response?.message || 'No se recibió el enlace de pago de Mercado Pago. Reintenta en instantes.'
        );
      }

      // Redirigir a la pasarela de Checkout Pro
      window.location.href = initPoint;
    } catch (err) {
      console.error('[Checkout Error]:', err);
      setSubmissionError(
        err.message || 'Ocurrió un error al procesar tu pedido. Verificá tu conexión e intentá de nuevo.'
      );
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setTransferSuccessOrder(null);
    closeCheckout();
  };

  if (!isCheckoutOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end font-montserrat">
        {/* Backdrop suave */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => !isSubmitting && closeCheckout()}
          className="fixed inset-0 bg-cirqa-negro/60 backdrop-blur-sm"
        />

        {/* DRAWER LATERAL ANIMADO */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden text-cirqa-negro border-l border-cirqa-negro/10"
        >
          {/* Header del Drawer */}
          <div className="px-6 py-5 border-b border-cirqa-negro/10 flex items-center justify-between bg-cirqa-surface/80 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-cirqa-negro text-white flex items-center justify-center font-bold text-xs">
                C
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-cirqa-primario font-semibold block">
                  CIRQA · Checkout en 1 Clic
                </span>
                <h2 className="text-lg font-light tracking-tight text-cirqa-negro">
                  {checkoutTargetItem ? 'Confirmar Compra' : 'Tu Bolsa de Compra'}
                </h2>
              </div>
            </div>

            <button
              onClick={() => !isSubmitting && closeCheckout()}
              disabled={isSubmitting}
              className="p-2 text-cirqa-negro/50 hover:text-cirqa-negro rounded-full hover:bg-black/5 transition-colors cursor-pointer disabled:opacity-30"
              aria-label="Cerrar checkout drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {submissionError && (
              <div className="p-3.5 rounded-2xl bg-cirqa-carmin/10 border border-cirqa-carmin/20 text-cirqa-carmin text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="leading-relaxed">{submissionError}</p>
              </div>
            )}

            {/* ========================================================= */}
            {/* 1. RESUMEN SUPERIOR: PRODUCTOS Y VARIANTE EXACTA          */}
            {/* ========================================================= */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-cirqa-negro/60">
                  Resumen de tu Configuración ({activeItems.length})
                </span>
                <span className="text-[10px] text-cirqa-primario bg-cirqa-primario/10 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 font-mono">
                  <Truck className="w-3 h-3" />
                  Andreani / OCA · Envíos a todo el país
                </span>
              </div>

              {activeItems.length === 0 ? (
                <div className="p-8 text-center bg-[#FBFBFA] rounded-2xl border border-dashed border-cirqa-negro/15">
                  <Package className="w-8 h-8 text-cirqa-negro/30 mx-auto mb-2" />
                  <p className="text-xs text-cirqa-negro/60 font-light">Tu bolsa está vacía.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-[#FBFBFA] rounded-2xl border border-cirqa-negro/10 flex items-center gap-3.5"
                    >
                      {/* Foto exacta de la variante configurada */}
                      <div className="w-16 h-16 rounded-xl bg-white border border-cirqa-negro/5 p-1 flex items-center justify-center flex-shrink-0 shadow-2xs overflow-hidden">
                        <img
                          src={formatMediaUrl(item.image)}
                          alt={item.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = '/products/_DSC8649.webp';
                          }}
                        />
                      </div>

                      {/* Detalles del modelo y variante */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-cirqa-primario uppercase">
                            {item.modelCode || 'Q-001'}
                          </span>
                          <span className="text-xs font-semibold text-cirqa-negro truncate">
                            {item.name}
                          </span>
                        </div>

                        {/* Badge de la variante */}
                        {item.variantName && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/10 flex-shrink-0"
                              style={{ backgroundColor: item.badgeColor || '#F3B93A' }}
                            />
                            <span className="text-[11px] font-medium text-cirqa-negro truncate">
                              {item.variantName}
                            </span>
                            {item.variantSubtitle && (
                              <span className="text-[9px] text-cirqa-negro/50 font-mono">
                                ({item.variantSubtitle})
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-mono font-bold text-cirqa-negro">
                            $ {Number(item.price || 0).toLocaleString('es-AR')}
                          </span>

                          {/* Controles de cantidad solo si no es compra rápida directa */}
                          {!checkoutTargetItem && (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center border border-cirqa-negro/15 rounded-lg bg-white overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                                  className="p-1 hover:bg-black/5 text-cirqa-negro/60"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-2 text-[11px] font-mono font-semibold">
                                  {item.quantity || 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                                  className="p-1 hover:bg-black/5 text-cirqa-negro/60"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.id)}
                                className="p-1 text-cirqa-negro/30 hover:text-cirqa-carmin transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ========================================================= */}
            {/* 2. FORMULARIO COMPACTO DE ENTREGA                         */}
            {/* ========================================================= */}
            <form id="checkout-form" onSubmit={handleSubmitCheckout} className="space-y-4 pt-2 border-t border-cirqa-negro/10">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cirqa-primario" />
                <span className="text-xs font-semibold uppercase tracking-wider text-cirqa-negro">
                  Datos de Entrega y Facturación
                </span>
              </div>

              {/* Nombre y Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="ej. Agustín Gómez"
                    className={`w-full px-3 py-2 rounded-xl border text-xs text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none transition-all ${
                      errors.name ? 'border-cirqa-carmin' : 'border-cirqa-negro/15 focus:border-cirqa-primario'
                    }`}
                  />
                  {errors.name && <p className="text-[10px] text-cirqa-carmin mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1">
                    Email de Confirmación *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="tu@email.com"
                    className={`w-full px-3 py-2 rounded-xl border text-xs text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none transition-all ${
                      errors.email ? 'border-cirqa-carmin' : 'border-cirqa-negro/15 focus:border-cirqa-primario'
                    }`}
                  />
                  {errors.email && <p className="text-[10px] text-cirqa-carmin mt-1">{errors.email}</p>}
                </div>
              </div>

              {/* Teléfono y DNI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1">
                    Teléfono Celular *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="11 5555-5555"
                    className={`w-full px-3 py-2 rounded-xl border text-xs text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none transition-all ${
                      errors.phone ? 'border-cirqa-carmin' : 'border-cirqa-negro/15 focus:border-cirqa-primario'
                    }`}
                  />
                  {errors.phone && <p className="text-[10px] text-cirqa-carmin mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1">
                    DNI / CUIL (Facturación) *
                  </label>
                  <input
                    type="text"
                    name="dni"
                    value={formData.dni}
                    onChange={handleChange}
                    placeholder="ej. 38123456"
                    className={`w-full px-3 py-2 rounded-xl border text-xs text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none transition-all ${
                      errors.dni ? 'border-cirqa-carmin' : 'border-cirqa-negro/15 focus:border-cirqa-primario'
                    }`}
                  />
                  {errors.dni && <p className="text-[10px] text-cirqa-carmin mt-1">{errors.dni}</p>}
                </div>
              </div>

              {/* Código Postal (Con autocompletado inteligente y cotizador) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-medium text-cirqa-negro/70">
                      Código Postal *
                    </label>
                    {isQuotingShipping && (
                      <span className="text-[9px] text-cirqa-primario flex items-center gap-1 font-mono">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        Cotizando...
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleZipCodeChange}
                    placeholder="ej. 1425"
                    className={`w-full px-3 py-2 rounded-xl border text-xs text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none transition-all ${
                      errors.zipCode ? 'border-cirqa-carmin' : 'border-cirqa-negro/15 focus:border-cirqa-primario'
                    }`}
                  />
                  {errors.zipCode && <p className="text-[10px] text-cirqa-carmin mt-1">{errors.zipCode}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1">
                    Ciudad / Localidad *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="ej. Palermo / CABA"
                    className={`w-full px-3 py-2 rounded-xl border text-xs text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none transition-all ${
                      errors.city ? 'border-cirqa-carmin' : 'border-cirqa-negro/15 focus:border-cirqa-primario'
                    }`}
                  />
                  {errors.city && <p className="text-[10px] text-cirqa-carmin mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1">
                    Provincia *
                  </label>
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-xl border border-cirqa-negro/15 text-xs text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none focus:border-cirqa-primario"
                  >
                    {PROVINCIAS_ARG.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dirección de Entrega */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-8 sm:col-span-9">
                  <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1">
                    Calle / Avenida *
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    placeholder="ej. Av. del Libertador"
                    className={`w-full px-3 py-2 rounded-xl border text-xs text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none transition-all ${
                      errors.street ? 'border-cirqa-carmin' : 'border-cirqa-negro/15 focus:border-cirqa-primario'
                    }`}
                  />
                  {errors.street && <p className="text-[10px] text-cirqa-carmin mt-1">{errors.street}</p>}
                </div>

                <div className="col-span-4 sm:col-span-3">
                  <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1">
                    Altura / Nº *
                  </label>
                  <input
                    type="text"
                    name="number"
                    value={formData.number}
                    onChange={handleChange}
                    placeholder="2450"
                    className={`w-full px-3 py-2 rounded-xl border text-xs text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none transition-all ${
                      errors.number ? 'border-cirqa-carmin' : 'border-cirqa-negro/15 focus:border-cirqa-primario'
                    }`}
                  />
                  {errors.number && <p className="text-[10px] text-cirqa-carmin mt-1">{errors.number}</p>}
                </div>
              </div>

              {/* Piso y Departamento */}
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
                    placeholder="4"
                    className="w-full px-3 py-2 rounded-xl border border-cirqa-negro/15 text-xs text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none focus:border-cirqa-primario"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1">
                    Depto (Opcional)
                  </label>
                  <input
                    type="text"
                    name="apartment"
                    value={formData.apartment}
                    onChange={handleChange}
                    placeholder="B"
                    className="w-full px-3 py-2 rounded-xl border border-cirqa-negro/15 text-xs text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none focus:border-cirqa-primario"
                  />
                </div>
              </div>

              {/* ========================================================= */}
              {/* SELECTOR DINÁMICO DE ENVÍO ANDREANI / OCA / CABA          */}
              {/* ========================================================= */}
              <div className="space-y-2.5 pt-3 border-t border-cirqa-negro/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-cirqa-primario" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-cirqa-negro">
                      Opciones de Envío & Logística
                    </span>
                  </div>
                  {selectedShippingOption && (
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full border text-emerald-700 bg-emerald-50 border-emerald-300 font-bold"
                    >
                      Envío 100% Bonificado
                    </span>
                  )}
                </div>

                {!formData.zipCode.trim() ? (
                  <div className="p-3.5 rounded-2xl bg-[#FBFBFA] border border-dashed border-cirqa-negro/15 text-xs text-cirqa-negro/60 flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-cirqa-negro/40 flex-shrink-0" />
                    <p className="text-[11px] font-light">
                      Ingresá tu <strong>Código Postal</strong> para activar el <strong>Envío Gratis a todo el país</strong> y calcular tiempos estimados.
                    </p>
                  </div>
                ) : isQuotingShipping && shippingOptions.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-[#FBFBFA] border border-cirqa-negro/10 text-center space-y-1.5">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-cirqa-primario" />
                    <p className="text-xs text-cirqa-negro/70 font-medium">
                      Consultando opciones de entrega para CP {formData.zipCode}...
                    </p>
                  </div>
                ) : shippingOptions.length > 0 ? (
                  <div className="space-y-2">
                    {shippingOptions.map((opt) => {
                      const isSelected = selectedShippingOption?.id === opt.id;
                      const isFreeOption = opt.isFree || Number(opt.cost) === 0;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedShippingOption(opt)}
                          className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-cirqa-primario bg-cirqa-primario/5 ring-1 ring-cirqa-primario shadow-2xs'
                              : 'border-cirqa-negro/15 hover:border-cirqa-negro/30 bg-[#FBFBFA]'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div
                              className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                isSelected
                                  ? 'border-cirqa-primario bg-cirqa-primario'
                                  : 'border-cirqa-negro/30'
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-cirqa-negro">
                                  {opt.name}
                                </span>
                                {isFreeOption ? (
                                  <span className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                                    GRATIS $0
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cirqa-negro/5 text-cirqa-negro/70 font-medium">
                                    {opt.estimatedDays || '3 a 5 días hábiles'}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-cirqa-negro/60 font-light truncate mt-0.5">
                                {opt.description || `Operado por ${opt.carrier}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {isFreeOption ? (
                              <>
                                <span className="text-xs font-mono font-bold text-emerald-600 block">
                                  $ 0
                                </span>
                                <span className="text-[9px] text-emerald-600 font-semibold font-mono">
                                  BONIFICADO
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="text-xs font-mono font-bold text-cirqa-negro block">
                                  $ {Number(opt.cost || 0).toLocaleString('es-AR')}
                                </span>
                                <span className="text-[9px] text-cirqa-negro/50 font-mono">
                                  Andreani / OCA
                                </span>
                              </>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    No se encontraron opciones para el CP ingresado. Verifica los 4 dígitos.
                  </div>
                )}

                {shippingError && (
                  <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200">
                    {shippingError}
                  </p>
                )}
              </div>
            </form>

            {/* ========================================================= */}
            {/* 3. SELECTOR DUAL DE MEDIOS DE PAGO (Tabs / Radio Cards)   */}
            {/* ========================================================= */}
            <div className="space-y-3 pt-3 border-t border-cirqa-negro/10">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-cirqa-negro/60 block">
                Seleccioná el Método de Pago
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Opción A: Mercado Pago con Badge de 6 Cuotas Sin Interés */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('mercadopago')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-2.5 ${
                    paymentMethod === 'mercadopago'
                      ? 'border-[#009EE3] bg-[#009EE3]/5 ring-1 ring-[#009EE3]'
                      : 'border-cirqa-negro/15 hover:border-cirqa-negro/30 bg-[#FBFBFA]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#009EE3] flex items-center justify-center text-white">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-cirqa-negro">
                        Mercado Pago
                      </span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        paymentMethod === 'mercadopago'
                          ? 'border-[#009EE3] bg-[#009EE3]'
                          : 'border-cirqa-negro/30'
                      }`}
                    >
                      {paymentMethod === 'mercadopago' && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {/* Badge destacado de 6 Cuotas Sin Interés */}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#009EE3] text-white shadow-2xs">
                      <Sparkles className="w-2.5 h-2.5" />
                      6 CUOTAS SIN INTERÉS
                    </span>
                    <p className="text-[11px] font-semibold text-[#007EB5] leading-snug">
                      Hasta 6 cuotas sin interés de ${Math.round(total / 6).toLocaleString('es-AR')} con todas las tarjetas
                    </p>
                    <span className="text-[10px] font-mono text-cirqa-negro/50 block">
                      Tarjetas de crédito, débito o dinero en cuenta
                    </span>
                  </div>
                </button>

                {/* Opción B: Transferencia Bancaria (Con Badge 15% OFF) */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('transfer')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-2.5 ${
                    paymentMethod === 'transfer'
                      ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600'
                      : 'border-cirqa-negro/15 hover:border-cirqa-negro/30 bg-[#FBFBFA]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-700 flex items-center justify-center text-white">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-cirqa-negro">
                        Transferencia
                      </span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        paymentMethod === 'transfer'
                          ? 'border-emerald-600 bg-emerald-600'
                          : 'border-cirqa-negro/30'
                      }`}
                    >
                      {paymentMethod === 'transfer' && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-2xs">
                      <Sparkles className="w-2.5 h-2.5" />
                      15% DE DESCUENTO
                    </span>
                    <p className="text-[11px] text-emerald-800 font-medium leading-snug">
                      Ahorrá ${Math.round(subtotal * 0.15).toLocaleString('es-AR')} abonando directo por transferencia.
                    </p>
                  </div>
                </button>
              </div>

              {/* TARJETA ELEGANTE DE DATOS BANCARIOS (Si se seleccionó Transferencia) */}
              <AnimatePresence>
                {paymentMethod === 'transfer' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: 10, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1C1917] to-[#2D2A26] text-white space-y-3.5 shadow-md">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400">
                            Datos Bancarios CIRQA
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-white/50">{BANK_DETAILS.bank}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] text-white/50 block font-light">Titular de Cuenta:</span>
                          <span className="font-semibold text-white/95">{BANK_DETAILS.holder}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-white/50 block font-light">CUIT:</span>
                          <span className="font-mono text-white/95">{BANK_DETAILS.cuit}</span>
                        </div>
                      </div>

                      {/* Alias y CBU con botones para copiar */}
                      <div className="space-y-2 pt-1 border-t border-white/10">
                        {/* ALIAS */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10">
                          <div>
                            <span className="text-[9px] text-white/50 uppercase block font-mono">Alias CBU</span>
                            <span className="font-mono font-bold text-xs text-emerald-300">
                              {BANK_DETAILS.alias}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(BANK_DETAILS.alias, 'alias')}
                            className="p-1.5 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {copiedField === 'alias' ? (
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
                            <span className="font-mono text-xs text-white/90 truncate block">
                              {BANK_DETAILS.cbu}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(BANK_DETAILS.cbu, 'cbu')}
                            className="p-1.5 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
                          >
                            {copiedField === 'cbu' ? (
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

                      {/* Instrucción clara */}
                      <p className="text-[11px] text-white/70 font-light leading-relaxed pt-1 italic">
                        * Transferí el total y enviá el comprobante junto con tu número de orden para confirmar el pedido.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 4. FOOTER: RESUMEN Y BOTÓN DE ACCIÓN                      */}
          {/* ========================================================= */}
          <div className="p-6 border-t border-cirqa-negro/10 bg-[#FBFBFA] flex-shrink-0 space-y-3.5">
            {/* Input / Badge de Cupón de Descuento */}
            <div className="p-3 rounded-2xl bg-white border border-cirqa-negro/10 shadow-2xs">
              {!appliedCoupon ? (
                <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-cirqa-negro/80 flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-cirqa-primario" />
                    ¿Tenés un código de descuento?
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        if (couponError) setCouponError(null);
                      }}
                      placeholder="Ingresá tu código (ej: CIRQA10)"
                      className="flex-grow px-3 py-2 text-xs font-mono uppercase bg-[#FBFBFA] border border-cirqa-negro/15 rounded-xl focus:outline-none focus:border-cirqa-negro transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isValidatingCoupon || !couponInput.trim()}
                      className="px-4 py-2 bg-cirqa-negro hover:bg-black text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                    >
                      {isValidatingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Aplicar'}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-[11px] text-red-600 font-medium flex items-center gap-1 pt-0.5">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      {couponError}
                    </p>
                  )}
                </form>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                      %
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-emerald-950 tracking-wider">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                          Aplicado
                        </span>
                      </div>
                      {appliedCoupon.description ? (
                        <p className="text-[10px] text-emerald-700 font-light mt-0.5">{appliedCoupon.description}</p>
                      ) : (
                        <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                          Descuento de ${couponDiscount.toLocaleString('es-AR')}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-[11px] text-red-600 hover:text-red-800 font-semibold cursor-pointer px-2 py-1 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Quitar
                  </button>
                </div>
              )}
            </div>

            {/* Subtotal Regular */}
            <div className="flex items-center justify-between text-xs text-cirqa-negro/70">
              <span>Subtotal</span>
              <span className="font-mono font-medium">$ {subtotal.toLocaleString('es-AR')}</span>
            </div>

            {/* Descuento por Cupón */}
            {appliedCoupon && couponDiscount > 0 && (
              <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Cupón ({appliedCoupon.code})
                </span>
                <span className="font-mono font-bold">
                  -$ {couponDiscount.toLocaleString('es-AR')}
                </span>
              </div>
            )}

            {/* Descuento 15% Transferencia */}
            {paymentMethod === 'transfer' && transferDiscount > 0 && (
              <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Descuento Transferencia (15% OFF)
                </span>
                <span className="font-mono font-bold">
                  -$ {transferDiscount.toLocaleString('es-AR')}
                </span>
              </div>
            )}

            {/* Envío Bonificado */}
            <div className="flex items-center justify-between text-xs text-cirqa-negro/70">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {selectedShippingOption
                    ? selectedShippingOption.name
                    : 'Envío a todo el país'}
                </span>
              </span>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-block">
                  GRATIS $0
                </span>
                <span className="block text-[10px] text-emerald-700 font-medium">
                  Envío bonificado a todo el país
                </span>
              </div>
            </div>

            {/* Total a Pagar */}
            <div className="flex items-center justify-between text-base font-medium text-cirqa-negro pt-2.5 border-t border-cirqa-negro/10">
              <div>
                <span className="block font-bold">Total a pagar</span>
                {totalDiscount > 0 && (
                  <span className="text-[10px] text-emerald-700 font-medium block">
                    Ahorro total de ${totalDiscount.toLocaleString('es-AR')} aplicado
                  </span>
                )}
              </div>
              <span className="font-mono text-xl font-bold text-cirqa-negro">
                $ {total.toLocaleString('es-AR')}
              </span>
            </div>

            {/* BOTÓN MERCADO PAGO */}
            {paymentMethod === 'mercadopago' && (
              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting || activeItems.length === 0}
                className="w-full py-4 px-6 rounded-2xl bg-[#009EE3] hover:bg-[#0086C3] text-white font-semibold text-sm tracking-wide shadow-lg shadow-[#009EE3]/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Conectando con Mercado Pago...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 text-white/90" />
                    <span>Pagar con Mercado Pago</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono">
                      $ {total.toLocaleString('es-AR')}
                    </span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            )}

            {/* BOTÓN TRANSFERENCIA BANCARIA */}
            {paymentMethod === 'transfer' && (
              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting || activeItems.length === 0}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm tracking-wide shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Registrando orden...</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5 text-white/90" />
                    <span>Confirmar con 15% OFF y Enviar por WhatsApp</span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            )}

            <div className="flex items-center justify-center gap-3 pt-1 text-[10px] text-cirqa-negro/50">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" />
                Pago Seguro SSL
              </span>
              <span>•</span>
              <span>Atención Directa</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-cirqa-primario" />
                Garantía Oficial CIRQA
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
