import React, { useState, useEffect, useRef } from 'react';
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
  Trash2,
  Plus,
  Minus,
  Sparkles,
  MapPin,
  Copy,
  Check,
  MessageCircle,
  Truck,
  Percent,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import {
  orderService,
  shippingService,
  couponService,
  abandonedCartService,
  formatMediaUrl,
} from '../services/api';
import { BANK_DETAILS } from '../data/bankDetails';
import { isCyberMondayActive } from '../utils/cyberMonday';
import { trackPurchase } from '../utils/metaPixel';

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

const OFFICIAL_WHATSAPP = '5491125073598';

// Detección precisa de Ciudad Autónoma de Buenos Aires (CABA) para Envío Gratis Express
const isCABA = (cp, province) => {
  const cleanZip = String(cp || '').trim().replace(/\D/g, '');
  if (cleanZip.length >= 4) {
    const postal = parseInt(cleanZip.slice(0, 4), 10);
    return !isNaN(postal) && postal >= 1000 && postal <= 1499;
  }
  const provLower = (province || '').toLowerCase();
  return (
    provLower.includes('caba') ||
    provLower.includes('autónoma') ||
    provLower.includes('capital')
  );
};

// Mapeo inteligente de Código Postal (CP / CPA) argentino a Provincia y Localidad
function detectProvinceFromZip(zipCode) {
  const cleanZip = String(zipCode || '').trim().replace(/\D/g, '');
  if (cleanZip.length < 4) return null;
  const num = parseInt(cleanZip.slice(0, 4), 10);
  if (isNaN(num)) return null;

  if (num >= 1000 && num <= 1499) {
    return { province: 'Ciudad Autónoma de Buenos Aires', city: 'CABA' };
  }
        if (
          (num >= 1500 && num <= 1999) ||
          (num >= 2700 && num <= 2999) ||
          (num >= 6000 && num <= 6299) ||
          (num >= 6400 && num <= 7999)
        ) {
          return { province: 'Buenos Aires', city: '' };
        }
        if ((num >= 2000 && num <= 2699) || (num >= 3000 && num <= 3099)) {
          return {
            province: 'Santa Fe',
            city: num === 2000 ? 'Rosario' : num === 3000 ? 'Santa Fe' : '',
          };
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
        if (num >= 3600 && num <= 3699) {
          return { province: 'Formosa', city: num === 3600 ? 'Formosa' : '' };
        }
        if (num >= 3500 && num <= 3799) {
          return { province: 'Chaco', city: num === 3500 ? 'Resistencia' : '' };
        }
        if (num >= 4000 && num <= 4199) {
          return { province: 'Tucumán', city: num === 4000 ? 'San Miguel de Tucumán' : '' };
        }
        if (num >= 4200 && num <= 4399) {
          return { province: 'Santiago del Estero', city: num === 4200 ? 'Santiago del Estero' : '' };
        }
        if (num >= 4400 && num <= 4599) {
          return { province: 'Salta', city: num === 4400 ? 'Salta Capital' : '' };
        }
        if (num >= 4600 && num <= 4699) {
          return { province: 'Jujuy', city: num === 4600 ? 'San Salvador de Jujuy' : '' };
        }
        if (num >= 4700 && num <= 4799) {
          return {
            province: 'Catamarca',
            city: num === 4700 ? 'San Fernando del Valle de Catamarca' : '',
          };
        }
        // Cuyo y La Rioja ANTES del rango general 5000-5999 de Córdoba
        if (num >= 5300 && num <= 5399) {
          return { province: 'La Rioja', city: num === 5300 ? 'La Rioja' : '' };
        }
        if (num >= 5400 && num <= 5499) {
          return { province: 'San Juan', city: num === 5400 ? 'San Juan' : '' };
        }
        if (num >= 5500 && num <= 5699) {
          return { province: 'Mendoza', city: num === 5500 ? 'Mendoza' : '' };
        }
        if (num >= 5700 && num <= 5899) {
          return { province: 'San Luis', city: num === 5700 ? 'San Luis' : '' };
        }
        if (num >= 5000 && num <= 5999) {
          return { province: 'Córdoba', city: num === 5000 ? 'Córdoba Capital' : '' };
        }
        if (num >= 6300 && num <= 6399) {
          return { province: 'La Pampa', city: num === 6300 ? 'Santa Rosa' : '' };
        }
        if ((num >= 8100 && num <= 8299) || (num >= 8400 && num <= 8599)) {
          return {
            province: 'Río Negro',
            city: num === 8400 ? 'Bariloche' : num === 8500 ? 'Viedma' : '',
          };
        }
        if (num >= 8300 && num <= 8399) {
          return { province: 'Neuquén', city: num === 8300 ? 'Neuquén' : '' };
        }
        if (num >= 9000 && num <= 9299) {
          return { province: 'Chubut', city: '' };
        }
        if (num >= 9300 && num <= 9409) {
          return { province: 'Santa Cruz', city: num === 9400 ? 'Río Gallegos' : '' };
        }
        if (num >= 9410 && num <= 9499) {
          return {
            province: 'Tierra del Fuego',
            city: num === 9410 ? 'Ushuaia' : num === 9420 ? 'Río Grande' : '',
          };
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
        const getInputClasses = (hasError) =>
          `w-full min-h-[46px] py-3 px-3.5 md:py-2.5 rounded-xl border text-base md:text-sm text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none transition-all ${hasError
            ? 'border-cirqa-carmin ring-1 ring-cirqa-carmin/30'
            : 'border-cirqa-negro/15 focus:border-cirqa-primario'
          }`;
        const getInputClasses = (hasError) =>
          `w-full min-h-[46px] py-3 px-3.5 md:py-2.5 rounded-xl border text-base md:text-sm text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none transition-all ${hasError
            ? 'border-cirqa-carmin ring-1 ring-cirqa-carmin/30'
            : 'border-cirqa-negro/15 focus:border-cirqa-primario'
          }`;
        const getInputClasses = (hasError) =>
          `w-full min-h-[46px] py-3 px-3.5 md:py-2.5 rounded-xl border text-base md:text-sm text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none transition-all ${hasError
            ? 'border-cirqa-carmin ring-1 ring-cirqa-carmin/30'
            : 'border-cirqa-negro/15 focus:border-cirqa-primario'
          }`;

        // Si hay compra directa desde configurador, se usa ese item; si no, todos los items del carrito
        const activeItems = checkoutTargetItem ? [checkoutTargetItem] : items;
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

              // Selector de Medio de Pago: 'mercadopago' | 'transfer'
              const [paymentMethod, setPaymentMethod] = useState('mercadopago');
              // Si hay compra directa desde configurador, se usa ese item; si no, todos los items del carrito
              const activeItems = checkoutTargetItem ? [checkoutTargetItem] : items;
              // Si hay compra directa desde configurador, se usa ese item; si no, todos los items del carrito
              const activeItems = checkoutTargetItem ? [checkoutTargetItem] : items;
              // Si hay compra directa desde configurador, se usa ese item; si no, todos los items del carrito
              const activeItems = checkoutTargetItem ? [checkoutTargetItem] : items;

              // Estado de cotización de envío con Zipnova Logistics
              const [shippingOptions, setShippingOptions] = useState([]);
              const [selectedShippingOption, setSelectedShippingOption] = useState(null);
              const [isQuotingShipping, setIsQuotingShipping] = useState(false);
              const [shippingError, setShippingError] = useState(null);
              // Selector de Medio de Pago: 'mercadopago' | 'transfer'
              const [paymentMethod, setPaymentMethod] = useState('mercadopago');
              // Selector de Medio de Pago: 'mercadopago' | 'transfer'
              const [paymentMethod, setPaymentMethod] = useState('mercadopago');
              // Selector de Medio de Pago: 'mercadopago' | 'transfer'
              const [paymentMethod, setPaymentMethod] = useState('mercadopago');

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
              // Estado de cotización de envío con Zipnova Logistics
              const [shippingOptions, setShippingOptions] = useState([]);
              const [selectedShippingOption, setSelectedShippingOption] = useState(null);
              const [isQuotingShipping, setIsQuotingShipping] = useState(false);
              const [shippingError, setShippingError] = useState(null);
              // Estado de cotización de envío con Zipnova Logistics
              const [shippingOptions, setShippingOptions] = useState([]);
              const [selectedShippingOption, setSelectedShippingOption] = useState(null);
              const [isQuotingShipping, setIsQuotingShipping] = useState(false);
              const [shippingError, setShippingError] = useState(null);
              // Estado de cotización de envío con Zipnova Logistics
              const [shippingOptions, setShippingOptions] = useState([]);
              const [selectedShippingOption, setSelectedShippingOption] = useState(null);
              const [isQuotingShipping, setIsQuotingShipping] = useState(false);
              const [shippingError, setShippingError] = useState(null);

              const [errors, setErrors] = useState({});
              const [isSubmitting, setIsSubmitting] = useState(false);
              const [submissionError, setSubmissionError] = useState(null);
              const scrollContainerRef = useRef(null);
              const formRef = useRef(null);
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

              // Bloquear scroll del body cuando el Drawer está abierto en mobile/desktop
              useEffect(() => {
                if (!isCheckoutOpen) return;
                setSubmissionError(null);
                const originalOverflow = document.body.style.overflow;
                document.body.style.overflow = 'hidden';
                return () => {
                  document.body.style.overflow = originalOverflow;
                };
              }, [isCheckoutOpen]);
              const [errors, setErrors] = useState({});
              const [isSubmitting, setIsSubmitting] = useState(false);
              const [submissionError, setSubmissionError] = useState(null);
              const scrollContainerRef = useRef(null);
              const formRef = useRef(null);
              const [errors, setErrors] = useState({});
              const [isSubmitting, setIsSubmitting] = useState(false);
              const [submissionError, setSubmissionError] = useState(null);
              const scrollContainerRef = useRef(null);
              const formRef = useRef(null);
              const [errors, setErrors] = useState({});
              const [isSubmitting, setIsSubmitting] = useState(false);
              const [submissionError, setSubmissionError] = useState(null);
              const scrollContainerRef = useRef(null);
              const formRef = useRef(null);

              // Estado de confirmación de transferencia
              const [transferSuccessOrder, setTransferSuccessOrder] = useState(null);
              const [copiedField, setCopiedField] = useState(null);
              // Bloquear scroll del body cuando el Drawer está abierto en mobile/desktop
              useEffect(() => {
                if (!isCheckoutOpen) return;
                setSubmissionError(null);
                const originalOverflow = document.body.style.overflow;
                document.body.style.overflow = 'hidden';
                return () => {
                  document.body.style.overflow = originalOverflow;
                };
              }, [isCheckoutOpen]);
              // Bloquear scroll del body cuando el Drawer está abierto en mobile/desktop
              useEffect(() => {
                if (!isCheckoutOpen) return;
                setSubmissionError(null);
                const originalOverflow = document.body.style.overflow;
                document.body.style.overflow = 'hidden';
                return () => {
                  document.body.style.overflow = originalOverflow;
                };
              }, [isCheckoutOpen]);
              // Bloquear scroll del body cuando el Drawer está abierto en mobile/desktop
              useEffect(() => {
                if (!isCheckoutOpen) return;
                setSubmissionError(null);
                const originalOverflow = document.body.style.overflow;
                document.body.style.overflow = 'hidden';
                return () => {
                  document.body.style.overflow = originalOverflow;
                };
              }, [isCheckoutOpen]);

              // Estado de Cupones de Descuento
              const [couponInput, setCouponInput] = useState('');
              const [appliedCoupon, setAppliedCoupon] = useState(null);
              const [couponError, setCouponError] = useState(null);
              const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
              const [copiedField, setCopiedField] = useState(null);
              const [copiedField, setCopiedField] = useState(null);
              const [copiedField, setCopiedField] = useState(null);

              // Detección en tiempo real de CABA
              const isCustomerCABA = isCABA(formData.zipCode, formData.province);
              // Estado de Cupones de Descuento
              const [couponInput, setCouponInput] = useState('');
              const [appliedCoupon, setAppliedCoupon] = useState(null);
              const [couponError, setCouponError] = useState(null);
              const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
              // Estado de Cupones de Descuento (acordeón colapsable por defecto para ahorrar espacio)
              const [isCouponOpen, setIsCouponOpen] = useState(false);
              const [couponInput, setCouponInput] = useState('');
              const [appliedCoupon, setAppliedCoupon] = useState(null);
              const [couponError, setCouponError] = useState(null);
              const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
              // Estado de Cupones de Descuento (acordeón colapsable por defecto para ahorrar espacio)
              const [isCouponOpen, setIsCouponOpen] = useState(false);
              const [couponInput, setCouponInput] = useState('');
              const [appliedCoupon, setAppliedCoupon] = useState(null);
              const [couponError, setCouponError] = useState(null);
              const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

              // 1. Subtotal de productos a precio regular
              const subtotal = activeItems.reduce(
                (acc, it) => acc + (Number(it.price) || 0) * (it.quantity || 1),
                0
              );
              // 1. Subtotal de productos a precio regular
              const subtotal = activeItems.reduce(
                (acc, it) => acc + (Number(it.price) || 0) * (it.quantity || 1),
                0
              );
              // 1. Subtotal de productos a precio regular
              const subtotal = activeItems.reduce(
                (acc, it) => acc + (Number(it.price) || 0) * (it.quantity || 1),
                0
              );
              // 1. Subtotal de productos a precio regular
              const subtotal = activeItems.reduce(
                (acc, it) => acc + (Number(it.price) || 0) * (it.quantity || 1),
                0
              );

              // 2. Costo de Envío: 100% bonificado para el cliente a todo el país ($0 reales)
              const shippingCost = 0;
              // 2. Costo de Envío: 100% bonificado para el cliente a todo el país ($0 reales)
              const shippingCost = 0;
              // 2. Costo de Envío: 100% bonificado para el cliente a todo el país ($0 reales)
              const shippingCost = 0;
              // 2. Costo de Envío: 100% bonificado para el cliente a todo el país ($0 reales)
              const shippingCost = 0;

              // 3. Descuento por Cupón
              const couponDiscount = appliedCoupon ? Math.min(subtotal, Number(appliedCoupon.discountAmount) || 0) : 0;
              const subtotalAfterCoupon = Math.max(0, subtotal - couponDiscount);
              // 3. Descuento por Cupón
              const couponDiscount = appliedCoupon
                ? Math.min(subtotal, Number(appliedCoupon.discountAmount) || 0)
                : 0;
              const subtotalAfterCoupon = Math.max(0, subtotal - couponDiscount);
              // 3. Descuento por Cupón
              const couponDiscount = appliedCoupon
                ? Math.min(subtotal, Number(appliedCoupon.discountAmount) || 0)
                : 0;
              const subtotalAfterCoupon = Math.max(0, subtotal - couponDiscount);
              // 3. Descuento por Cupón
              const couponDiscount = appliedCoupon
                ? Math.min(subtotal, Number(appliedCoupon.discountAmount) || 0)
                : 0;
              const subtotalAfterCoupon = Math.max(0, subtotal - couponDiscount);

              // 4. Descuento Cyber Monday (20% OFF global automático)
              const isCyber = isCyberMondayActive();
              const cyberDiscount = isCyber ? Math.round(subtotalAfterCoupon * 0.20) : 0;
              const subtotalAfterCyber = Math.max(0, subtotalAfterCoupon - cyberDiscount);
              // 4. Descuento Cyber Monday (20% OFF global automático)
              const isCyber = isCyberMondayActive();
              const cyberDiscount = isCyber ? Math.round(subtotalAfterCoupon * 0.2) : 0;
              const subtotalAfterCyber = Math.max(0, subtotalAfterCoupon - cyberDiscount);
              // 4. Descuento Cyber Monday (20% OFF global automático)
              const isCyber = isCyberMondayActive();
              const cyberDiscount = isCyber ? Math.round(subtotalAfterCoupon * 0.2) : 0;
              const subtotalAfterCyber = Math.max(0, subtotalAfterCoupon - cyberDiscount);
              // 4. Descuento Cyber Monday (20% OFF global automático)
              const isCyber = isCyberMondayActive();
              const cyberDiscount = isCyber ? Math.round(subtotalAfterCoupon * 0.2) : 0;
              const subtotalAfterCyber = Math.max(0, subtotalAfterCoupon - cyberDiscount);

              // 5. Descuento Transferencia Bancaria (15% OFF) y Acumulación
              let transferDiscount = 0;
              if (paymentMethod === 'transfer') {
                if (!appliedCoupon || appliedCoupon.combinableWithTransfer !== false) {
                  transferDiscount = Math.round(subtotalAfterCyber * 0.15);
                }
              }
              // 5. Descuento Transferencia Bancaria (15% OFF) y Acumulación
              let transferDiscount = 0;
              if (paymentMethod === 'transfer') {
                if (!appliedCoupon || appliedCoupon.combinableWithTransfer !== false) {
                  transferDiscount = Math.round(subtotalAfterCyber * 0.15);
                }
              }
              // 5. Descuento Transferencia Bancaria (15% OFF) y Acumulación
              let transferDiscount = 0;
              if (paymentMethod === 'transfer') {
                if (!appliedCoupon || appliedCoupon.combinableWithTransfer !== false) {
                  transferDiscount = Math.round(subtotalAfterCyber * 0.15);
                }
              }
              // 5. Descuento Transferencia Bancaria (15% OFF) y Acumulación
              let transferDiscount = 0;
              if (paymentMethod === 'transfer') {
                if (!appliedCoupon || appliedCoupon.combinableWithTransfer !== false) {
                  transferDiscount = Math.round(subtotalAfterCyber * 0.15);
                }
              }

              // 6. Descuento total combinado
              const totalDiscount = Math.min(subtotal, couponDiscount + cyberDiscount + transferDiscount);
              const discountAmount = totalDiscount;
              // 6. Descuento total combinado
              const totalDiscount = Math.min(subtotal, couponDiscount + cyberDiscount + transferDiscount);
              const discountAmount = totalDiscount;
              // 6. Descuento total combinado
              const totalDiscount = Math.min(subtotal, couponDiscount + cyberDiscount + transferDiscount);
              const discountAmount = totalDiscount;
              // 6. Descuento total combinado
              const totalDiscount = Math.min(subtotal, couponDiscount + cyberDiscount + transferDiscount);
              const discountAmount = totalDiscount;

              // 7. Total Final a pagar: (subtotal - totalDiscount) sin cargo de envío
              const total = Math.max(0, subtotal - totalDiscount);
              // 7. Total Final a pagar: (subtotal - totalDiscount) sin cargo de envío
              const total = Math.max(0, subtotal - totalDiscount);
              // 7. Total Final a pagar: (subtotal - totalDiscount) sin cargo de envío
              const total = Math.max(0, subtotal - totalDiscount);
              // 7. Total Final a pagar: (subtotal - totalDiscount) sin cargo de envío
              const total = Math.max(0, subtotal - totalDiscount);

              // Función para validar y aplicar cupón
              const handleApplyCoupon = async (e) => {
                if (e) e.preventDefault();
                if (!couponInput.trim()) return;
                // Función para validar y aplicar cupón
                const handleApplyCoupon = async (e) => {
                  if (e) e.preventDefault();
                  if (!couponInput.trim()) return;
                  // Función para validar y aplicar cupón
                  const handleApplyCoupon = async (e) => {
                    if (e) e.preventDefault();
                    if (!couponInput.trim()) return;
                    // Función para validar y aplicar cupón
                    const handleApplyCoupon = async (e) => {
                      if (e) e.preventDefault();
                      if (!couponInput.trim()) return;

                      setIsValidatingCoupon(true);
                      setCouponError(null);
                      setIsValidatingCoupon(true);
                      setCouponError(null);
                      setIsValidatingCoupon(true);
                      setCouponError(null);
                      setIsValidatingCoupon(true);
                      setCouponError(null);

                      try {
                        const res = await couponService.validate({
                          code: couponInput.trim(),
                          items: activeItems,
                          subtotal,
                          customerEmail: formData.email,
                        });
                        try {
                          const res = await couponService.validate({
                            code: couponInput.trim(),
                            items: activeItems,
                            subtotal,
                            customerEmail: formData.email,
                          });
                          try {
                            const res = await couponService.validate({
                              code: couponInput.trim(),
                              items: activeItems,
                              subtotal,
                              customerEmail: formData.email,
                            });
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
                        setIsCouponOpen(false);
                      } else {
                        setCouponError(res.message || 'Código de descuento no válido.');
                      }
                    } catch (err) {
                      setCouponError(err.response?.data?.message || err.message || 'No se pudo aplicar el cupón.');
                    } finally {
                      setIsValidatingCoupon(false);
                    }
                  };
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
                    setIsCouponOpen(false);
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
              const handleRemoveCoupon = () => {
                setAppliedCoupon(null);
                setCouponError(null);
              };
              const handleRemoveCoupon = () => {
                setAppliedCoupon(null);
                setCouponError(null);
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
                  }).catch(() => { });
                }
              }, [subtotal, activeItems.length]);
              // Re-validar cupón si cambia subtotal o items
              useEffect(() => {
                if (appliedCoupon) {
                  couponService
                    .validate({
                      code: appliedCoupon.code,
                      items: activeItems,
                      subtotal,
                      customerEmail: formData.email,
                    })
                    .then((res) => {
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
                    })
                    .catch(() => { });
                }
              }, [subtotal, activeItems.length]);
              // Re-validar cupón si cambia subtotal o items
              useEffect(() => {
                if (appliedCoupon) {
                  couponService
                    .validate({
                      code: appliedCoupon.code,
                      items: activeItems,
                      subtotal,
                      customerEmail: formData.email,
                    })
                    .then((res) => {
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
                    })
                    .catch(() => { });
                }
              }, [subtotal, activeItems.length]);
              // Re-validar cupón si cambia subtotal o items
              useEffect(() => {
                if (appliedCoupon) {
                  couponService
                    .validate({
                      code: appliedCoupon.code,
                      items: activeItems,
                      subtotal,
                      customerEmail: formData.email,
                    })
                    .then((res) => {
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
                    })
                    .catch(() => { });
                }
              }, [subtotal, activeItems.length]);

              // Cotización automática y reactiva con detección inmediata de CABA y Envíos Nacionales
              useEffect(() => {
                const cleanZip = String(formData.zipCode || '').trim().replace(/\D/g, '');
                const postalCode = parseInt(cleanZip, 10);
                const isPostalCABA = !isNaN(postalCode) && postalCode >= 1000 && postalCode <= 1499;
                const isDestCABA = isPostalCABA || isCABA(cleanZip, formData.province);
                // Cotización automática y reactiva con detección inmediata de CABA y Envíos Nacionales
                useEffect(() => {
                  const cleanZip = String(formData.zipCode || '').trim().replace(/\D/g, '');
                  const postalCode = parseInt(cleanZip, 10);
                  const isPostalCABA = !isNaN(postalCode) && postalCode >= 1000 && postalCode <= 1499;
                  const isDestCABA = isPostalCABA || isCABA(cleanZip, formData.province);
                  // Cotización automática y reactiva con detección inmediata de CABA y Envíos Nacionales
                  useEffect(() => {
                    const cleanZip = String(formData.zipCode || '').trim().replace(/\D/g, '');
                    const postalCode = parseInt(cleanZip, 10);
                    const isPostalCABA = !isNaN(postalCode) && postalCode >= 1000 && postalCode <= 1499;
                    const isDestCABA = isPostalCABA || isCABA(cleanZip, formData.province);
                    // Cotización automática y reactiva con detección inmediata de CABA y Envíos Nacionales
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
                      if (activeItems.length === 0) {
                        setShippingOptions([]);
                        setSelectedShippingOption(null);
                        return;
                      }
                      if (activeItems.length === 0) {
                        setShippingOptions([]);
                        setSelectedShippingOption(null);
                        return;
                      }
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
                          // 1. Detección Inmediata de CABA: Motomensajería Express (24 hs)
                          if(isDestCABA) {
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
    // 1. Detección Inmediata de CABA: Motomensajería Express (24 hs)
    if(isDestCABA) {
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
    if(isDestCABA) {
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

    // 2. Resto de Buenos Aires y el Interior del País: Envíos Nacionales
    if(cleanZip.length >= 4) {
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

                                      const mappedOptions = (
                                        rawOptions.length > 0
                                          ? rawOptions
                                          : [
                                            {
                                              id: 'free_home_standard',
                                              name: 'Envío Gratis a Domicilio (Todo el País)',
                                              description: 'Entrega puerta a puerta certificada en tu domicilio · Sin cargo',
                                              carrier: 'Correo Certificado',
                                              cost: 0,
                                              price: 0,
                                              cost: 0,
                                              description: 'Entrega express en 24 hs en tu domicilio',
                                              estimatedDays: '24 hs hábiles',
                                              isFree: true,
                                              freeShipping: true,
                                              estimatedDays: '3 a 5 días hábiles',
                                              type: 'home',
                                              isFree: true,
                                            };
                                      setShippingOptions([cabaOption]);
                                      setSelectedShippingOption(cabaOption);
                                      setIsQuotingShipping(false);
                                      setShippingError(null);
                                      return;
                                    }
                  },
                ]
          ).map((opt) => {
                                      const isPickup =
                                        opt.type === 'pickup' ||
                                        (opt.name || '').toLowerCase().includes('punto') ||
                                        (opt.name || '').toLowerCase().includes('sucursal');
                                      return {
                                        ...opt,
                                        cost: 0,
                                        price: 0,
                                        isFree: true,
                                        freeShipping: true,
                                        name: isPickup
                                          ? 'Retiro en Sucursal · Envío Gratis (Todo el País)'
                                          : 'Envío Gratis a Domicilio (Todo el País)',
                                        carrier: opt.carrier || 'Correo Certificado',
                                        description: opt.description
                                          ? opt.description
                                          : isPickup
                                            ? `Sucursal cercana a CP ${cleanZip} · Sin cargo`
                                            : 'Entrega puerta a puerta certificada bonificada',
                                      };
                                    });

                  // 2. Resto de Buenos Aires y el Interior del País: Envíos Nacionales
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
                        setShippingOptions(mappedOptions);
                        if (mappedOptions.length > 0) {
                          setSelectedShippingOption((prev) => {
                            if (prev) {
                              const match = mappedOptions.find(
                                (o) => o.id === prev.id || o.type === prev.type
                              );
                              if (match) return match;
                            }
                            return mappedOptions[0];
                          });
                        }
                      } catch (err) {
                        if (isCancelled) return;
                        console.warn('[Shipping Quote Error]:', err);
                        const fallbackOptions = [
                          {
                            id: 'free_home_fb',
                            name: 'Envío Gratis a Domicilio (Todo el País)',
                            description: 'Entrega puerta a puerta certificada en tu domicilio · Sin cargo',
                            carrier: 'Correo Certificado',
                            cost: 0,
                            price: 0,
                            isFree: true,
                            freeShipping: true,
                            estimatedDays: '3 a 5 días hábiles',
                            type: 'home',
                          },
                          {
                            id: 'free_pickup_fb',
                            name: 'Retiro en Sucursal · Envío Gratis (Todo el País)',
                            description: `Sucursal cercana a CP ${cleanZip} · Sin cargo`,
                            carrier: 'Correo Certificado',
                            cost: 0,
                            price: 0,
                            isFree: true,
                            freeShipping: true,
                            estimatedDays: '2 a 4 días hábiles',
                            type: 'pickup',
                          },
                        ];
                        setShippingOptions(fallbackOptions);
                        setSelectedShippingOption((prev) =>
                          prev ? fallbackOptions.find((o) => o.type === prev.type) || fallbackOptions[0] : fallbackOptions[0]
                        );
                      } finally {
                        if (!isCancelled) setIsQuotingShipping(false);
                      }
                    }, 400);

                    // Estandarizar bajo nombres comerciales:
                    // "Envío Gratis a Domicilio (Todo el País)"
                    // "Retiro en Sucursal · Envío Gratis (Todo el País)"
                    const mappedOptions = (rawOptions.length > 0 ? rawOptions : [
          const mappedOptions = (
                      rawOptions.length > 0
                        ? rawOptions
                        : [
                          {
                            id: 'free_home_standard',
                            name: 'Envío Gratis a Domicilio (Todo el País)',
                            description: 'Entrega puerta a puerta certificada en tu domicilio · Sin cargo',
                            carrier: 'Correo Certificado',
                            cost: 0,
                            price: 0,
                            isFree: true,
                            freeShipping: true,
                            estimatedDays: '3 a 5 días hábiles',
                            type: 'home',
                          }
                        ]).map((opt) => {
                          const isPickup = opt.type === 'pickup' || (opt.name || '').toLowerCase().includes('punto') || (opt.name || '').toLowerCase().includes('sucursal');
                          return {
                            ...opt,
                            cost: 0,
                            price: 0,
                            isFree: true,
                            freeShipping: true,
                            name: isPickup
                              ? 'Retiro en Sucursal · Envío Gratis (Todo el País)'
                              : 'Envío Gratis a Domicilio (Todo el País)',
                            carrier: opt.carrier || 'Correo Certificado',
                            description: opt.description
                              ? opt.description
                              : (isPickup ? `Sucursal cercana a CP ${cleanZip} · Sin cargo` : 'Entrega puerta a puerta certificada bonificada'),
                          };
                        });
                    return () => {
                      isCancelled = true;
                      clearTimeout(timer);
                    };
                  } else {
                    setShippingOptions([]);
                    setSelectedShippingOption(null);
                  },
                ]
          ).map((opt) => {
                    const isPickup =
                      opt.type === 'pickup' ||
                      (opt.name || '').toLowerCase().includes('punto') ||
                      (opt.name || '').toLowerCase().includes('sucursal');
                    return {
                      ...opt,
                      cost: 0,
                      price: 0,
                      isFree: true,
                      freeShipping: true,
                      name: isPickup
                        ? 'Retiro en Sucursal · Envío Gratis (Todo el País)'
                        : 'Envío Gratis a Domicilio (Todo el País)',
                      carrier: opt.carrier || 'Correo Certificado',
                      description: opt.description
                        ? opt.description
                        : isPickup
                          ? `Sucursal cercana a CP ${cleanZip} · Sin cargo`
                          : 'Entrega puerta a puerta certificada bonificada',
                    };
                  });

                setShippingOptions(mappedOptions);
                if (mappedOptions.length > 0) {
                  setSelectedShippingOption((prev) => {
                    if (prev) {
                      const match = mappedOptions.find(
                        (o) => o.id === prev.id || o.type === prev.type
                      );
                      if (match) return match;
                    }
                  }, [formData.zipCode, formData.province, activeItems.length]);

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
                  // Fallback seguro de Envío Gratis a Todo el País
                  const fallbackOptions = [
                    rawOptions.length > 0
                      ? rawOptions
                      : [
                        {
                          id: 'free_home_fb',
                          id: 'free_home_standard',
                          name: 'Envío Gratis a Domicilio (Todo el País)',
                          description: 'Entrega puerta a puerta certificada en tu domicilio · Sin cargo',
                          carrier: 'Correo Certificado',
                          cost: 0,
                          price: 0,
                          isFree: true,
                          freeShipping: true,
                          estimatedDays: '3 a 5 días hábiles',
                          type: 'home',
                        },
                        {
                          id: 'free_pickup_fb',
                          name: 'Retiro en Sucursal · Envío Gratis (Todo el País)',
                          description: `Sucursal cercana a CP ${cleanZip} · Sin cargo`,
                          carrier: 'Correo Certificado',
                          cost: 0,
                          price: 0,
                          isFree: true,
                          freeShipping: true,
                          estimatedDays: '2 a 4 días hábiles',
                          type: 'pickup',
                        },
                      ];
                  setShippingOptions(fallbackOptions);
                  setSelectedShippingOption((prev) => prev ? fallbackOptions.find(o => o.type === prev.type) || fallbackOptions[0] : fallbackOptions[0]);
                } finally {
                  if (!isCancelled) setIsQuotingShipping(false);
                  return mappedOptions[0];
                });
            }
          }, 400);
          // Autocompletado reactivo de CP y provincia
          const handleZipCodeChange = (e) => {
            const rawVal = e.target.value;
            setFormData((prev) => {
              const next = { ...prev, zipCode: rawVal };
              const detected = detectProvinceFromZip(rawVal);
              if (detected) {
                if (detected.province) next.province = detected.province;
                if (detected.city && (!prev.city || prev.city === 'CABA')) next.city = detected.city;
                ]
          ).map((opt) => {
                  const isPickup =
                    opt.type === 'pickup' ||
                    (opt.name || '').toLowerCase().includes('punto') ||
                    (opt.name || '').toLowerCase().includes('sucursal');
                  return {
                    ...opt,
                    cost: 0,
                    price: 0,
                    isFree: true,
                    freeShipping: true,
                    name: isPickup
                      ? 'Retiro en Sucursal · Envío Gratis (Todo el País)'
                      : 'Envío Gratis a Domicilio (Todo el País)',
                    carrier: opt.carrier || 'Correo Certificado',
                    description: opt.description
                      ? opt.description
                      : isPickup
                        ? `Sucursal cercana a CP ${cleanZip} · Sin cargo`
                        : 'Entrega puerta a puerta certificada bonificada',
                  };
                });

          setShippingOptions(mappedOptions);
          if (mappedOptions.length > 0) {
            setSelectedShippingOption((prev) => {
              if (prev) {
                const match = mappedOptions.find(
                  (o) => o.id === prev.id || o.type === prev.type
                );
                if (match) return match;
              }
              return next;
              return mappedOptions[0];
            });
          } catch (err) {
            if (isCancelled) return;
            console.warn('[Shipping Quote Error]:', err);
            const fallbackOptions = [
              {
                id: 'free_home_fb',
                name: 'Envío Gratis a Domicilio (Todo el País)',
                description: 'Entrega puerta a puerta certificada en tu domicilio · Sin cargo',
                carrier: 'Correo Certificado',
                cost: 0,
                price: 0,
                isFree: true,
                freeShipping: true,
                estimatedDays: '3 a 5 días hábiles',
                type: 'home',
              },
              {
                id: 'free_pickup_fb',
                name: 'Retiro en Sucursal · Envío Gratis (Todo el País)',
                description: `Sucursal cercana a CP ${cleanZip} · Sin cargo`,
                carrier: 'Correo Certificado',
                cost: 0,
                price: 0,
                isFree: true,
                freeShipping: true,
                estimatedDays: '2 a 4 días hábiles',
                type: 'pickup',
              },
            ];
            setShippingOptions(fallbackOptions);
            setSelectedShippingOption((prev) =>
              prev
                ? fallbackOptions.find((o) => o.type === prev.type) || fallbackOptions[0]
                : fallbackOptions[0]
            );
          } finally {
            if (!isCancelled) setIsQuotingShipping(false);
          }
        }, 400);
      } catch (err) {
        if (isCancelled) return;
        console.warn('[Shipping Quote Error]:', err);
        const fallbackOptions = [
          {
            id: 'free_home_fb',
            name: 'Envío Gratis a Domicilio (Todo el País)',
            description: 'Entrega puerta a puerta certificada en tu domicilio · Sin cargo',
            carrier: 'Correo Certificado',
            cost: 0,
            price: 0,
            isFree: true,
            freeShipping: true,
            estimatedDays: '3 a 5 días hábiles',
            type: 'home',
          },
          {
            id: 'free_pickup_fb',
            name: 'Retiro en Sucursal · Envío Gratis (Todo el País)',
            description: `Sucursal cercana a CP ${cleanZip} · Sin cargo`,
            carrier: 'Correo Certificado',
            cost: 0,
            price: 0,
            isFree: true,
            freeShipping: true,
            estimatedDays: '2 a 4 días hábiles',
            type: 'pickup',
          },
        ];
        setShippingOptions(fallbackOptions);
        setSelectedShippingOption((prev) =>
          prev
            ? fallbackOptions.find((o) => o.type === prev.type) || fallbackOptions[0]
            : fallbackOptions[0]
        );
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
if (errors.zipCode) {
  setErrors((prev) => ({ ...prev, zipCode: null }));
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
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

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

const copyToClipboard = async (text, fieldName) => {
  const cleanText = String(text || '').trim();
  if (!cleanText) return;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(cleanText);
    } else {
      throw new Error('Clipboard API unavailable');
    }
  } catch {
    try {
      const tempInput = document.createElement('textarea');
      tempInput.value = cleanText;
      tempInput.style.position = 'fixed';
      tempInput.style.opacity = '0';
      document.body.appendChild(tempInput);
      tempInput.focus();
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
    } catch { }
  } catch { }
}
setCopiedField(fieldName);
setTimeout(() => {
  setCopiedField(null);
}, 2000);
  };

const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData((prev) => ({ ...prev, [name]: value }));
  if (errors[name]) {
    setErrors((prev) => ({ ...prev, [name]: null }));
  }
};
const scrollToFirstError = (errorObj) => {
  const fieldOrder = ['name', 'email', 'phone', 'dni', 'zipCode', 'city', 'street', 'number'];
  const firstKey = fieldOrder.find((k) => Boolean(errorObj[k]));
  if (!firstKey || !formRef.current) return;
  const targetEl = formRef.current.querySelector(`[name="${firstKey}"]`);
  if (targetEl && typeof targetEl.scrollIntoView === 'function') {
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    try {
      targetEl.focus({ preventScroll: true });
    } catch { }
  } catch { }
}
  };

const copyToClipboard = (text, fieldName) => {
  navigator.clipboard.writeText(text);
  const copyToClipboard = async (text, fieldName) => {
    const cleanText = String(text || '').trim();
    if (!cleanText) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(cleanText);
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch {
      try {
        const tempInput = document.createElement('textarea');
        tempInput.value = cleanText;
        tempInput.style.position = 'fixed';
        tempInput.style.opacity = '0';
        document.body.appendChild(tempInput);
        tempInput.focus();
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      } catch { }
    } catch { }
  }
  setCopiedField(fieldName);
  setTimeout(() => {
    setCopiedField(null);
  }, 2000);
};

const scrollToFirstError = (errorObj) => {
  const fieldOrder = ['name', 'email', 'phone', 'dni', 'zipCode', 'city', 'street', 'number'];
  const firstKey = fieldOrder.find((k) => Boolean(errorObj[k]));
  if (!firstKey || !formRef.current) return;
  const targetEl = formRef.current.querySelector(`[name="${firstKey}"]`);
  if (targetEl && typeof targetEl.scrollIntoView === 'function') {
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    try {
      targetEl.focus({ preventScroll: true });
    } catch { }
  }
};

const validateForm = () => {
  const newErrors = {};
  const cleanEmail = formData.email.trim();
  const validateForm = () => {
    const newErrors = {};
    const cleanEmail = formData.email.trim();

    const scrollToFirstError = (errorObj) => {
      const fieldOrder = ['name', 'email', 'phone', 'dni', 'zipCode', 'city', 'street', 'number'];
      const firstKey = fieldOrder.find((k) => Boolean(errorObj[k]));
      if (!firstKey || !formRef.current) return;
      const targetEl = formRef.current.querySelector(`[name="${firstKey}"]`);
      if (targetEl && typeof targetEl.scrollIntoView === 'function') {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        try {
          targetEl.focus({ preventScroll: true });
        } catch { }
      }
    };
    if (!formData.name.trim()) {
      newErrors.name = 'Ingresá tu nombre y apellido';
    }
    if (!cleanEmail) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      newErrors.email = 'Ingresá un email válido';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Teléfono requerido para el seguimiento';
    }
    if (!formData.dni.trim()) {
      newErrors.dni = 'DNI / CUIL requerido';
    }
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'Código Postal';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'Localidad o ciudad';
    }
    if (!formData.street.trim()) {
      newErrors.street = 'Ingresá la calle o avenida';
    }
    if (!formData.number.trim()) {
      newErrors.number = 'Número';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Ingresá tu nombre y apellido';
    }
    if (!cleanEmail) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      newErrors.email = 'Ingresá un email válido';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Teléfono requerido para el seguimiento';
    }
    if (!formData.dni.trim()) {
      newErrors.dni = 'DNI / CUIL requerido';
    }
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'Código Postal';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'Localidad o ciudad';
    }
    if (!formData.street.trim()) {
      newErrors.street = 'Ingresá la calle o avenida';
    }
    if (!formData.number.trim()) {
      newErrors.number = 'Número';
    }

    const validateForm = () => {
      const newErrors = {};
      const cleanEmail = formData.email.trim();
      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) {
        scrollToFirstError(newErrors);
        return false;
      }
      return true;
    };
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      scrollToFirstError(newErrors);
      return false;
    }
    return true;
  };

  if (!formData.name.trim()) {
    newErrors.name = 'Ingresá tu nombre y apellido';
  }
  if (!formData.email.trim()) {
    if (!cleanEmail) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      newErrors.email = 'Ingresá un email válido';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Teléfono requerido para el seguimiento';
    }
    if (!formData.dni.trim()) {
      newErrors.dni = 'DNI / CUIL requerido';
    }
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'Código Postal';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'Localidad o ciudad';
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
    const buildOrderPayload = (selectedMethod) => {
      const isDestCABA = isCABA(formData.zipCode, formData.province);
      const shippingPrice = 0;
      const shippingMethodTitle =
        selectedShippingOption?.name ||
        (isDestCABA
          ? 'Envío Gratis CABA · Motomensajería Express (24 hs)'
          : 'Envío Bonificado a todo el país · Correo Certificado');
      const buildOrderPayload = (selectedMethod) => {
        const isDestCABA = isCABA(formData.zipCode, formData.province);
        const shippingPrice = 0;
        const shippingMethodTitle =
          selectedShippingOption?.name ||
          (isDestCABA
            ? 'Envío Gratis CABA · Motomensajería Express (24 hs)'
            : 'Envío Bonificado a todo el país · Correo Certificado');
        if (!cleanEmail) {
          newErrors.email = 'El email es obligatorio';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
          newErrors.email = 'Ingresá un email válido';
        }
        if (!formData.phone.trim()) {
          newErrors.phone = 'Teléfono requerido para el seguimiento';
        }
        if (!formData.dni.trim()) {
          newErrors.dni = 'DNI / CUIL requerido';
        }
        if (!formData.zipCode.trim()) {
          newErrors.zipCode = 'Código Postal';
        }
        if (!formData.city.trim()) {
          newErrors.city = 'Localidad o ciudad';
        }
        if (!formData.street.trim()) {
          newErrors.street = 'Ingresá la calle o avenida';
        }
        if (!formData.number.trim()) {
          newErrors.number = 'Número';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
        if (Object.keys(newErrors).length > 0) {
          scrollToFirstError(newErrors);
          return false;
        }
        return true;
      };
      const shippingPayload = {
        carrier:
          selectedShippingOption?.carrier ||
          (isDestCABA ? 'Motomensajería' : 'Correo Certificado'),
        service:
          selectedShippingOption?.service ||
          selectedShippingOption?.serviceType ||
          (isDestCABA ? 'express_caba_24h' : 'standard'),
        price: 0,
        cost: 0,
        originalCost: Number(
          selectedShippingOption?.originalCost ?? selectedShippingOption?.cost ?? 0
        ),
        status: 'PENDIENTE',
        deliveryStatus: 'pending',
        trackingNumber: '',
        zipnovaShipmentId: '',
        labelUrl: '',
      };
      const shippingPayload = {
        carrier:
          selectedShippingOption?.carrier ||
          (isDestCABA ? 'Motomensajería' : 'Correo Certificado'),
        service:
          selectedShippingOption?.service ||
          selectedShippingOption?.serviceType ||
          (isDestCABA ? 'express_caba_24h' : 'standard'),
        price: 0,
        cost: 0,
        originalCost: Number(
          selectedShippingOption?.originalCost ?? selectedShippingOption?.cost ?? 0
        ),
        status: 'PENDIENTE',
        deliveryStatus: 'pending',
        trackingNumber: '',
        zipnovaShipmentId: '',
        labelUrl: '',
      };
      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) {
        scrollToFirstError(newErrors);
        return false;
      }
      return true;
    };

    const buildOrderPayload = (selectedMethod) => {
      const isDestCABA = isCABA(formData.zipCode, formData.province);
      const shippingPrice = 0;
      const shippingMethodTitle = selectedShippingOption?.name || (isDestCABA
        ? 'Envío Gratis CABA · Motomensajería Express (24 hs)'
        : 'Envío Bonificado a todo el país · Correo Certificado');
      const subtotalAmount = subtotal;
      return {
        paymentMethod: selectedMethod === 'transfer' ? 'transfer' : 'mercadopago',
        couponCode: appliedCoupon?.code || null,
        couponDiscount,
        transferDiscount,
        cyberDiscount,
        subtotal,
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
          const cleanId =
            rawId && String(rawId).includes('_') ? String(rawId).split('_')[0] : rawId;
          const cleanCode =
            item.modelCode || (cleanId ? String(cleanId).split('_')[0] : 'Q-001');
          return {
            paymentMethod: selectedMethod === 'transfer' ? 'transfer' : 'mercadopago',
            couponCode: appliedCoupon?.code || null,
            couponDiscount,
            transferDiscount,
            cyberDiscount,
            subtotal,
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
              const cleanId =
                rawId && String(rawId).includes('_') ? String(rawId).split('_')[0] : rawId;
              const cleanCode =
                item.modelCode || (cleanId ? String(cleanId).split('_')[0] : 'Q-001');
              const buildOrderPayload = (selectedMethod) => {
                const isDestCABA = isCABA(formData.zipCode, formData.province);
                const shippingPrice = 0;
                const shippingMethodTitle =
                  selectedShippingOption?.name ||
                  (isDestCABA
                    ? 'Envío Gratis CABA · Motomensajería Express (24 hs)'
                    : 'Envío Bonificado a todo el país · Correo Certificado');

                const shippingPayload = {
                  carrier: selectedShippingOption?.carrier || (isDestCABA ? 'Motomensajería' : 'Correo Certificado'),
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
                  filter:
                    item.variantName ||
                    (typeof item.filter === 'object' ? item.filter.name : item.filter),
                  prescription:
                    item.prescription?.notes ||
                    (item.prescription ? 'Con receta médica adjunta' : null),
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
            filter:
              item.variantName ||
              (typeof item.filter === 'object' ? item.filter.name : item.filter),
            prescription:
              item.prescription?.notes ||
              (item.prescription ? 'Con receta médica adjunta' : null),
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
    const shippingPayload = {
      carrier:
        selectedShippingOption?.carrier ||
        (isDestCABA ? 'Motomensajería' : 'Correo Certificado'),
      service:
        selectedShippingOption?.service ||
        selectedShippingOption?.serviceType ||
        (isDestCABA ? 'express_caba_24h' : 'standard'),
      price: 0,
      cost: 0,
      originalCost: Number(
        selectedShippingOption?.originalCost ?? selectedShippingOption?.cost ?? 0
      ),
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
      cyberDiscount,
      subtotal,
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
        const cleanId =
          rawId && String(rawId).includes('_') ? String(rawId).split('_')[0] : rawId;
        const cleanCode =
          item.modelCode || (cleanId ? String(cleanId).split('_')[0] : 'Q-001');

        return {
          paymentMethod: selectedMethod === 'transfer' ? 'transfer' : 'mercadopago',
          couponCode: appliedCoupon?.code || null,
          couponDiscount,
          transferDiscount,
          cyberDiscount,
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
            // Submit unificado según método de pago seleccionado
            const handleSubmitCheckout = async (e) => {
              if (e && typeof e.preventDefault === 'function') {
                e.preventDefault();
              }
              if (isSubmitting) return;
              setSubmissionError(null);
              // Submit unificado según método de pago seleccionado
              const handleSubmitCheckout = async (e) => {
                if (e && typeof e.preventDefault === 'function') {
                  e.preventDefault();
                }
                if (isSubmitting) return;
                setSubmissionError(null);

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
          filter:
            item.variantName ||
            (typeof item.filter === 'object' ? item.filter.name : item.filter),
          prescription:
            item.prescription?.notes ||
            (item.prescription ? 'Con receta médica adjunta' : null),
          image: item.image || '/products/_DSC8649.webp',
        };
      };
      if(activeItems.length === 0) {
      setSubmissionError(
        'Tu carrito está vacío. Agregá al menos un armazón para continuar.'
      );
      return;
    }
    if (activeItems.length === 0) {
      setSubmissionError(
        'Tu carrito está vacío. Agregá al menos un armazón para continuar.'
      );
      return;
    }
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
  if (!validateForm()) {
    return;
  }
  if (!validateForm()) {
    return;
  }
  // Submit unificado según método de pago seleccionado
  const handleSubmitCheckout = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (isSubmitting) return;
    setSubmissionError(null);

    if (activeItems.length === 0) {
      setSubmissionError('Tu carrito está vacío. Agregá al menos un armazón para continuar.');
      return;
    }
    setIsSubmitting(true);
    setIsSubmitting(true);
    if (activeItems.length === 0) {
      setSubmissionError(
        'Tu carrito está vacío. Agregá al menos un armazón para continuar.'
      );
      return;
    }

    if (!validateForm()) {
      return;
    }
    try {
      const activeMethod = paymentMethod === 'transfer' ? 'transfer' : 'mercadopago';
      const payload = buildOrderPayload(activeMethod);
      const response = await orderService.createPreference(payload);
      try {
        const activeMethod = paymentMethod === 'transfer' ? 'transfer' : 'mercadopago';
        const payload = buildOrderPayload(activeMethod);
        const response = await orderService.createPreference(payload);
        if (!validateForm()) {
          return;
        }

        setIsSubmitting(true);
        // CASO A: TRANSFERENCIA BANCARIA (15% OFF)
        if (paymentMethod === 'transfer') {
          const orderNum =
            response?.orderNumber ||
            response?.data?.orderNumber ||
            `CQ-${Math.floor(100000 + Math.random() * 900000)}`;
          // CASO A: TRANSFERENCIA BANCARIA (15% OFF)
          if (paymentMethod === 'transfer') {
            const orderNum =
              response?.orderNumber ||
              response?.data?.orderNumber ||
              `CQ-${Math.floor(100000 + Math.random() * 900000)}`;
            setIsSubmitting(true);

            try {
              const activeMethod = paymentMethod === 'transfer' ? 'transfer' : 'mercadopago';
              const payload = buildOrderPayload(activeMethod);
              const response = await orderService.createPreference(payload);
              const createdOrderId = response?.orderId || response?.data?.orderId;
              const finalCalculatedTotal =
                response?.totalAmount || response?.data?.totalAmount || total;
              const createdOrderId = response?.orderId || response?.data?.orderId;
              const finalCalculatedTotal =
                response?.totalAmount || response?.data?.totalAmount || total;
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
                  // Disparar evento Purchase en Meta Pixel para orden confirmada por transferencia
                  trackPurchase({
                    value: Number(finalCalculatedTotal || 0),
                    currency: 'ARS',
                  });
                  // Disparar evento Purchase en Meta Pixel para orden confirmada por transferencia
                  trackPurchase({
                    value: Number(finalCalculatedTotal || 0),
                    currency: 'ARS',
                  });
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
                    // Construir mensaje preformateado para WhatsApp oficial de CIRQA
                    const waMessage = `Hola CIRQA! Acabo de realizar el pedido *#${orderNum}* por un total de *$${finalCalculatedTotal.toLocaleString('es-AR')}*. Adjunto el comprobante de transferencia.`;
                    const waUrl = `https://wa.me/${OFFICIAL_WHATSAPP}?text=${encodeURIComponent(waMessage)}`;
                    const createdOrderId = response?.orderId || response?.data?.orderId;
                    const finalCalculatedTotal =
                      response?.totalAmount || response?.data?.totalAmount || total;

                    // Disparar evento Purchase en Meta Pixel para orden confirmada por transferencia
                    trackPurchase({
                      value: Number(finalCalculatedTotal || 0),
                      currency: 'ARS',
                    });
                    // Abrir WhatsApp en nueva pestaña de forma segura (sin romper si el navegador móvil bloquea popups async)
                    try {
                      window.open(waUrl, '_blank', 'noopener,noreferrer');
                    } catch { }
                    // Abrir WhatsApp en nueva pestaña de forma segura (sin romper si el navegador móvil bloquea popups async)
                    try {
                      window.open(waUrl, '_blank', 'noopener,noreferrer');
                    } catch { }
                    // Disparar evento Purchase en Meta Pixel para orden confirmada por transferencia
                    trackPurchase({
                      value: Number(finalCalculatedTotal || 0),
                      currency: 'ARS',
                    });

                    // Construir mensaje preformateado para WhatsApp oficial de CIRQA
                    const waMessage = `Hola CIRQA! Acabo de realizar el pedido *#${orderNum}* por un total de *$${finalCalculatedTotal.toLocaleString('es-AR')}*. Adjunto el comprobante de transferencia.`;
                    // Desacople completo: cerrar Drawer y abrir OrderReceiptModal independiente
                    openReceipt({
                      orderNumber: orderNum,
                      orderId: createdOrderId,
                      customerName: formData.name.trim(),
                      subtotal,
                      discountAmount,
                      shippingCost,
                      shippingMethod: selectedShippingOption
                        ? selectedShippingOption.name
                        : 'Envío a Domicilio - Zipnova',
                      totalAmount: finalCalculatedTotal,
                      waUrl,
                    });
                    // Desacople completo: cerrar Drawer y abrir OrderReceiptModal independiente
                    openReceipt({
                      orderNumber: orderNum,
                      orderId: createdOrderId,
                      customerName: formData.name.trim(),
                      subtotal,
                      discountAmount,
                      shippingCost,
                      shippingMethod: selectedShippingOption
                        ? selectedShippingOption.name
                        : 'Envío a Domicilio - Zipnova',
                      totalAmount: finalCalculatedTotal,
                      waUrl,
                    });
                    // Construir mensaje preformateado para WhatsApp oficial de CIRQA
                    const waMessage = `Hola CIRQA! Acabo de realizar el pedido *#${orderNum}* por un total de *$${finalCalculatedTotal.toLocaleString('es-AR')}*. Adjunto el comprobante de transferencia.`;
                    const waUrl = `https://wa.me/${OFFICIAL_WHATSAPP}?text=${encodeURIComponent(waMessage)}`;

                    const waUrl = `https://wa.me/${OFFICIAL_WHATSAPP}?text=${encodeURIComponent(waMessage)}`;
                    // Limpiar carrito si no fue compra directa
                    if (!checkoutTargetItem) {
                      clearCart();
                    }
                    // Limpiar carrito si no fue compra directa
                    if (!checkoutTargetItem) {
                      clearCart();
                    }
                    // Abrir WhatsApp en nueva pestaña de forma segura (sin romper si el navegador móvil bloquea popups async)
                    try {
                      window.open(waUrl, '_blank', 'noopener,noreferrer');
                    } catch { }

                    // Abrir WhatsApp en nueva pestaña
                    window.open(waUrl, '_blank', 'noopener,noreferrer');
                    // Abrir WhatsApp en nueva pestaña de forma segura (sin romper si el navegador móvil bloquea popups async)
                    try {
                      window.open(waUrl, '_blank', 'noopener,noreferrer');
                    } catch { }
                    setIsSubmitting(false);
                    return;
                  }
                  setIsSubmitting(false);
                  return;
                }
                // Desacople completo: cerrar Drawer y abrir OrderReceiptModal independiente
                openReceipt({
                  orderNumber: orderNum,
                  orderId: createdOrderId,
                  customerName: formData.name.trim(),
                  subtotal,
                  discountAmount,
                  shippingCost,
                  shippingMethod: selectedShippingOption
                    ? selectedShippingOption.name
                    : 'Envío a Domicilio - Zipnova',
                  totalAmount: finalCalculatedTotal,
                  waUrl,
                });

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
                // CASO B: MERCADO PAGO CHECKOUT PRO (Prioridad absoluta producción)
                const prodInitPoint =
                  response?.initPoint ||
                  response?.data?.initPoint ||
                  response?.init_point ||
                  response?.data?.init_point;
                // CASO B: MERCADO PAGO CHECKOUT PRO (Prioridad absoluta producción)
                const prodInitPoint =
                  response?.initPoint ||
                  response?.data?.initPoint ||
                  response?.init_point ||
                  response?.data?.init_point;
                // Limpiar carrito si no fue compra directa
                if (!checkoutTargetItem) {
                  clearCart();
                }

                // Limpiar carrito si no fue compra directa
                if (!checkoutTargetItem) {
                  clearCart();
                }
                const sandboxInitPoint =
                  response?.sandboxInitPoint ||
                  response?.data?.sandboxInitPoint ||
                  response?.sandbox_init_point ||
                  response?.data?.sandbox_init_point;
                const sandboxInitPoint =
                  response?.sandboxInitPoint ||
                  response?.data?.sandboxInitPoint ||
                  response?.sandbox_init_point ||
                  response?.data?.sandbox_init_point;
                setIsSubmitting(false);
                return;
              }

                setIsSubmitting(false);
              return;
            }
              const initPoint = prodInitPoint || sandboxInitPoint;
            // CASO B: MERCADO PAGO CHECKOUT PRO (Prioridad absoluta producción)
            const prodInitPoint =
              response?.initPoint ||
              response?.data?.initPoint ||
              response?.init_point ||
              response?.data?.init_point;

            // CASO B: MERCADO PAGO CHECKOUT PRO (Prioridad absoluta producción)
            const prodInitPoint =
              response?.initPoint ||
              response?.data?.initPoint ||
              response?.init_point ||
              response?.data?.init_point;
            if (!initPoint) {
              throw new Error(
                response?.message ||
                'No se recibió el enlace de pago de Mercado Pago. Reintenta en instantes.'
              );
            }
            if (!initPoint) {
              throw new Error(
                response?.message ||
                'No se recibió el enlace de pago de Mercado Pago. Reintenta en instantes.'
              );
            }
            const sandboxInitPoint =
              response?.sandboxInitPoint ||
              response?.data?.sandboxInitPoint ||
              response?.sandbox_init_point ||
              response?.data?.sandbox_init_point;

            const sandboxInitPoint =
              response?.sandboxInitPoint ||
              response?.data?.sandboxInitPoint ||
              response?.sandbox_init_point ||
              response?.data?.sandbox_init_point;
            // Redirigir a la pasarela de Checkout Pro
            window.location.href = initPoint;
          } catch (err) {
            console.error('[Checkout Error]:', err);
            setSubmissionError(
              err.message ||
              'Ocurrió un error al procesar tu pedido. Verificá tu conexión e intentá de nuevo.'
            );
            setIsSubmitting(false);
          }
        };
        // Redirigir a la pasarela de Checkout Pro
        window.location.href = initPoint;
      } catch (err) {
        console.error('[Checkout Error]:', err);
        setSubmissionError(
          err.message ||
          'Ocurrió un error al procesar tu pedido. Verificá tu conexión e intentá de nuevo.'
        );
        setIsSubmitting(false);
      }
    };

    const initPoint = prodInitPoint || sandboxInitPoint;
    const hasValidationErrors = Object.keys(errors).some((k) => Boolean(errors[k]));
    const hasValidationErrors = Object.keys(errors).some((k) => Boolean(errors[k]));

    if (!initPoint) {
      throw new Error(
        response?.message || 'No se recibió el enlace de pago de Mercado Pago. Reintenta en instantes.'
          response?.message ||
        'No se recibió el enlace de pago de Mercado Pago. Reintenta en instantes.'
      );
    }
    return (
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-[60] overflow-hidden flex justify-end font-montserrat">
            {/* Backdrop suave */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}

              // Redirigir a la pasarela de Checkout Pro
              window.location.href = initPoint;
    } catch (err) {
              console.error('[Checkout Error]:', err);
            setSubmissionError(
            err.message ||
            'Ocurrió un error al procesar tu pedido. Verificá tu conexión e intentá de nuevo.'
            );
            setIsSubmitting(false);
    }
  };

  const hasValidationErrors = Object.keys(errors).some((k) => Boolean(errors[k]));

            return (
            <AnimatePresence>
              {isCheckoutOpen && (
                <div className="fixed inset-0 z-[60] overflow-hidden flex justify-end font-montserrat">
                  {/* Backdrop suave */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    onClick={() => !isSubmitting && closeCheckout()}
                    className="fixed inset-0 bg-cirqa-negro/60 backdrop-blur-sm"
                  />

                  {/* DRAWER LATERAL ANIMADO (100dvh para teclado móvil en iOS/Android) */}
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                    className="relative w-full max-w-xl bg-white h-[100dvh] shadow-2xl flex flex-col z-10 overflow-hidden text-cirqa-negro border-l border-cirqa-negro/10"
                  >
                    {/* Header del Drawer (Compacto ~52px en mobile) */}
                    <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-cirqa-negro/10 flex items-center justify-between bg-cirqa-surface/90 backdrop-blur-sm flex-shrink-0">
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-cirqa-negro text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                          C
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase tracking-widest text-cirqa-primario font-semibold block truncate leading-tight">
                            CIRQA · Checkout en 1 Clic
                          </span>
                          <h2 className="text-sm sm:text-lg font-light tracking-tight text-cirqa-negro truncate leading-tight">
                            {checkoutTargetItem ? 'Confirmar Compra' : 'Tu Bolsa de Compra'}
                          </h2>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => !isSubmitting && closeCheckout()}
                        className="fixed inset-0 bg-cirqa-negro/60 backdrop-blur-sm"
                      />
                      return (
                      <AnimatePresence>
                        {isCheckoutOpen && (
                          <div className="fixed inset-0 z-[60] overflow-hidden flex justify-end font-montserrat">
                            {/* Backdrop suave */}
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              onClick={() => !isSubmitting && closeCheckout()}
                              className="fixed inset-0 bg-cirqa-negro/60 backdrop-blur-sm"
                            />
                            disabled={isSubmitting}
                            className="p-2 text-cirqa-negro/50 hover:text-cirqa-negro rounded-full hover:bg-black/5 transition-colors cursor-pointer disabled:opacity-30 flex-shrink-0"
                            aria-label="Cerrar checkout drawer"
              >
                            <X className="w-5 h-5" />
                          </button>
            </div>

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
                    {/* DRAWER LATERAL ANIMADO (100dvh para teclado móvil en iOS/Android) */}
                    <motion.div
                      initial={{ x: '100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: '100%' }}
                      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                      className="relative w-full max-w-xl bg-white h-[100dvh] shadow-2xl flex flex-col z-10 overflow-hidden text-cirqa-negro border-l border-cirqa-negro/10"
                    >
                      {/* Header del Drawer (Compacto en mobile) */}
                      <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-cirqa-negro/10 flex items-center justify-between bg-cirqa-surface/80 backdrop-blur-sm flex-shrink-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-cirqa-negro text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                            C
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase tracking-widest text-cirqa-primario font-semibold block truncate">
                              CIRQA · Checkout en 1 Clic
                            </span>
                            <h2 className="text-base sm:text-lg font-light tracking-tight text-cirqa-negro truncate">
                              {checkoutTargetItem ? 'Confirmar Compra' : 'Tu Bolsa de Compra'}
                            </h2>
                          </div>
                        </div>
                        {/* DRAWER LATERAL ANIMADO (100dvh para teclado móvil en iOS/Android) */}
                        <motion.div
                          initial={{ x: '100%' }}
                          animate={{ x: 0 }}
                          exit={{ x: '100%' }}
                          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                          className="relative w-full max-w-xl bg-white h-[100dvh] shadow-2xl flex flex-col z-10 overflow-hidden text-cirqa-negro border-l border-cirqa-negro/10"
                        >
                          {/* Header del Drawer (Compacto ~52px en mobile) */}
                          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-cirqa-negro/10 flex items-center justify-between bg-cirqa-surface/90 backdrop-blur-sm flex-shrink-0">
                            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-cirqa-negro text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                                C
                              </div>
                              <div className="min-w-0">
                                <span className="text-[10px] uppercase tracking-widest text-cirqa-primario font-semibold block truncate leading-tight">
                                  CIRQA · Checkout en 1 Clic
                                </span>
                                <h2 className="text-sm sm:text-lg font-light tracking-tight text-cirqa-negro truncate leading-tight">
                                  {checkoutTargetItem ? 'Confirmar Compra' : 'Tu Bolsa de Compra'}
                                </h2>
                              </div>
                            </div>
                            {/* Contenedor único scrolleable en mobile: 100% táctil debajo del header */}
                            <div
                              ref={scrollContainerRef}
                              className="flex-1 overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch] px-4 sm:px-6 pt-3.5 pb-6 md:pb-0 sm:pt-5 space-y-5"
                            >
                              {submissionError && (
                                <div className="p-3.5 rounded-2xl bg-cirqa-carmin/10 border border-cirqa-carmin/20 text-cirqa-carmin text-xs flex items-start gap-2.5">
                                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                  <p className="leading-relaxed">{submissionError}</p>
                                </div>
                              )}

                  const handleCloseSuccessModal = () => {
                                setTransferSuccessOrder(null);
                              closeCheckout();
                  };
                              <button
                                type="button"
                                onClick={() => !isSubmitting && closeCheckout()}
                                disabled={isSubmitting}
                                className="p-2 text-cirqa-negro/50 hover:text-cirqa-negro rounded-full hover:bg-black/5 transition-colors cursor-pointer disabled:opacity-30 flex-shrink-0"
                                aria-label="Cerrar checkout drawer"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => !isSubmitting && closeCheckout()}
                              disabled={isSubmitting}
                              className="p-2 text-cirqa-negro/50 hover:text-cirqa-negro rounded-full hover:bg-black/5 transition-colors cursor-pointer disabled:opacity-30 flex-shrink-0"
                              aria-label="Cerrar checkout drawer"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          {/* ========================================================= */}
                          {/* 1. RESUMEN COMPACTO SUPERIOR: PRODUCTOS Y VARIANTE        */}
                          {/* ========================================================= */}
                          <div className="space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-cirqa-negro/60">
                                Tu Selección ({activeItems.length})
                              </span>
                              <span className="text-[10px] text-cirqa-primario bg-cirqa-primario/10 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 font-mono">
                                <Truck className="w-3 h-3 flex-shrink-0" />
                                <span>Envíos a todo el país</span>
                              </span>
                            </div>

                            if (!isCheckoutOpen) return null;
                  const hasValidationErrors = Object.keys(errors).some((k) => Boolean(errors[k]));
                            {/* Contenido scrolleable amplio (incluye formulario, envío, pago, cupón y desglose) */}
                            {activeItems.length === 0 ? (
                              <div className="p-6 text-center bg-[#FBFBFA] rounded-2xl border border-dashed border-cirqa-negro/15">
                                <Package className="w-7 h-7 text-cirqa-negro/30 mx-auto mb-2" />
                                <p className="text-xs text-cirqa-negro/60 font-light">Tu bolsa está vacía.</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {activeItems.map((item) => (
                                  <div
                                    ref={scrollContainerRef}
                                    className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 pt-4 pb-8 sm:py-6 space-y-5"
                                    key={item.id}
                                    className="p-2.5 sm:p-3.5 bg-[#FBFBFA] rounded-2xl border border-cirqa-negro/10 flex items-center gap-3"
                                  >
                                    {submissionError && (
                                      <div className="p-3.5 rounded-2xl bg-cirqa-carmin/10 border border-cirqa-carmin/20 text-cirqa-carmin text-xs flex items-start gap-2.5">
                                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <p className="leading-relaxed">{submissionError}</p>
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-white border border-cirqa-negro/5 p-1 flex items-center justify-center flex-shrink-0 shadow-2xs overflow-hidden">
                                          <img
                                            src={formatMediaUrl(item.image)}
                                            alt={item.name}
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                              e.currentTarget.src = '/products/_DSC8649.webp';
                                            }}
                                          />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-mono font-bold text-cirqa-primario uppercase flex-shrink-0">
                                              {item.modelCode || 'Q-001'}
                                            </span>
                                            <span className="text-xs font-semibold text-cirqa-negro truncate">
                                              {item.name}
                                            </span>
                                          </div>
                        )}
                                          {/* Contenedor único scrolleable en mobile: 100% táctil debajo del header */}
                                          <div
                                            ref={scrollContainerRef}
                                            className="flex-1 overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch] px-4 sm:px-6 pt-3.5 pb-6 md:pb-0 sm:pt-5 space-y-5"
                                          >
                                            {submissionError && (
                                              <div className="p-3.5 rounded-2xl bg-cirqa-carmin/10 border border-cirqa-carmin/20 text-cirqa-carmin text-xs flex items-start gap-2.5">
                                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                <p className="leading-relaxed">{submissionError}</p>

                                                {item.variantName && (
                                                  <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span
                                                      className="w-2.5 h-2.5 rounded-full border border-black/10 flex-shrink-0"
                                                      style={{ backgroundColor: item.badgeColor || '#F3B93A' }}
                                                    />
                                                    <span className="text-[11px] font-medium text-cirqa-negro truncate">
                                                      {item.variantName}
                                                    </span>
                                                    {item.variantSubtitle && (
                                                      <span className="text-[9px] text-cirqa-negro/50 font-mono truncate">
                                                        ({item.variantSubtitle})
                                                      </span>
                                                    )}
                                                  </div>
                                                )}

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
                                                    {isCheckoutOpen && (
                                                      <div className="fixed inset-0 z-[60] overflow-hidden flex justify-end font-montserrat">
                                                        {/* Backdrop suave */}
                                                        <motion.div
                                                          initial={{ opacity: 0 }}
                                                          animate={{ opacity: 1 }}
                                                          exit={{ opacity: 0 }}
                                                          transition={{ duration: 0.25 }}
                                                          onClick={() => !isSubmitting && closeCheckout()}
                                                          className="fixed inset-0 bg-cirqa-negro/60 backdrop-blur-sm"
                                                        />
                                                        {/* ========================================================= */}
                                                        {/* 1. RESUMEN SUPERIOR: PRODUCTOS Y VARIANTE EXACTA          */}
                                                        {/* ========================================================= */}
                                                        <div className="space-y-3">
                                                          <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <span className="text-[11px] font-semibold uppercase tracking-wider text-cirqa-negro/60">
                                                              Resumen de tu Configuración ({activeItems.length})
                                                            </span>
                                                            <span className="text-[10px] text-cirqa-primario bg-cirqa-primario/10 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 font-mono">
                                                              <Truck className="w-3 h-3 flex-shrink-0" />
                                                              <span>Envíos a todo el país con seguimiento</span>
                                                            </span>
                                                          </div>
                                                          {/* ========================================================= */}
                                                          {/* 1. RESUMEN COMPACTO SUPERIOR: PRODUCTOS Y VARIANTE        */}
                                                          {/* ========================================================= */}
                                                          <div className="space-y-2.5">
                                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                              <span className="text-[11px] font-semibold uppercase tracking-wider text-cirqa-negro/60">
                                                                Tu Selección ({activeItems.length})
                                                              </span>
                                                              <span className="text-[10px] text-cirqa-primario bg-cirqa-primario/10 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 font-mono">
                                                                <Truck className="w-3 h-3 flex-shrink-0" />
                                                                <span>Envíos a todo el país</span>
                                                              </span>
                                                            </div>
                                                            <div className="flex items-center justify-between mt-1.5">
                                                              <span className="text-xs font-mono font-bold text-cirqa-negro">
                                                                $ {Number(item.price || 0).toLocaleString('es-AR')}
                                                              </span>

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
                                                                      {/* DRAWER LATERAL ANIMADO */}
                                                                      <motion.div
                                                                        initial={{ x: '100%' }}
                                                                        animate={{ x: 0 }}
                                                                        exit={{ x: '100%' }}
                                                                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                                                                        className="relative w-full max-w-xl bg-white h-full max-h-[100dvh] shadow-2xl flex flex-col z-10 overflow-hidden text-cirqa-negro border-l border-cirqa-negro/10"
                                                                      >
                                                                        {/* Header del Drawer (Compacto en mobile) */}
                                                                        <div className="px-4 sm:px-6 py-3.5 sm:py-5 border-b border-cirqa-negro/10 flex items-center justify-between bg-cirqa-surface/80 backdrop-blur-sm flex-shrink-0">
                                                                          <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-full bg-cirqa-negro text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                                              C
                                                                            </div>
                                                                            <div>
                                                                              <span className="text-[10px] uppercase tracking-widest text-cirqa-primario font-semibold block">
                                                                                CIRQA · Checkout en 1 Clic
                                                                              </span>
                                                                              <h2 className="text-base sm:text-lg font-light tracking-tight text-cirqa-negro">
                                                                                {checkoutTargetItem ? 'Confirmar Compra' : 'Tu Bolsa de Compra'}
                                                                              </h2>
                                                                            </div>
                                                                          </div>
                                                                          <div>
                                                                            <span className="text-[10px] uppercase tracking-widest text-cirqa-primario font-semibold block">
                                                                              CIRQA · Checkout en 1 Clic
                                                                            </span>
                                                                            <h2 className="text-lg font-light tracking-tight text-cirqa-negro">
                                                                              {checkoutTargetItem ? 'Confirmar Compra' : 'Tu Bolsa de Compra'}
                                                                            </h2>
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
                                                                                  {activeItems.length === 0 ? (
                                                                                    <div className="p-6 text-center bg-[#FBFBFA] rounded-2xl border border-dashed border-cirqa-negro/15">
                                                                                      <Package className="w-7 h-7 text-cirqa-negro/30 mx-auto mb-2" />
                                                                                      <p className="text-xs text-cirqa-negro/60 font-light">Tu bolsa está vacía.</p>
                                                                                    </div>
                                                                                  ) : (
                                                                                    <div className="space-y-2">
                                                                                      {activeItems.map((item) => (
                                                                                        <div
                                                                                          key={item.id}
                                                                                          className="p-2.5 sm:p-3.5 bg-[#FBFBFA] rounded-2xl border border-cirqa-negro/10 flex items-center gap-3"
                                                                                        >
                                                                                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-white border border-cirqa-negro/5 p-1 flex items-center justify-center flex-shrink-0 shadow-2xs overflow-hidden">
                                                                                            <img
                                                                                              src={formatMediaUrl(item.image)}
                                                                                              alt={item.name}
                                                                                              className="w-full h-full object-contain"
                                                                                              onError={(e) => {
                                                                                                e.currentTarget.src = '/products/_DSC8649.webp';
                                                                                              }}
                                                                                            />
                                                                                          </div>

                                                                                          <button
                                                                                            type="button"
                                                                                            onClick={() => !isSubmitting && closeCheckout()}
                                                                                            disabled={isSubmitting}
                                                                                            className="p-2 text-cirqa-negro/50 hover:text-cirqa-negro rounded-full hover:bg-black/5 transition-colors cursor-pointer disabled:opacity-30"
                                                                                            aria-label="Cerrar checkout drawer"
                                                                                          >
                                                                                            <X className="w-5 h-5" />
                                                                                          </button>
                                                                                        </div>
                        {/* Detalles del modelo y variante */ }
                                                                                        < div className = "flex-1 min-w-0" >
                                                                                        <div className="flex items-center gap-2">
                                                                                          <span className="text-[10px] font-mono font-bold text-cirqa-primario uppercase">
                                                                                            <div className="flex-1 min-w-0">
                                                                                              <div className="flex items-center gap-1.5">
                                                                                                <span className="text-[10px] font-mono font-bold text-cirqa-primario uppercase flex-shrink-0">
                                                                                                  {item.modelCode || 'Q-001'}
                                                                                                </span>
                                                                                                <span className="text-xs font-semibold text-cirqa-negro truncate">
                                                                                                  {item.name}
                                                                                                </span>
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
                                                                                            {/* Contenido scrolleable (incluye formulario, medio de pago, cupón y desglose para liberar el viewport en teléfonos) */}
                                                                                            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 sm:py-6 space-y-5">
                                                                                              {submissionError && (
                                                                                                <div className="p-3.5 rounded-2xl bg-cirqa-carmin/10 border border-cirqa-carmin/20 text-cirqa-carmin text-xs flex items-start gap-2.5">
                                                                                                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                                                                  <p className="leading-relaxed">{submissionError}</p>
                                                                                                </div>
                                                                                              )}
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
                                                                                              {item.variantName && (
                                                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                                                  <span
                                                                                                    className="w-2.5 h-2.5 rounded-full border border-black/10 flex-shrink-0"
                                                                                                    style={{ backgroundColor: item.badgeColor || '#F3B93A' }}
                                                                                                  />
                                                                                                  <span className="text-[11px] font-medium text-cirqa-negro truncate">
                                                                                                    {item.variantName}
                                                                                                  </span>
                                                                                                  {item.variantSubtitle && (
                                                                                                    <span className="text-[9px] text-cirqa-negro/50 font-mono truncate">
                                                                                                      ({item.variantSubtitle})
                                                                                                    </span>
                                                                                                  )}
                                                                                                </div>
                                                                                              )}

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
                                                                                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                                                                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-cirqa-negro/60">
                                                                                                      Resumen de tu Configuración ({activeItems.length})
                                                                                                    </span>
                                                                                                    <span className="text-[10px] text-cirqa-primario bg-cirqa-primario/10 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 font-mono">
                                                                                                      <Truck className="w-3 h-3 flex-shrink-0" />
                                                                                                      <span>Envíos a todo el país con seguimiento</span>
                                                                                                    </span>
                                                                                                  </div>
                                                                                                  <div className="flex items-center justify-between mt-2">
                                                                                                    <span className="text-xs font-mono font-bold text-cirqa-negro">
                                                                                                      $ {Number(item.price || 0).toLocaleString('es-AR')}
                                                                                                    </span>
                                                                                                    <div className="flex items-center justify-between mt-1.5">
                                                                                                      <span className="text-xs font-mono font-bold text-cirqa-negro">
                                                                                                        $ {Number(item.price || 0).toLocaleString('es-AR')}
                                                                                                      </span>

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
                                                                                                            Envíos a todo el país con seguimiento
                                                                                                          </span>
                                                                                                        </div>
                                                                                                        {/* Controles de cantidad solo si no es compra rápida directa */}
                                                                                                        {!checkoutTargetItem && (
                                                                                                          <div className="flex items-center gap-2">
                                                                                                            <div className="flex items-center border border-cirqa-negro/15 rounded-lg bg-white overflow-hidden">
                                                                                                              <button
                                                                                                                type="button"
                                                                                                                onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                                                                                                                className="p-1.5 hover:bg-black/5 text-cirqa-negro/60"
                                                                                                                aria-label="Restar unidad"
                                                                                                              >
                                                                                                                <Minus className="w-3.5 h-3.5" />
                                                                                                              </button>
                                                                                                              <span className="px-2.5 text-[11px] font-mono font-semibold">
                                                                                                                {item.quantity || 1}
                                                                                                              </span>
                                                                                                              <button
                                                                                                                type="button"
                                                                                                                onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                                                                                                                className="p-1.5 hover:bg-black/5 text-cirqa-negro/60"
                                                                                                                aria-label="Sumar unidad"
                                                                                                              >
                                                                                                                <Plus className="w-3.5 h-3.5" />
                                                                                                              </button>
                                                                                                            </div>
                                                                                                            <button
                                                                                                              type="button"
                                                                                                              onClick={() => removeFromCart(item.id)}
                                                                                                              className="p-1.5 text-cirqa-negro/40 hover:text-cirqa-carmin transition-colors"
                                                                                                              aria-label="Quitar producto"
                                                                                                            >
                                                                                                              <Trash2 className="w-4 h-4" />
                                                                                                            </button>
                                                                                                          </div>
                                                                                                        )}
                                                                                                      </div>
                                                                                                    </div>
                                                                                                  </div>
                                                                                                  {!checkoutTargetItem && (
                                                                                                    <div className="flex items-center gap-1.5">
                                                                                                      <div className="flex items-center border border-cirqa-negro/15 rounded-lg bg-white overflow-hidden">
                                                                                                        <button
                                                                                                          type="button"
                                                                                                          onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                                                                                                          className="p-1.5 hover:bg-black/5 text-cirqa-negro/60"
                                                                                                          aria-label="Restar unidad"
                                                                                                        >
                                                                                                          <Minus className="w-3.5 h-3.5" />
                                                                                                        </button>
                                                                                                        <span className="px-2 text-[11px] font-mono font-semibold">
                                                                                                          {item.quantity || 1}
                                                                                                        </span>
                                                                                                        <button
                                                                                                          type="button"
                                                                                                          onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                                                                                                          className="p-1.5 hover:bg-black/5 text-cirqa-negro/60"
                                                                                                          aria-label="Sumar unidad"
                                                                                                        >
                                                                                                          <Plus className="w-3.5 h-3.5" />
                                                                                                        </button>
                                                                                                      </div>
                                                                                                      <button
                                                                                                        type="button"
                                                                                                        onClick={() => removeFromCart(item.id)}
                                                                                                        className="p-1.5 text-cirqa-negro/40 hover:text-cirqa-carmin transition-colors"
                                                                                                        aria-label="Quitar producto"
                                                                                                      >
                                                                                                        <Trash2 className="w-4 h-4" />
                                                                                                      </button>
                                                                                                    </div>
                                                                                                  )}
                                                                                                </div>
                                                                                              </div>
                                                                                            </div>
                                                                                            {!checkoutTargetItem && (
                                                                                              <div className="flex items-center gap-1.5">
                                                                                                <div className="flex items-center border border-cirqa-negro/15 rounded-lg bg-white overflow-hidden">
                                                                                                  <button
                                                                                                    type="button"
                                                                                                    onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                                                                                                    className="p-1.5 hover:bg-black/5 text-cirqa-negro/60"
                                                                                                    aria-label="Restar unidad"
                                                                                                  >
                                                                                                    <Minus className="w-3.5 h-3.5" />
                                                                                                  </button>
                                                                                                  <span className="px-2 text-[11px] font-mono font-semibold">
                                                                                                    {item.quantity || 1}
                                                                                                  </span>
                                                                                                  <button
                                                                                                    type="button"
                                                                                                    onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                                                                                                    className="p-1.5 hover:bg-black/5 text-cirqa-negro/60"
                                                                                                    aria-label="Sumar unidad"
                                                                                                  >
                                                                                                    <Plus className="w-3.5 h-3.5" />
                                                                                                  </button>
                                                                                                </div>
                                                                                                <button
                                                                                                  type="button"
                                                                                                  onClick={() => removeFromCart(item.id)}
                                                                                                  className="p-1.5 text-cirqa-negro/40 hover:text-cirqa-carmin transition-colors"
                                                                                                  aria-label="Quitar producto"
                                                                                                >
                                                                                                  <Trash2 className="w-4 h-4" />
                                                                                                </button>
                                                                                              </div>
                                                                                            )}
                                                                                        </div>
                        </div>
                      </div>
                                                                              ))}
                                                                            </div>
                  </div>
                                                          )}
                                                                    </div>
                )}
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
                                                                          {/* ========================================================= */}
                                                                          {/* 2. FORMULARIO ERGONÓMICO DE ENTREGA (16px en mobile p/iOS)*/}
                                                                          {/* ========================================================= */}
                                                                          <form
                                                                            id="checkout-form"
                                                                            ref={formRef}
                                                                            noValidate
                                                                            onSubmit={handleSubmitCheckout}
                                                                            className="space-y-4 pt-3 border-t border-cirqa-negro/10"
                                                                          >
                                                                            <button type="submit" className="hidden" tabIndex={-1} aria-hidden="true" />
                                                                            <div className="flex items-center gap-2">
                                                                              <MapPin className="w-4 h-4 text-cirqa-primario" />
                                                                              <span className="text-xs font-semibold uppercase tracking-wider text-cirqa-negro">
                                                                                Datos de Entrega y Facturación
                                                                              </span>
                                                                            </div>
                                                                            {/* ========================================================= */}
                                                                            {/* 2. FORMULARIO ERGONÓMICO DE ENTREGA (16px en mobile p/iOS)*/}
                                                                            {/* ========================================================= */}
                                                                            <form
                                                                              id="checkout-form"
                                                                              ref={formRef}
                                                                              noValidate
                                                                              onSubmit={handleSubmitCheckout}
                                                                              className="space-y-4 pt-3 border-t border-cirqa-negro/10"
                                                                            >
                                                                              <button type="submit" className="hidden" tabIndex={-1} aria-hidden="true" />
                                                                              <div className="flex items-center gap-2">
                                                                                <MapPin className="w-4 h-4 text-cirqa-primario" />
                                                                                <span className="text-xs font-semibold uppercase tracking-wider text-cirqa-negro">
                                                                                  Datos de Entrega y Facturación
                                                                                </span>
                                                                              </div>
                                                                              {/* ========================================================= */}
                                                                              {/* 2. FORMULARIO ERGONÓMICO DE ENTREGA (16px en mobile p/iOS)*/}
                                                                              {/* ========================================================= */}
                                                                              <form
                                                                                id="checkout-form"
                                                                                ref={formRef}
                                                                                noValidate
                                                                                onSubmit={handleSubmitCheckout}
                                                                                className="space-y-4 pt-3 border-t border-cirqa-negro/10"
                                                                              >
                                                                                <button type="submit" className="hidden" tabIndex={-1} aria-hidden="true" />
                                                                                <div className="flex items-center gap-2">
                                                                                  <MapPin className="w-4 h-4 text-cirqa-primario" />
                                                                                  <span className="text-xs font-semibold uppercase tracking-wider text-cirqa-negro">
                                                                                    Datos de Entrega y Facturación
                                                                                  </span>
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
                                                                                  {/* Nombre y Email */}
                                                                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                                    <div>
                                                                                      <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1.5">
                                                                                        Nombre Completo *
                                                                                      </label>
                                                                                      <input
                                                                                        type="text"
                                                                                        name="name"
                                                                                        autoComplete="name"
                                                                                        value={formData.name}
                                                                                        onChange={handleChange}
                                                                                        placeholder="ej. Agustín Gómez"
                                                                                        className={getInputClasses(errors.name)}
                                                                                      />
                                                                                      {errors.name && (
                                                                                        <p className="text-[11px] text-cirqa-carmin font-medium mt-1">{errors.name}</p>
                                                                                      )}
                                                                                    </div>
                                                                                    {/* Nombre y Email */}
                                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                                      <div>
                                                                                        <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1.5">
                                                                                          Nombre Completo *
                                                                                        </label>
                                                                                        <input
                                                                                          type="text"
                                                                                          name="name"
                                                                                          autoComplete="name"
                                                                                          value={formData.name}
                                                                                          onChange={handleChange}
                                                                                          placeholder="ej. Agustín Gómez"
                                                                                          className={getInputClasses(errors.name)}
                                                                                        />
                                                                                        {errors.name && (
                                                                                          <p className="text-[11px] text-cirqa-carmin font-medium mt-1">{errors.name}</p>
                                                                                        )}
                                                                                      </div>
                                                                                      {/* Nombre y Email */}
                                                                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                                        <div>
                                                                                          <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1.5">
                                                                                            Nombre Completo *
                                                                                          </label>
                                                                                          <input
                                                                                            type="text"
                                                                                            name="name"
                                                                                            autoComplete="name"
                                                                                            value={formData.name}
                                                                                            onChange={handleChange}
                                                                                            placeholder="ej. Agustín Gómez"
                                                                                            className={getInputClasses(errors.name)}
                                                                                          />
                                                                                          {errors.name && (
                                                                                            <p className="text-[11px] text-cirqa-carmin font-medium mt-1">{errors.name}</p>
                                                                                          )}
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
                                                                                        <div>
                                                                                          <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1.5">
                                                                                            Email de Confirmación *
                                                                                          </label>
                                                                                          <input
                                                                                            type="email"
                                                                                            name="email"
                                                                                            inputMode="email"
                                                                                            autoComplete="email"
                                                                                            value={formData.email}
                                                                                            onChange={handleChange}
                                                                                            onBlur={() => {
                                                                                              const cleanEmail = formData.email.trim().toLowerCase();
                                                                                              if (cleanEmail !== formData.email) {
                                                                                                setFormData((prev) => ({ ...prev, email: cleanEmail }));
                                                                                              }
                                                                                              if (
                                                                                                cleanEmail &&
                                                                                                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) &&
                                                                                                activeItems.length > 0
                                                                                              ) {
                                                                                                abandonedCartService
                                                                                                  .save({
                                                                                                    name: formData.name.trim(),
                                                                                                    email: cleanEmail,
                                                                                                    phone: formData.phone.trim(),
                                                                                                    items: activeItems,
                                                                                                    subtotal,
                                                                                                  })
                                                                                                  .catch(() => { });
                                                                                                <div>
                                                                                                  <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1.5">
                                                                                                    Email de Confirmación *
                                                                                                  </label>
                                                                                                  <input
                                                                                                    type="email"
                                                                                                    name="email"
                                                                                                    inputMode="email"
                                                                                                    autoComplete="email"
                                                                                                    value={formData.email}
                                                                                                    onChange={handleChange}
                                                                                                    onBlur={() => {
                                                                                                      const cleanEmail = formData.email.trim().toLowerCase();
                                                                                                      if (cleanEmail !== formData.email) {
                                                                                                        setFormData((prev) => ({ ...prev, email: cleanEmail }));
                                                                                                      }
                                                                                                      if (
                                                                                                        cleanEmail &&
                                                                                                        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) &&
                                                                                                        activeItems.length > 0
                                                                                                      ) {
                                                                                                        abandonedCartService
                                                                                                          .save({
                                                                                                            name: formData.name.trim(),
                                                                                                            email: cleanEmail,
                                                                                                            phone: formData.phone.trim(),
                                                                                                            items: activeItems,
                                                                                                            subtotal,
                                                                                                          })
                                                                                                          .catch(() => { });
                                                                                                        <div>
                                                                                                          <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1.5">
                                                                                                            Email de Confirmación *
                                                                                                          </label>
                                                                                                          <input
                                                                                                            type="email"
                                                                                                            name="email"
                                                                                                            inputMode="email"
                                                                                                            autoComplete="email"
                                                                                                            value={formData.email}
                                                                                                            onChange={handleChange}
                                                                                                            onBlur={() => {
                                                                                                              const cleanEmail = formData.email.trim().toLowerCase();
                                                                                                              if (cleanEmail !== formData.email) {
                                                                                                                setFormData((prev) => ({ ...prev, email: cleanEmail }));
                                                                                                              }
                                                                                                              if (
                                                                                                                cleanEmail &&
                                                                                                                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) &&
                                                                                                                activeItems.length > 0
                                                                                                              ) {
                                                                                                                abandonedCartService
                                                                                                                  .save({
                                                                                                                    name: formData.name.trim(),
                                                                                                                    email: cleanEmail,
                                                                                                                    phone: formData.phone.trim(),
                                                                                                                    items: activeItems,
                                                                                                                    subtotal,
                                                                                                                  })
                                                                                                                  .catch(() => { });

                                                                                                                <div className="flex items-center justify-between mt-2">
                                                                                                                  <span className="text-xs font-mono font-bold text-cirqa-negro">
                                                                                                                    $ {Number(item.price || 0).toLocaleString('es-AR')}
                                                                                                                  </span>
                                                                                                                  if (appliedCoupon) {
                                                                                                                    couponService
                                                                                                                      .validate({
                                                                                                                        code: appliedCoupon.code,
                                                                                                                        items: activeItems,
                                                                                                                        subtotal,
                                                                                                                        customerEmail: cleanEmail,
                                                                                                                      })
                                                                                                                      .then((res) => {
                                                                                                                        if (!res.valid) {
                                                                                                                          setAppliedCoupon(null);
                                                                                                                          setCouponError(
                                                                                                                            res.message || 'Este cupón no está disponible para este correo.'
                                                                                                                          );
                                                                                                                        }
                                                                                                                      })
                                                                                                                      .catch((err) => {
                                                                                                                        setAppliedCoupon(null);
                                                                                                                        setCouponError(
                                                                                                                          err.message || 'Este cupón no está disponible para este correo.'
                                                                                                                        );
                                                                                                                      });
                                                                                                                  if (appliedCoupon) {
                                                                                                                    couponService
                                                                                                                      .validate({
                                                                                                                        code: appliedCoupon.code,
                                                                                                                        items: activeItems,
                                                                                                                        subtotal,
                                                                                                                        customerEmail: cleanEmail,
                                                                                                                      })
                                                                                                                      .then((res) => {
                                                                                                                        if (!res.valid) {
                                                                                                                          setAppliedCoupon(null);
                                                                                                                          setCouponError(
                                                                                                                            res.message || 'Este cupón no está disponible para este correo.'
                                                                                                                          );
                                                                                                                        }
                                                                                                                      })
                                                                                                                      .catch((err) => {
                                                                                                                        setAppliedCoupon(null);
                                                                                                                        setCouponError(
                                                                                                                          err.message || 'Este cupón no está disponible para este correo.'
                                                                                                                        );
                                                                                                                      });
                                                                                                                  if (appliedCoupon) {
                                                                                                                    couponService
                                                                                                                      .validate({
                                                                                                                        code: appliedCoupon.code,
                                                                                                                        items: activeItems,
                                                                                                                        subtotal,
                                                                                                                        customerEmail: cleanEmail,
                                                                                                                      })
                                                                                                                      .then((res) => {
                                                                                                                        if (!res.valid) {
                                                                                                                          setAppliedCoupon(null);
                                                                                                                          setCouponError(
                                                                                                                            res.message || 'Este cupón no está disponible para este correo.'
                                                                                                                          );
                                                                                                                        }
                                                                                                                      })
                                                                                                                      .catch((err) => {
                                                                                                                        setAppliedCoupon(null);
                                                                                                                        setCouponError(
                                                                                                                          err.message || 'Este cupón no está disponible para este correo.'
                                                                                                                        );
                                                                                                                      });
                          }
                        }
                      }}
                                                                                                                  placeholder="tu@email.com"
                                                                                                                  className={getInputClasses(errors.email)}
                                                                                                                  placeholder="tu@email.com"
                                                                                                                  className={getInputClasses(errors.email)}
                                                                                                                  placeholder="tu@email.com"
                                                                                                                  className={getInputClasses(errors.email)}
                    />
                                                                                                                  {errors.email && (
                                                                                                                    <p className="text-[11px] text-cirqa-carmin font-medium mt-1">{errors.email}</p>
                                                                                                                  )}
                                                                                                                </div>
                                                                                                                {
                                                                                                                  errors.email && (
                                                                                                                    <p className="text-[11px] text-cirqa-carmin font-medium mt-1">{errors.email}</p>
                                                                                                                  )
                                                                                                                }
                                                                                                                {
                                                                                                                  errors.email && (
                                                                                                                    <p className="text-[11px] text-cirqa-carmin font-medium mt-1">{errors.email}</p>
                                                                                                                  )
                                                                                                                }
                  </div>
                </div>

                                                                                                {/* Controles de cantidad solo si no es compra rápida directa */ }
                                                                                                {
                                                                                                  !checkoutTargetItem && (
                                                                                                    <div className="flex items-center gap-2">
                                                                                                      <div className="flex items-center border border-cirqa-negro/15 rounded-lg bg-white overflow-hidden">
                                                                                                        <button
                                                                                                          type="button"
                                                                                                          onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                                                                                                          className="p-1 hover:bg-black/5 text-cirqa-negro/60"
                                                                                                          className="p-1.5 hover:bg-black/5 text-cirqa-negro/60"
                                                                                                          aria-label="Restar unidad"
                                                                                                        >
                                                                                                          <Minus className="w-3 h-3" />
                                                                                                          <Minus className="w-3.5 h-3.5" />
                                                                                                        </button>
                                                                                                        <span className="px-2 text-[11px] font-mono font-semibold">
                                                                                                          <span className="px-2.5 text-[11px] font-mono font-semibold">
                                                                                                            {item.quantity || 1}
                                                                                                          </span>
                                                                                                          <button
                                                                                                            type="button"
                                                                                                            onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                                                                                                            className="p-1 hover:bg-black/5 text-cirqa-negro/60"
                                                                                                            className="p-1.5 hover:bg-black/5 text-cirqa-negro/60"
                                                                                                            aria-label="Sumar unidad"
                                                                                                          >
                                                                                                            <Plus className="w-3 h-3" />
                                                                                                            <Plus className="w-3.5 h-3.5" />
                                                                                                          </button>
                                                                                                      </div>
                                                                                                      <button
                                                                                                        type="button"
                                                                                                        onClick={() => removeFromCart(item.id)}
                                                                                                        className="p-1 text-cirqa-negro/30 hover:text-cirqa-carmin transition-colors"
                                                                                                        className="p-1.5 text-cirqa-negro/40 hover:text-cirqa-carmin transition-colors"
                                                                                                        aria-label="Quitar producto"
                                                                                                      >
                                                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                                                        <Trash2 className="w-4 h-4" />
                                                                                                      </button>
                                                                                                    </div>
                                                                                                  )
                                                                                                }
                                                                  </div>
                                                                                      </div>
                                                                                    </div>
                                              ))}
                                                                                  </div>
                                          )}
                                                                                </div>
                                                                                {/* Teléfono y DNI */}
                                                                                < div className="grid grid-cols-1 sm:grid-cols-2 gap-4" >
                                                                                  <div>
                                                                                    <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1.5">
                                                                                      Teléfono Celular *
                                                                                    </label>
                                                                                    <input
                                                                                      type="tel"
                                                                                      name="phone"
                                                                                      inputMode="tel"
                                                                                      autoComplete="tel"
                                                                                      value={formData.phone}
                                                                                      onChange={handleChange}
                                                                                      placeholder="11 5555-5555"
                                                                                      className={getInputClasses(errors.phone)}
                                                                                    />
                                                                                    {errors.phone && (
                                                                                      <p className="text-[11px] text-cirqa-carmin font-medium mt-1">{errors.phone}</p>
                                                                                    )}
                                                                                  </div>
                                                                                  {/* Teléfono y DNI */}
                                                                                  < div className="grid grid-cols-1 sm:grid-cols-2 gap-4" >
                                                                                    <div>
                                                                                      <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1.5">
                                                                                        Teléfono Celular *
                                                                                      </label>
                                                                                      <input
                                                                                        type="tel"
                                                                                        name="phone"
                                                                                        inputMode="tel"
                                                                                        autoComplete="tel"
                                                                                        value={formData.phone}
                                                                                        onChange={handleChange}
                                                                                        placeholder="11 5555-5555"
                                                                                        className={getInputClasses(errors.phone)}
                                                                                      />
                                                                                      {errors.phone && (
                                                                                        <p className="text-[11px] text-cirqa-carmin font-medium mt-1">{errors.phone}</p>
                                                                                      )}
                                                                                    </div>
                                                                                    {/* Teléfono y DNI */}
                                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                                      <div>
                                                                                        <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1.5">
                                                                                          Teléfono Celular *
                                                                                        </label>
                                                                                        <input
                                                                                          type="tel"
                                                                                          name="phone"
                                                                                          inputMode="tel"
                                                                                          autoComplete="tel"
                                                                                          value={formData.phone}
                                                                                          onChange={handleChange}
                                                                                          placeholder="11 5555-5555"
                                                                                          className={getInputClasses(errors.phone)}
                                                                                        />
                                                                                        {errors.phone && (
                                                                                          <p className="text-[11px] text-cirqa-carmin font-medium mt-1">{errors.phone}</p>
                                                                                        )}
                                                                                      </div>

                                                                                      {/* ========================================================= */}
                                                                                      {/* 2. FORMULARIO COMPACTO DE ENTREGA                         */}
                                                                                      {/* 2. FORMULARIO COMPACTO DE ENTREGA (16px en mobile p/iOS)  */}
                                                                                      {/* ========================================================= */}
                                                                                      < form id="checkout-form" onSubmit={handleSubmitCheckout} className="space-y-4 pt-2 border-t border-cirqa-negro/10" >
                                                                                        <form
                                                                                          id="checkout-form"
                                                                                          ref={formRef}
                                                                                          noValidate
                                                                                          onSubmit={handleSubmitCheckout}
                                                                                          className="space-y-4 pt-2 border-t border-cirqa-negro/10"
                                                                                        >
                                                                                          <button type="submit" className="hidden" tabIndex={-1} aria-hidden="true" />
                                                                                          <div className="flex items-center gap-2">
                                                                                            <MapPin className="w-4 h-4 text-cirqa-primario" />
                                                                                            <span className="text-xs font-semibold uppercase tracking-wider text-cirqa-negro">
                                                                                              Datos de Entrega y Facturación
                                                                                            </span>
                                                                                          </div>
                                                                                          <div>
                                                                                            <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1.5">
                                                                                              DNI / CUIL (Facturación) *
                                                                                            </label>
                                                                                            <input
                                                                                              type="text"
                                                                                              name="dni"
                                                                                              inputMode="numeric"
                                                                                              value={formData.dni}
                                                                                              onChange={handleChange}
                                                                                              placeholder="ej. 38123456"
                                                                                              className={getInputClasses(errors.dni)}
                                                                                            />
                                                                                            {errors.dni && (
                                                                                              <p className="text-[11px] text-cirqa-carmin font-medium mt-1">{errors.dni}</p>
                                                                                            )}
                                                                                          </div>
                                                                                        </div>
                                                                                        <div>
                                                                                          <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1.5">
                                                                                            DNI / CUIL (Facturación) *
                                                                                          </label>
                                                                                          <input
                                                                                            type="text"
                                                                                            name="dni"
                                                                                            inputMode="numeric"
                                                                                            value={formData.dni}
                                                                                            onChange={handleChange}
                                                                                            placeholder="ej. 38123456"
                                                                                            className={getInputClasses(errors.dni)}
                                                                                          />
                                                                                          {errors.dni && (
                                                                                            <p className="text-[11px] text-cirqa-carmin font-medium mt-1">{errors.dni}</p>
                                                                                          )}
                                                                                        </div>
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
                                                                                          autoComplete="name"
                                                                                          value={formData.name}
                                                                                          onChange={handleChange}
                                                                                          placeholder="ej. Agustín Gómez"
                                                                                          className={`w-full px-3 py-2 rounded-xl border text-xs text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none transition-all ${errors.name ? 'border-cirqa-carmin' : 'border-cirqa-negro/15 focus:border-cirqa-primario'
                    className={`w-full px-3 py-2.5 sm:py-2 rounded-xl border text-base sm:text-xs text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none transition-all ${errors.name ? 'border-cirqa-carmin ring-1 ring-cirqa-carmin/30' : 'border-cirqa-negro/15 focus:border-cirqa-primario'
                                                                                            }`}
                                                                                        />
                                                                                        {errors.name && <p className="text-[10px] text-cirqa-carmin mt-1">{errors.name}</p>}
                                                                                        {errors.name && <p className="text-[11px] text-cirqa-carmin font-medium mt-1">{errors.name}</p>}
                                                                                      </div>
                                                                                      {/* Código Postal, Ciudad y Provincia */}
                                                                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                                                        <div>
                                                                                          <div className="flex items-center justify-between mb-1.5">
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
                                                                                            inputMode="numeric"
                                                                                            autoComplete="postal-code"
                                                                                            value={formData.zipCode}
                                                                                            onChange={handleZipCodeChange}
                                                                                            placeholder="ej. 1425"
                                                                                            className={getInputClasses(errors.zipCode)}
                                                                                          />
                                                                                          {errors.zipCode && (
                                                                                            <p className="text-[11px] text-cirqa-carmin font-medium mt-1">
                                                                                              {errors.zipCode}
                                                                                            </p>
                                                                                          )}
                                                                                        </div>
                                                                                        {/* Código Postal, Ciudad y Provincia */}
                                                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                                                          <div>
                                                                                            <div className="flex items-center justify-between mb-1.5">
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
                                                                                              inputMode="numeric"
                                                                                              autoComplete="postal-code"
                                                                                              value={formData.zipCode}
                                                                                              onChange={handleZipCodeChange}
                                                                                              placeholder="ej. 1425"
                                                                                              className={getInputClasses(errors.zipCode)}
                                                                                            />
                                                                                            {errors.zipCode && (
                                                                                              <p className="text-[11px] text-cirqa-carmin font-medium mt-1">
                                                                                                {errors.zipCode}
                                                                                              </p>
                                                                                            )}
                                                                                          </div>
                                                                                          {/* Código Postal, Ciudad y Provincia */}
                                                                                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                                                            <div>
                                                                                              <div className="flex items-center justify-between mb-1.5">
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
                                                                                                inputMode="numeric"
                                                                                                autoComplete="postal-code"
                                                                                                value={formData.zipCode}
                                                                                                onChange={handleZipCodeChange}
                                                                                                placeholder="ej. 1425"
                                                                                                className={getInputClasses(errors.zipCode)}
                                                                                              />
                                                                                              {errors.zipCode && (
                                                                                                <p className="text-[11px] text-cirqa-carmin font-medium mt-1">
                                                                                                  {errors.zipCode}
                                                                                                </p>
                                                                                              )}
                                                                                            </div>

                                                                                            <div>
                                                                                              <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1">
                                                                                                Email de Confirmación *
                                                                                              </label>
                                                                                              <input
                                                                                                type="email"
                                                                                                name="email"
                                                                                                inputMode="email"
                                                                                                autoComplete="email"
                                                                                                value={formData.email}
                                                                                                onChange={handleChange}
                                                                                                onBlur={() => {
                                                                                                  const cleanEmail = formData.email.trim().toLowerCase();
                                                                                                  if (cleanEmail !== formData.email) {
                                                                                                    setFormData((prev) => ({ ...prev, email: cleanEmail }));
                                                                                                  }
                                                                                                  if (
                                                                                                    cleanEmail &&
                                                                                                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) &&
                                                                                                    activeItems.length > 0
                                                                                                  ) {
                                                                                                    abandonedCartService
                                                                                                      .save({
                                                                                                        name: formData.name.trim(),
                                                                                                        email: cleanEmail,
                                                                                                        phone: formData.phone.trim(),
                                                                                                        items: activeItems,
                                                                                                        subtotal,
                                                                                                      })
                                                                                                      .catch(() => { });
                                                                                                    if (appliedCoupon) {
                                                                                                      couponService
                                                                                                        .validate({
                                                                                                          code: appliedCoupon.code,
                                                                                                          items: activeItems,
                                                                                                          subtotal,
                                                                                                          customerEmail: cleanEmail,
                                                                                                        })
                                                                                                        .then((res) => {
                                                                                                          if (!res.valid) {
                                                                                                            setAppliedCoupon(null);
                                                                                                            setCouponError(res.message || 'Este cupón no está disponible para este correo.');
                                                                                                          }
                                                                                                        })
                                                                                                        .catch((err) => {
                                                                                                          setAppliedCoupon(null);
                                                                                                          setCouponError(err.message || 'Este cupón no está disponible para este correo.');
                                                                                                        });
                                                                                                    }
                                                                                                  }
                                                                                                }}
                                                                                                placeholder="tu@email.com"
                                                                                                className={`w-full px-3 py-2 rounded-xl border text-xs text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none transition-all ${errors.email ? 'border-cirqa-carmin' : 'border-cirqa-negro/15 focus:border-cirqa-primario'
                    className={`w-full px-3 py-2.5 sm:py-2 rounded-xl border text-base sm:text-xs text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none transition-all ${errors.email ? 'border-cirqa-carmin ring-1 ring-cirqa-carmin/30' : 'border-cirqa-negro/15 focus:border-cirqa-primario'
                                                                                                  }`}
                                                                                              />
                                                                                              {errors.email && <p className="text-[10px] text-cirqa-carmin mt-1">{errors.email}</p>}
                                                                                              {errors.email && <p className="text-[11px] text-cirqa-carmin font-medium mt-1">{errors.email}</p>}
                                                                                            </div>
                                                                                          </div>
                                                                                          <div>
                                                                                            <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1.5">
                                                                                              Ciudad / Localidad *
                                                                                            </label>
                                                                                            <input
                                                                                              type="text"
                                                                                              name="city"
                                                                                              autoComplete="address-level2"
                                                                                              value={formData.city}
                                                                                              onChange={handleChange}
                                                                                              placeholder="ej. Palermo / CABA"
                                                                                              className={getInputClasses(errors.city)}
                                                                                            />
                                                                                            {errors.city && (
                                                                                              <p className="text-[11px] text-cirqa-carmin font-medium mt-1">{errors.city}</p>
                                                                                            )}
                                                                                          </div>
                                                                                          <div>
                                                                                            <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1.5">
                                                                                              Ciudad / Localidad *
                                                                                            </label>
                                                                                            <input
                                                                                              type="text"
                                                                                              name="city"
                                                                                              autoComplete="address-level2"
                                                                                              value={formData.city}
                                                                                              onChange={handleChange}
                                                                                              placeholder="ej. Palermo / CABA"
                                                                                              className={getInputClasses(errors.city)}
                                                                                            />
                                                                                            {errors.city && (
                                                                                              <p className="text-[11px] text-cirqa-carmin font-medium mt-1">{errors.city}</p>
                                                                                            )}
                                                                                          </div>
                                                                                          <div>
                                                                                            <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1.5">
                                                                                              Ciudad / Localidad *
                                                                                            </label>
                                                                                            <input
                                                                                              type="text"
                                                                                              name="city"
                                                                                              autoComplete="address-level2"
                                                                                              value={formData.city}
                                                                                              onChange={handleChange}
                                                                                              placeholder="ej. Palermo / CABA"
                                                                                              className={getInputClasses(errors.city)}
                                                                                            />
                                                                                            {errors.city && (
                                                                                              <p className="text-[11px] text-cirqa-carmin font-medium mt-1">{errors.city}</p>
                                                                                            )}
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
                                                                                                inputMode="tel"
                                                                                                autoComplete="tel"
                                                                                                value={formData.phone}
                                                                                                onChange={handleChange}
                                                                                                placeholder="11 5555-5555"
                                                                                                className={`w-full px-3 py-2 rounded-xl border text-xs text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none transition-all ${errors.phone ? 'border-cirqa-carmin' : 'border-cirqa-negro/15 focus:border-cirqa-primario'
                    className={`w-full px-3 py-2.5 sm:py-2 rounded-xl border text-base sm:text-xs text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none transition-all ${errors.phone ? 'border-cirqa-carmin ring-1 ring-cirqa-carmin/30' : 'border-cirqa-negro/15 focus:border-cirqa-primario'
                                                                                                  }`}
                                                                                              />
                                                                                              {errors.phone && <p className="text-[10px] text-cirqa-carmin mt-1">{errors.phone}</p>}
                                                                                              {errors.phone && <p className="text-[11px] text-cirqa-carmin font-medium mt-1">{errors.phone}</p>}
                                                                                            </div>
                                                                                            <div>
                                                                                              <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1.5">
                                                                                                Provincia *
                                                                                              </label>
                                                                                              <select
                                                                                                name="province"
                                                                                                value={formData.province}
                                                                                                onChange={handleChange}
                                                                                                className={getInputClasses(false)}
                                                                                              >
                                                                                                {PROVINCIAS_ARG.map((p) => (
                                                                                                  <option key={p} value={p}>
                                                                                                    {p}
                                                                                                  </option>
                                                                                                ))}
                                                                                              </select>
                                                                                            </div>
                                                                                          </div>
                                                                                          <div>
                                                                                            <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1.5">
                                                                                              Provincia *
                                                                                            </label>
                                                                                            <select
                                                                                              name="province"
                                                                                              value={formData.province}
                                                                                              onChange={handleChange}
                                                                                              className={getInputClasses(false)}
                                                                                            >
                                                                                              {PROVINCIAS_ARG.map((p) => (
                                                                                                <option key={p} value={p}>
                                                                                                  {p}
                                                                                                </option>
                                                                                              ))}
                                                                                            </select>
                                                                                          </div>
                                                                                        </div>
                                                                                        <div>
                                                                                          <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1.5">
                                                                                            Provincia *
                                                                                          </label>
                                                                                          <select
                                                                                            name="province"
                                                                                            value={formData.province}
                                                                                            onChange={handleChange}
                                                                                            className={getInputClasses(false)}
                                                                                          >
                                                                                            {PROVINCIAS_ARG.map((p) => (
                                                                                              <option key={p} value={p}>
                                                                                                {p}
                                                                                              </option>
                                                                                            ))}
                                                                                          </select>
                                                                                        </div>
                                                                                      </div>

                                                                                      <div>
                                                                                        <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1">
                                                                                          DNI / CUIL (Facturación) *
                                                                                        </label>
                                                                                        <input
                                                                                          type="text"
                                                                                          name="dni"
                                                                                          inputMode="numeric"
                                                                                          value={formData.dni}
                                                                                          onChange={handleChange}
                                                                                          placeholder="ej. 38123456"
                                                                                          className={`w-full px-3 py-2 rounded-xl border text-xs text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none transition-all ${errors.dni ? 'border-cirqa-carmin' : 'border-cirqa-negro/15 focus:border-cirqa-primario'
                    className={`w-full px-3 py-2.5 sm:py-2 rounded-xl border text-base sm:text-xs text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none transition-all ${errors.dni ? 'border-cirqa-carmin ring-1 ring-cirqa-carmin/30' : 'border-cirqa-negro/15 focus:border-cirqa-primario'
                                                                                            }`}
                                                                                        />
                                                                                        {errors.dni && <p className="text-[10px] text-cirqa-carmin mt-1">{errors.dni}</p>}
                                                                                        {errors.dni && <p className="text-[11px] text-cirqa-carmin font-medium mt-1">{errors.dni}</p>}
                                                                                      </div>
                                                                                    </div>
                                                                                    {/* Dirección de Entrega */}
                                                                                    <div className="grid grid-cols-12 gap-4">
                                                                                      <div className="col-span-8 sm:col-span-9">
                                                                                        <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1.5">
                                                                                          Calle / Avenida *
                                                                                        </label>
                                                                                        <input
                                                                                          type="text"
                                                                                          name="street"
                                                                                          autoComplete="address-line1"
                                                                                          value={formData.street}
                                                                                          onChange={handleChange}
                                                                                          placeholder="ej. Av. del Libertador"
                                                                                          className={getInputClasses(errors.street)}
                                                                                        />
                                                                                        {errors.street && (
                                                                                          <p className="text-[11px] text-cirqa-carmin font-medium mt-1">
                                                                                            {errors.street}
                                                                                          </p>
                                                                                        )}
                                                                                      </div>
                                                                                      {/* Dirección de Entrega */}
                                                                                      <div className="grid grid-cols-12 gap-4">
                                                                                        <div className="col-span-8 sm:col-span-9">
                                                                                          <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1.5">
                                                                                            Calle / Avenida *
                                                                                          </label>
                                                                                          <input
                                                                                            type="text"
                                                                                            name="street"
                                                                                            autoComplete="address-line1"
                                                                                            value={formData.street}
                                                                                            onChange={handleChange}
                                                                                            placeholder="ej. Av. del Libertador"
                                                                                            className={getInputClasses(errors.street)}
                                                                                          />
                                                                                          {errors.street && (
                                                                                            <p className="text-[11px] text-cirqa-carmin font-medium mt-1">
                                                                                              {errors.street}
                                                                                            </p>
                                                                                          )}
                                                                                        </div>
                                                                                        {/* Dirección de Entrega */}
                                                                                        <div className="grid grid-cols-12 gap-4">
                                                                                          <div className="col-span-8 sm:col-span-9">
                                                                                            <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1.5">
                                                                                              Calle / Avenida *
                                                                                            </label>
                                                                                            <input
                                                                                              type="text"
                                                                                              name="street"
                                                                                              autoComplete="address-line1"
                                                                                              value={formData.street}
                                                                                              onChange={handleChange}
                                                                                              placeholder="ej. Av. del Libertador"
                                                                                              className={getInputClasses(errors.street)}
                                                                                            />
                                                                                            {errors.street && (
                                                                                              <p className="text-[11px] text-cirqa-carmin font-medium mt-1">
                                                                                                {errors.street}
                                                                                              </p>
                                                                                            )}
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
                                                                                                inputMode="numeric"
                                                                                                autoComplete="postal-code"
                                                                                                value={formData.zipCode}
                                                                                                onChange={handleZipCodeChange}
                                                                                                placeholder="ej. 1425"
                                                                                                className={`w-full px-3 py-2 rounded-xl border text-xs text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none transition-all ${errors.zipCode ? 'border-cirqa-carmin' : 'border-cirqa-negro/15 focus:border-cirqa-primario'
                    className={`w-full px-3 py-2.5 sm:py-2 rounded-xl border text-base sm:text-xs text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none transition-all ${errors.zipCode ? 'border-cirqa-carmin ring-1 ring-cirqa-carmin/30' : 'border-cirqa-negro/15 focus:border-cirqa-primario'
                                                                                                  }`}
                                                                                              />
                                                                                              {errors.zipCode && <p className="text-[10px] text-cirqa-carmin mt-1">{errors.zipCode}</p>}
                                                                                              {errors.zipCode && <p className="text-[11px] text-cirqa-carmin font-medium mt-1">{errors.zipCode}</p>}
                                                                                            </div>
                                                                                            <div className="col-span-4 sm:col-span-3">
                                                                                              <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1.5">
                                                                                                Altura / Nº *
                                                                                              </label>
                                                                                              <input
                                                                                                type="text"
                                                                                                name="number"
                                                                                                inputMode="numeric"
                                                                                                value={formData.number}
                                                                                                onChange={handleChange}
                                                                                                placeholder="2450"
                                                                                                className={getInputClasses(errors.number)}
                                                                                              />
                                                                                              {errors.number && (
                                                                                                <p className="text-[11px] text-cirqa-carmin font-medium mt-1">
                                                                                                  {errors.number}
                                                                                                </p>
                                                                                              )}
                                                                                            </div>
                                                                                          </div>
                                                                                          <div className="col-span-4 sm:col-span-3">
                                                                                            <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1.5">
                                                                                              Altura / Nº *
                                                                                            </label>
                                                                                            <input
                                                                                              type="text"
                                                                                              name="number"
                                                                                              inputMode="numeric"
                                                                                              value={formData.number}
                                                                                              onChange={handleChange}
                                                                                              placeholder="2450"
                                                                                              className={getInputClasses(errors.number)}
                                                                                            />
                                                                                            {errors.number && (
                                                                                              <p className="text-[11px] text-cirqa-carmin font-medium mt-1">
                                                                                                {errors.number}
                                                                                              </p>
                                                                                            )}
                                                                                          </div>
                                                                                        </div>
                                                                                        <div className="col-span-4 sm:col-span-3">
                                                                                          <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1.5">
                                                                                            Altura / Nº *
                                                                                          </label>
                                                                                          <input
                                                                                            type="text"
                                                                                            name="number"
                                                                                            inputMode="numeric"
                                                                                            value={formData.number}
                                                                                            onChange={handleChange}
                                                                                            placeholder="2450"
                                                                                            className={getInputClasses(errors.number)}
                                                                                          />
                                                                                          {errors.number && (
                                                                                            <p className="text-[11px] text-cirqa-carmin font-medium mt-1">
                                                                                              {errors.number}
                                                                                            </p>
                                                                                          )}
                                                                                        </div>
                                                                                      </div>

                                                                                      <div>
                                                                                        <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1">
                                                                                          Ciudad / Localidad *
                                                                                        </label>
                                                                                        <input
                                                                                          type="text"
                                                                                          name="city"
                                                                                          autoComplete="address-level2"
                                                                                          value={formData.city}
                                                                                          onChange={handleChange}
                                                                                          placeholder="ej. Palermo / CABA"
                                                                                          className={`w-full px-3 py-2 rounded-xl border text-xs text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none transition-all ${errors.city ? 'border-cirqa-carmin' : 'border-cirqa-negro/15 focus:border-cirqa-primario'
                    className={`w-full px-3 py-2.5 sm:py-2 rounded-xl border text-base sm:text-xs text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none transition-all ${errors.city ? 'border-cirqa-carmin ring-1 ring-cirqa-carmin/30' : 'border-cirqa-negro/15 focus:border-cirqa-primario'
                                                                                            }`}
                                                                                        />
                                                                                        {errors.city && <p className="text-[10px] text-cirqa-carmin mt-1">{errors.city}</p>}
                                                                                        {errors.city && <p className="text-[11px] text-cirqa-carmin font-medium mt-1">{errors.city}</p>}
                                                                                      </div>
                                                                                      {/* Piso y Departamento */}
                                                                                      <div className="grid grid-cols-2 gap-4">
                                                                                        <div>
                                                                                          <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1.5">
                                                                                            Piso (Opcional)
                                                                                          </label>
                                                                                          <input
                                                                                            type="text"
                                                                                            name="floor"
                                                                                            value={formData.floor}
                                                                                            onChange={handleChange}
                                                                                            placeholder="4"
                                                                                            className={getInputClasses(false)}
                                                                                          />
                                                                                        </div>
                                                                                        <div>
                                                                                          <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1.5">
                                                                                            Depto (Opcional)
                                                                                          </label>
                                                                                          <input
                                                                                            type="text"
                                                                                            name="apartment"
                                                                                            value={formData.apartment}
                                                                                            onChange={handleChange}
                                                                                            placeholder="B"
                                                                                            className={getInputClasses(false)}
                                                                                          />
                                                                                        </div>
                                                                                      </div>
                                                                                      {/* Piso y Departamento */}
                                                                                      <div className="grid grid-cols-2 gap-4">
                                                                                        <div>
                                                                                          <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1.5">
                                                                                            Piso (Opcional)
                                                                                          </label>
                                                                                          <input
                                                                                            type="text"
                                                                                            name="floor"
                                                                                            value={formData.floor}
                                                                                            onChange={handleChange}
                                                                                            placeholder="4"
                                                                                            className={getInputClasses(false)}
                                                                                          />
                                                                                        </div>
                                                                                        <div>
                                                                                          <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1.5">
                                                                                            Depto (Opcional)
                                                                                          </label>
                                                                                          <input
                                                                                            type="text"
                                                                                            name="apartment"
                                                                                            value={formData.apartment}
                                                                                            onChange={handleChange}
                                                                                            placeholder="B"
                                                                                            className={getInputClasses(false)}
                                                                                          />
                                                                                        </div>
                                                                                      </div>
                                                                                      {/* Piso y Departamento */}
                                                                                      <div className="grid grid-cols-2 gap-4">
                                                                                        <div>
                                                                                          <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1.5">
                                                                                            Piso (Opcional)
                                                                                          </label>
                                                                                          <input
                                                                                            type="text"
                                                                                            name="floor"
                                                                                            value={formData.floor}
                                                                                            onChange={handleChange}
                                                                                            placeholder="4"
                                                                                            className={getInputClasses(false)}
                                                                                          />
                                                                                        </div>
                                                                                        <div>
                                                                                          <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1.5">
                                                                                            Depto (Opcional)
                                                                                          </label>
                                                                                          <input
                                                                                            type="text"
                                                                                            name="apartment"
                                                                                            value={formData.apartment}
                                                                                            onChange={handleChange}
                                                                                            placeholder="B"
                                                                                            className={getInputClasses(false)}
                                                                                          />
                                                                                        </div>
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
                                                                                          className="w-full px-3 py-2.5 sm:py-2 rounded-xl border border-cirqa-negro/15 text-base sm:text-xs text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none focus:border-cirqa-primario"
                                                                                        >
                                                                                          {PROVINCIAS_ARG.map((p) => (
                                                                                            <option key={p} value={p}>
                                                                                              {p}
                                                                                            </option>
                                                                                          ))}
                                                                                        </select>
                                                                                      </div>
                                                                                    </div>
                                                                                    {/* ========================================================= */}
                                                                                    {/* SELECTOR DINÁMICO DE ENVÍO CABA / NACIONAL                */}
                                                                                    {/* ========================================================= */}
                                                                                    <div className="space-y-2.5 pt-3 border-t border-cirqa-negro/10">
                                                                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                                                                        <div className="flex items-center gap-1.5">
                                                                                          <Truck className="w-4 h-4 text-cirqa-primario" />
                                                                                          <span className="text-xs font-semibold uppercase tracking-wider text-cirqa-negro">
                                                                                            Opciones de Envío & Logística
                                                                                          </span>
                                                                                        </div>
                                                                                        {selectedShippingOption && (
                                                                                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border text-emerald-700 bg-emerald-50 border-emerald-300 font-bold">
                                                                                            Envío 100% Bonificado
                                                                                          </span>
                                                                                        )}
                                                                                      </div>
                                                                                      {/* ========================================================= */}
                                                                                      {/* SELECTOR DINÁMICO DE ENVÍO CABA / NACIONAL                */}
                                                                                      {/* ========================================================= */}
                                                                                      <div className="space-y-2.5 pt-3 border-t border-cirqa-negro/10">
                                                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                                                          <div className="flex items-center gap-1.5">
                                                                                            <Truck className="w-4 h-4 text-cirqa-primario" />
                                                                                            <span className="text-xs font-semibold uppercase tracking-wider text-cirqa-negro">
                                                                                              Opciones de Envío & Logística
                                                                                            </span>
                                                                                          </div>
                                                                                          {selectedShippingOption && (
                                                                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border text-emerald-700 bg-emerald-50 border-emerald-300 font-bold">
                                                                                              Envío 100% Bonificado
                                                                                            </span>
                                                                                          )}
                                                                                        </div>
                                                                                        {/* ========================================================= */}
                                                                                        {/* SELECTOR DINÁMICO DE ENVÍO CABA / NACIONAL                */}
                                                                                        {/* ========================================================= */}
                                                                                        <div className="space-y-2.5 pt-3 border-t border-cirqa-negro/10">
                                                                                          <div className="flex flex-wrap items-center justify-between gap-2">
                                                                                            <div className="flex items-center gap-1.5">
                                                                                              <Truck className="w-4 h-4 text-cirqa-primario" />
                                                                                              <span className="text-xs font-semibold uppercase tracking-wider text-cirqa-negro">
                                                                                                Opciones de Envío & Logística
                                                                                              </span>
                                                                                            </div>
                                                                                            {selectedShippingOption && (
                                                                                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border text-emerald-700 bg-emerald-50 border-emerald-300 font-bold">
                                                                                                Envío 100% Bonificado
                                                                                              </span>
                                                                                            )}
                                                                                          </div>

                                                                                          {/* Dirección de Entrega */}
                                                                                          <div className="grid grid-cols-12 gap-2">
                                                                                            <div className="grid grid-cols-12 gap-2.5">
                                                                                              <div className="col-span-8 sm:col-span-9">
                                                                                                <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1">
                                                                                                  Calle / Avenida *
                                                                                                </label>
                                                                                                <input
                                                                                                  type="text"
                                                                                                  name="street"
                                                                                                  autoComplete="address-line1"
                                                                                                  value={formData.street}
                                                                                                  onChange={handleChange}
                                                                                                  placeholder="ej. Av. del Libertador"
                                                                                                  className={`w-full px-3 py-2 rounded-xl border text-xs text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none transition-all ${errors.street ? 'border-cirqa-carmin' : 'border-cirqa-negro/15 focus:border-cirqa-primario'
                    className={`w-full px-3 py-2.5 sm:py-2 rounded-xl border text-base sm:text-xs text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none transition-all ${errors.street ? 'border-cirqa-carmin ring-1 ring-cirqa-carmin/30' : 'border-cirqa-negro/15 focus:border-cirqa-primario'
                                                                                                    }`}
                                                                                                />
                                                                                                {errors.street && <p className="text-[10px] text-cirqa-carmin mt-1">{errors.street}</p>}
                                                                                                {errors.street && <p className="text-[11px] text-cirqa-carmin font-medium mt-1">{errors.street}</p>}
                                                                                              </div>
                                                                                              {!formData.zipCode.trim() ? (
                                                                                                <div className="p-3.5 rounded-2xl bg-[#FBFBFA] border border-dashed border-cirqa-negro/15 text-xs text-cirqa-negro/60 flex items-center gap-2.5">
                                                                                                  <MapPin className="w-4 h-4 text-cirqa-negro/40 flex-shrink-0" />
                                                                                                  <p className="text-[11px] font-light">
                                                                                                    Ingresá tu <strong>Código Postal</strong> para activar el{' '}
                                                                                                    <strong>Envío Gratis a todo el país</strong> y calcular tiempos estimados.
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
                                                                                                        className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${isSelected
                                                                                                          ? 'border-cirqa-primario bg-cirqa-primario/5 ring-1 ring-cirqa-primario shadow-2xs'
                                                                                                          : 'border-cirqa-negro/15 hover:border-cirqa-negro/30 bg-[#FBFBFA]'
                                                                                                          }`}
                                                                                                      >
                                                                                                        <div className="flex items-start gap-3 min-w-0">
                                                                                                          <div
                                                                                                            className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center flex-shrink-0 ${isSelected
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
                                                                                                                {opt.carrier || 'Correo Certificado'}
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
                                                                                                  No se encontraron opciones para el CP ingresado. Verificá los 4 dígitos.
                                                                                                </div>
                                                                                              )}
                                                                                              {!formData.zipCode.trim() ? (
                                                                                                <div className="p-3.5 rounded-2xl bg-[#FBFBFA] border border-dashed border-cirqa-negro/15 text-xs text-cirqa-negro/60 flex items-center gap-2.5">
                                                                                                  <MapPin className="w-4 h-4 text-cirqa-negro/40 flex-shrink-0" />
                                                                                                  <p className="text-[11px] font-light">
                                                                                                    Ingresá tu <strong>Código Postal</strong> para activar el{' '}
                                                                                                    <strong>Envío Gratis a todo el país</strong> y calcular tiempos estimados.
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
                                                                                                        className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${isSelected
                                                                                                          ? 'border-cirqa-primario bg-cirqa-primario/5 ring-1 ring-cirqa-primario shadow-2xs'
                                                                                                          : 'border-cirqa-negro/15 hover:border-cirqa-negro/30 bg-[#FBFBFA]'
                                                                                                          }`}
                                                                                                      >
                                                                                                        <div className="flex items-start gap-3 min-w-0">
                                                                                                          <div
                                                                                                            className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center flex-shrink-0 ${isSelected
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
                                                                                                                {opt.carrier || 'Correo Certificado'}
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
                                                                                                  No se encontraron opciones para el CP ingresado. Verificá los 4 dígitos.
                                                                                                </div>
                                                                                              )}
                                                                                              {!formData.zipCode.trim() ? (
                                                                                                <div className="p-3.5 rounded-2xl bg-[#FBFBFA] border border-dashed border-cirqa-negro/15 text-xs text-cirqa-negro/60 flex items-center gap-2.5">
                                                                                                  <MapPin className="w-4 h-4 text-cirqa-negro/40 flex-shrink-0" />
                                                                                                  <p className="text-[11px] font-light">
                                                                                                    Ingresá tu <strong>Código Postal</strong> para activar el{' '}
                                                                                                    <strong>Envío Gratis a todo el país</strong> y calcular tiempos estimados.
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
                                                                                                        className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${isSelected
                                                                                                            ? 'border-cirqa-primario bg-cirqa-primario/5 ring-1 ring-cirqa-primario shadow-2xs'
                                                                                                            : 'border-cirqa-negro/15 hover:border-cirqa-negro/30 bg-[#FBFBFA]'
                                                                                                          }`}
                                                                                                      >
                                                                                                        <div className="flex items-start gap-3 min-w-0">
                                                                                                          <div
                                                                                                            className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center flex-shrink-0 ${isSelected
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
                                                                                                                {opt.carrier || 'Correo Certificado'}
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
                                                                                                  No se encontraron opciones para el CP ingresado. Verificá los 4 dígitos.
                                                                                                </div>
                                                                                              )}

                                                                                              <div className="col-span-4 sm:col-span-3">
                                                                                                <label className="block text-[11px] font-medium text-cirqa-negro/70 mb-1">
                                                                                                  Altura / Nº *
                                                                                                </label>
                                                                                                <input
                                                                                                  type="text"
                                                                                                  name="number"
                                                                                                  inputMode="numeric"
                                                                                                  value={formData.number}
                                                                                                  onChange={handleChange}
                                                                                                  placeholder="2450"
                                                                                                  className={`w-full px-3 py-2 rounded-xl border text-xs text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none transition-all ${errors.number ? 'border-cirqa-carmin' : 'border-cirqa-negro/15 focus:border-cirqa-primario'
                    className={`w-full px-3 py-2.5 sm:py-2 rounded-xl border text-base sm:text-xs text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none transition-all ${errors.number ? 'border-cirqa-carmin ring-1 ring-cirqa-carmin/30' : 'border-cirqa-negro/15 focus:border-cirqa-primario'
                                                                                                    }`}
                                                                                                />
                                                                                                {errors.number && <p className="text-[10px] text-cirqa-carmin mt-1">{errors.number}</p>}
                                                                                                {errors.number && <p className="text-[11px] text-cirqa-carmin font-medium mt-1">{errors.number}</p>}
                                                                                              </div>
                                                                                            </div>
                                                                                            {shippingError && (
                                                                                              <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200">
                                                                                                {shippingError}
                                                                                              </p>
                                                                                            )}
                                                                                          </div>
                                                                                        </form>
                                                                                        {shippingError && (
                                                                                          <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200">
                                                                                            {shippingError}
                                                                                          </p>
                                                                                        )}
                                                                                      </div>
                                                                                    </form>
                                                                                    {shippingError && (
                                                                                      <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200">
                                                                                        {shippingError}
                                                                                      </p>
                                                                                    )}
                                                                                  </div>
                                                                              </form>

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
                                                                                    className="w-full px-3 py-2.5 sm:py-2 rounded-xl border border-cirqa-negro/15 text-base sm:text-xs text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none focus:border-cirqa-primario"
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
                                                                                    className="w-full px-3 py-2.5 sm:py-2 rounded-xl border border-cirqa-negro/15 text-base sm:text-xs text-cirqa-negro bg-[#FBFBFA] focus:bg-white focus:outline-none focus:border-cirqa-primario"
                                                                                  />
                                                                                </div>
                                                                              </div>
                                                                              {/* ========================================================= */}
                                                                              {/* 3. SELECTOR DUAL DE MEDIOS DE PAGO                        */}
                                                                              {/* ========================================================= */}
                                                                              <div className="space-y-3 pt-3 border-t border-cirqa-negro/10">
                                                                                <span className="text-[11px] font-semibold uppercase tracking-wider text-cirqa-negro/60 block">
                                                                                  Seleccioná el Método de Pago
                                                                                </span>
                                                                                {/* ========================================================= */}
                                                                                {/* 3. SELECTOR DUAL DE MEDIOS DE PAGO                        */}
                                                                                {/* ========================================================= */}
                                                                                <div className="space-y-3 pt-3 border-t border-cirqa-negro/10">
                                                                                  <span className="text-[11px] font-semibold uppercase tracking-wider text-cirqa-negro/60 block">
                                                                                    Seleccioná el Método de Pago
                                                                                  </span>
                                                                                  {/* ========================================================= */}
                                                                                  {/* 3. SELECTOR DUAL DE MEDIOS DE PAGO                        */}
                                                                                  {/* ========================================================= */}
                                                                                  <div className="space-y-3 pt-3 border-t border-cirqa-negro/10">
                                                                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-cirqa-negro/60 block">
                                                                                      Seleccioná el Método de Pago
                                                                                    </span>

                                                                                    {/* ========================================================= */}
                                                                                    {/* SELECTOR DINÁMICO DE ENVÍO CABA / NACIONAL               */}
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
                                                                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                                        {/* Opción A: Mercado Pago */}
                                                                                        <button
                                                                                          type="button"
                                                                                          onClick={() => setPaymentMethod('mercadopago')}
                                                                                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-2.5 ${paymentMethod === 'mercadopago'
                                                                                            ? 'border-[#009EE3] bg-[#009EE3]/5 ring-1 ring-[#009EE3]'
                                                                                            : 'border-cirqa-negro/15 hover:border-cirqa-negro/30 bg-[#FBFBFA]'
                                                                                            }`}
                                                                                        >
                                                                                          <div className="flex items-center justify-between w-full">
                                                                                            <div className="flex items-center gap-2">
                                                                                              <div className="w-7 h-7 rounded-lg bg-[#009EE3] flex items-center justify-center text-white">
                                                                                                <CreditCard className="w-4 h-4" />
                                                                                              </div>
                                                                                              <span className="text-xs font-bold text-cirqa-negro">Mercado Pago</span>
                                                                                            </div>
                                                                                            <div
                                                                                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'mercadopago'
                                                                                                ? 'border-[#009EE3] bg-[#009EE3]'
                                                                                                : 'border-cirqa-negro/30'
                                                                                                }`}
                                                                                            >
                                                                                              {paymentMethod === 'mercadopago' && (
                                                                                                <Check className="w-2.5 h-2.5 text-white" />
                                                                                              )}
                                                                                            </div>
                                                                                          </div>
                                                                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                                            {/* Opción A: Mercado Pago */}
                                                                                            <button
                                                                                              type="button"
                                                                                              onClick={() => setPaymentMethod('mercadopago')}
                                                                                              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-2.5 ${paymentMethod === 'mercadopago'
                                                                                                ? 'border-[#009EE3] bg-[#009EE3]/5 ring-1 ring-[#009EE3]'
                                                                                                : 'border-cirqa-negro/15 hover:border-cirqa-negro/30 bg-[#FBFBFA]'
                                                                                                }`}
                                                                                            >
                                                                                              <div className="flex items-center justify-between w-full">
                                                                                                <div className="flex items-center gap-2">
                                                                                                  <div className="w-7 h-7 rounded-lg bg-[#009EE3] flex items-center justify-center text-white">
                                                                                                    <CreditCard className="w-4 h-4" />
                                                                                                  </div>
                                                                                                  <span className="text-xs font-bold text-cirqa-negro">Mercado Pago</span>
                                                                                                </div>
                                                                                                <div
                                                                                                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'mercadopago'
                                                                                                    ? 'border-[#009EE3] bg-[#009EE3]'
                                                                                                    : 'border-cirqa-negro/30'
                                                                                                    }`}
                                                                                                >
                                                                                                  {paymentMethod === 'mercadopago' && (
                                                                                                    <Check className="w-2.5 h-2.5 text-white" />
                                                                                                  )}
                                                                                                </div>
                                                                                              </div>
                                                                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                                                {/* Opción A: Mercado Pago */}
                                                                                                <button
                                                                                                  type="button"
                                                                                                  onClick={() => setPaymentMethod('mercadopago')}
                                                                                                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-2.5 ${paymentMethod === 'mercadopago'
                                                                                                      ? 'border-[#009EE3] bg-[#009EE3]/5 ring-1 ring-[#009EE3]'
                                                                                                      : 'border-cirqa-negro/15 hover:border-cirqa-negro/30 bg-[#FBFBFA]'
                                                                                                    }`}
                                                                                                >
                                                                                                  <div className="flex items-center justify-between w-full">
                                                                                                    <div className="flex items-center gap-2">
                                                                                                      <div className="w-7 h-7 rounded-lg bg-[#009EE3] flex items-center justify-center text-white">
                                                                                                        <CreditCard className="w-4 h-4" />
                                                                                                      </div>
                                                                                                      <span className="text-xs font-bold text-cirqa-negro">Mercado Pago</span>
                                                                                                    </div>
                                                                                                    <div
                                                                                                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'mercadopago'
                                                                                                          ? 'border-[#009EE3] bg-[#009EE3]'
                                                                                                          : 'border-cirqa-negro/30'
                                                                                                        }`}
                                                                                                    >
                                                                                                      {paymentMethod === 'mercadopago' && (
                                                                                                        <Check className="w-2.5 h-2.5 text-white" />
                                                                                                      )}
                                                                                                    </div>
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
                                                                                                            className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${isSelected
                                                                                                              ? 'border-cirqa-primario bg-cirqa-primario/5 ring-1 ring-cirqa-primario shadow-2xs'
                                                                                                              : 'border-cirqa-negro/15 hover:border-cirqa-negro/30 bg-[#FBFBFA]'
                                                                                                              }`}
                                                                                                          >
                                                                                                            <div className="flex items-start gap-3 min-w-0">
                                                                                                              <div
                                                                                                                className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center flex-shrink-0 ${isSelected
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
                                                                                                                    {opt.carrier || 'Correo Certificado'}
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
                                                                                                  <div className="space-y-1.5">
                                                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#009EE3] text-white shadow-2xs">
                                                                                                      <Sparkles className="w-2.5 h-2.5" />
                                                                                                      6 CUOTAS SIN INTERÉS
                                                                                                    </span>
                                                                                                    <p className="text-[11px] font-semibold text-[#007EB5] leading-snug">
                                                                                                      Hasta 6 cuotas sin interés de $
                                                                                                      {Math.round(total / 6).toLocaleString('es-AR')} con todas las tarjetas
                                                                                                    </p>
                                                                                                    <span className="text-[10px] font-mono text-cirqa-negro/50 block">
                                                                                                      Tarjetas de crédito, débito o dinero en cuenta
                                                                                                    </span>
                                                                                                  </div>
                                                                                                </button>
                                                                                                <div className="space-y-1.5">
                                                                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#009EE3] text-white shadow-2xs">
                                                                                                    <Sparkles className="w-2.5 h-2.5" />
                                                                                                    6 CUOTAS SIN INTERÉS
                                                                                                  </span>
                                                                                                  <p className="text-[11px] font-semibold text-[#007EB5] leading-snug">
                                                                                                    Hasta 6 cuotas sin interés de $
                                                                                                    {Math.round(total / 6).toLocaleString('es-AR')} con todas las tarjetas
                                                                                                  </p>
                                                                                                  <span className="text-[10px] font-mono text-cirqa-negro/50 block">
                                                                                                    Tarjetas de crédito, débito o dinero en cuenta
                                                                                                  </span>
                                                                                                </div>
                                                                                            </button>
                                                                                            <div className="space-y-1.5">
                                                                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#009EE3] text-white shadow-2xs">
                                                                                                <Sparkles className="w-2.5 h-2.5" />
                                                                                                6 CUOTAS SIN INTERÉS
                                                                                              </span>
                                                                                              <p className="text-[11px] font-semibold text-[#007EB5] leading-snug">
                                                                                                Hasta 6 cuotas sin interés de $
                                                                                                {Math.round(total / 6).toLocaleString('es-AR')} con todas las tarjetas
                                                                                              </p>
                                                                                              <span className="text-[10px] font-mono text-cirqa-negro/50 block">
                                                                                                Tarjetas de crédito, débito o dinero en cuenta
                                                                                              </span>
                                                                                            </div>
                                                                                        </button>

                                                                                        {shippingError && (
                                                                                          <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200">
                                                                                            {shippingError}
                                                                                          </p>
                                                                                        )}
                                                                                      </div>
                                                                                    </form>
                                                                                    {/* Opción B: Transferencia Bancaria */}
                                                                                    <button
                                                                                      type="button"
                                                                                      onClick={() => setPaymentMethod('transfer')}
                                                                                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-2.5 ${paymentMethod === 'transfer'
                                                                                        ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600'
                                                                                        : 'border-cirqa-negro/15 hover:border-cirqa-negro/30 bg-[#FBFBFA]'
                                                                                        }`}
                                                                                    >
                                                                                      <div className="flex items-center justify-between w-full">
                                                                                        <div className="flex items-center gap-2">
                                                                                          <div className="w-7 h-7 rounded-lg bg-emerald-700 flex items-center justify-center text-white">
                                                                                            <Building2 className="w-4 h-4" />
                                                                                          </div>
                                                                                          <span className="text-xs font-bold text-cirqa-negro">Transferencia</span>
                                                                                        </div>
                                                                                        <div
                                                                                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'transfer'
                                                                                            ? 'border-emerald-600 bg-emerald-600'
                                                                                            : 'border-cirqa-negro/30'
                                                                                            }`}
                                                                                        >
                                                                                          {paymentMethod === 'transfer' && (
                                                                                            <Check className="w-2.5 h-2.5 text-white" />
                                                                                          )}
                                                                                        </div>
                                                                                      </div>
                                                                                      <div className="space-y-1.5">
                                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-2xs">
                                                                                          <Sparkles className="w-2.5 h-2.5" />
                                                                                          15% DE DESCUENTO
                                                                                        </span>
                                                                                        <p className="text-[11px] text-emerald-800 font-medium leading-snug">
                                                                                          Ahorrá ${Math.round(subtotalAfterCyber * 0.15).toLocaleString('es-AR')}{' '}
                                                                                          abonando directo por transferencia.
                                                                                        </p>
                                                                                      </div>
                                                                                    </button>
                                                                                  </div>
                                                                                  {/* Opción B: Transferencia Bancaria */}
                                                                                  <button
                                                                                    type="button"
                                                                                    onClick={() => setPaymentMethod('transfer')}
                                                                                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-2.5 ${paymentMethod === 'transfer'
                                                                                      ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600'
                                                                                      : 'border-cirqa-negro/15 hover:border-cirqa-negro/30 bg-[#FBFBFA]'
                                                                                      }`}
                                                                                  >
                                                                                    <div className="flex items-center justify-between w-full">
                                                                                      <div className="flex items-center gap-2">
                                                                                        <div className="w-7 h-7 rounded-lg bg-emerald-700 flex items-center justify-center text-white">
                                                                                          <Building2 className="w-4 h-4" />
                                                                                        </div>
                                                                                        <span className="text-xs font-bold text-cirqa-negro">Transferencia</span>
                                                                                      </div>
                                                                                      <div
                                                                                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'transfer'
                                                                                          ? 'border-emerald-600 bg-emerald-600'
                                                                                          : 'border-cirqa-negro/30'
                                                                                          }`}
                                                                                      >
                                                                                        {paymentMethod === 'transfer' && (
                                                                                          <Check className="w-2.5 h-2.5 text-white" />
                                                                                        )}
                                                                                      </div>
                                                                                    </div>
                                                                                    <div className="space-y-1.5">
                                                                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-2xs">
                                                                                        <Sparkles className="w-2.5 h-2.5" />
                                                                                        15% DE DESCUENTO
                                                                                      </span>
                                                                                      <p className="text-[11px] text-emerald-800 font-medium leading-snug">
                                                                                        Ahorrá ${Math.round(subtotalAfterCyber * 0.15).toLocaleString('es-AR')}{' '}
                                                                                        abonando directo por transferencia.
                                                                                      </p>
                                                                                    </div>
                                                                                  </button>
                                                                                </div>
                                                                                {/* Opción B: Transferencia Bancaria */}
                                                                                <button
                                                                                  type="button"
                                                                                  onClick={() => setPaymentMethod('transfer')}
                                                                                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-2.5 ${paymentMethod === 'transfer'
                                                                                      ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600'
                                                                                      : 'border-cirqa-negro/15 hover:border-cirqa-negro/30 bg-[#FBFBFA]'
                                                                                    }`}
                                                                                >
                                                                                  <div className="flex items-center justify-between w-full">
                                                                                    <div className="flex items-center gap-2">
                                                                                      <div className="w-7 h-7 rounded-lg bg-emerald-700 flex items-center justify-center text-white">
                                                                                        <Building2 className="w-4 h-4" />
                                                                                      </div>
                                                                                      <span className="text-xs font-bold text-cirqa-negro">Transferencia</span>
                                                                                    </div>
                                                                                    <div
                                                                                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'transfer'
                                                                                          ? 'border-emerald-600 bg-emerald-600'
                                                                                          : 'border-cirqa-negro/30'
                                                                                        }`}
                                                                                    >
                                                                                      {paymentMethod === 'transfer' && (
                                                                                        <Check className="w-2.5 h-2.5 text-white" />
                                                                                      )}
                                                                                    </div>
                                                                                  </div>
                                                                                  <div className="space-y-1.5">
                                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-2xs">
                                                                                      <Sparkles className="w-2.5 h-2.5" />
                                                                                      15% DE DESCUENTO
                                                                                    </span>
                                                                                    <p className="text-[11px] text-emerald-800 font-medium leading-snug">
                                                                                      Ahorrá ${Math.round(subtotalAfterCyber * 0.15).toLocaleString('es-AR')}{' '}
                                                                                      abonando directo por transferencia.
                                                                                    </p>
                                                                                  </div>
                                                                                </button>
                                                                              </div>

                                                                              {/* ========================================================= */}
                                                                              {/* 3. SELECTOR DUAL DE MEDIOS DE PAGO (Tabs / Radio Cards)   */}
                                                                              {/* ========================================================= */}
                                                                              <div className="space-y-3 pt-3 border-t border-cirqa-negro/10">
                                                                                <span className="text-[11px] font-semibold uppercase tracking-wider text-cirqa-negro/60 block">
                                                                                  Seleccioná el Método de Pago
                                                                                </span>
                                                                                {/* TARJETA DE DATOS BANCARIOS */}
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
                                                      <span className="text-[10px] font-mono text-white/50">
                                                        {BANK_DETAILS.bank}
                                                      </span>
                                                    </div>
                {/* TARJETA DE DATOS BANCARIOS */}
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
                          <span className="text-[10px] font-mono text-white/50">
                            {BANK_DETAILS.bank}
                          </span>
                        </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                      {/* Opción A: Mercado Pago con Badge de 6 Cuotas Sin Interés */}
                                                      <button
                                                        type="button"
                                                        onClick={() => setPaymentMethod('mercadopago')}
                                                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-2.5 ${paymentMethod === 'mercadopago'
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
                                                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'mercadopago'
                                                              ? 'border-[#009EE3] bg-[#009EE3]'
                                                              : 'border-cirqa-negro/30'
                                                              }`}
                                                          >
                                                            {paymentMethod === 'mercadopago' && <Check className="w-2.5 h-2.5 text-white" />}
                                                          </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                                          <div>
                                                            <span className="text-[10px] text-white/50 block font-light">
                                                              Titular de Cuenta:
                                                            </span>
                                                            <span className="font-semibold text-white/95">
                                                              {BANK_DETAILS.companyName || BANK_DETAILS.holder}
                                                            </span>
                                                          </div>
                                                          <div>
                                                            <span className="text-[10px] text-white/50 block font-light">CUIT:</span>
                                                            <span className="font-mono text-white/95">{BANK_DETAILS.cuit}</span>
                                                          </div>
                                                          <div>
                                                            <span className="text-[10px] text-white/50 block font-light">
                                                              Banco:
                                                            </span>
                                                            <span className="font-semibold text-white/95">{BANK_DETAILS.bank}</span>
                                                          </div>
                                                          <div>
                                                            <span className="text-[10px] text-white/50 block font-light">
                                                              Cuenta:
                                                            </span>
                                                            <span className="font-mono text-white/95">
                                                              {BANK_DETAILS.accountType.includes('cc$') ? 'cc$ ' : ''}
                                                              {BANK_DETAILS.accountNumber}
                                                            </span>
                                                          </div>
                                                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-[10px] text-white/50 block font-light">
                              Titular de Cuenta:
                            </span>
                            <span className="font-semibold text-white/95">
                              {BANK_DETAILS.companyName || BANK_DETAILS.holder}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-white/50 block font-light">CUIT:</span>
                            <span className="font-mono text-white/95">{BANK_DETAILS.cuit}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-white/50 block font-light">
                              Banco:
                            </span>
                            <span className="font-semibold text-white/95">{BANK_DETAILS.bank}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-white/50 block font-light">
                              Cuenta:
                            </span>
                            <span className="font-mono text-white/95">
                              {BANK_DETAILS.accountType.includes('cc$') ? 'cc$ ' : ''}
                              {BANK_DETAILS.accountNumber}
                            </span>
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
                                                      {/* Alias y CBU con botones para copiar */}
                                                      <div className="space-y-2 pt-1 border-t border-white/10">
                                                        <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10">
                                                          <div>
                                                            <span className="text-[9px] text-white/50 uppercase block font-mono">
                                                              Alias CBU
                                                            </span>
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
                        {/* Alias y CBU con botones para copiar */}
                        <div className="space-y-2 pt-1 border-t border-white/10">
                          <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10">
                            <div>
                              <span className="text-[9px] text-white/50 uppercase block font-mono">
                                Alias CBU
                              </span>
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

                                                        {/* Opción B: Transferencia Bancaria (Con Badge 15% OFF) */}
                                                        <button
                                                          type="button"
                                                          onClick={() => setPaymentMethod('transfer')}
                                                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-2.5 ${paymentMethod === 'transfer'
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
                                                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'transfer'
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
                                                              Ahorrá ${Math.round(subtotalAfterCyber * 0.15).toLocaleString('es-AR')} abonando directo por transferencia.
                                                            </p>
                                                          </div>
                                                        </button>
                                                      </div>
                                                      <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10">
                                                        <div className="min-w-0 pr-2">
                                                          <span className="text-[9px] text-white/50 uppercase block font-mono">
                                                            CBU Bancario
                                                          </span>
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
                          <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10">
                            <div className="min-w-0 pr-2">
                              <span className="text-[9px] text-white/50 uppercase block font-mono">
                                CBU Bancario
                              </span>
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
                                                            <p className="text-[11px] text-white/70 font-light leading-relaxed pt-1 italic">
                                                              * Transferí el total y enviá el comprobante junto con tu número de orden
                                                              para confirmar el pedido.
                                                            </p>
                                                          </div>
                                                        </motion.div>
                                                      )}
                                                    </AnimatePresence>
                                                  </div>
                        <p className="text-[11px] text-white/70 font-light leading-relaxed pt-1 italic">
                          * Transferí el total y enviá el comprobante junto con tu número de orden
                          para confirmar el pedido.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

                                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                                    <div>
                                                      <span className="text-[10px] text-white/50 block font-light">Titular de Cuenta:</span>
                                                      <span className="font-semibold text-white/95">{BANK_DETAILS.companyName || BANK_DETAILS.holder}</span>
                                                    </div>
                                                    <div>
                                                      <span className="text-[10px] text-white/50 block font-light">CUIT:</span>
                                                      <span className="font-mono text-white/95">{BANK_DETAILS.cuit}</span>
                                                    </div>
                                                    <div>
                                                      <span className="text-[10px] text-white/50 block font-light">Banco:</span>
                                                      <span className="font-semibold text-white/95">{BANK_DETAILS.bank}</span>
                                                    </div>
                                                    <div>
                                                      <span className="text-[10px] text-white/50 block font-light">Cuenta:</span>
                                                      <span className="font-mono text-white/95">{BANK_DETAILS.accountType.includes('cc$') ? 'cc$ ' : ''}{BANK_DETAILS.accountNumber}</span>
                                                    </div>
                                                  </div>
                                                  {/* ========================================================= */}
                                                                                  {/* 4. CUPÓN Y DESGLOSE DETALLADO (DENTRO DEL ÁREA SCROLLEABLE)*/}
                                                                                  {/* ========================================================= */}
                                                                                  <div className="space-y-3 pt-3 border-t border-cirqa-negro/10">
                                                                                    {/* Input / Badge de Cupón de Descuento */}
                                                                                    <div className="p-3.5 rounded-2xl bg-[#FBFBFA] border border-cirqa-negro/10">
                                                                                      {!appliedCoupon ? (
                                                                                        <form onSubmit={handleApplyCoupon} className="space-y-2">
                                                                                          <label className="text-[11px] font-semibold text-cirqa-negro/80 flex items-center gap-1.5">
                                                                                            <Percent className="w-3.5 h-3.5 text-cirqa-primario" />
                                                                                            ¿Tenés un código de descuento?
                                                                                          </label>
                                                                                          <div className="flex items-center gap-2">
                                                                                            <input
                                                                                              type="text"
                                                                                              value={couponInput}
                                                                                              onChange={(e) => {
                                                                                                setCouponInput(e.target.value.toUpperCase());
                                                                                                if (couponError) setCouponError(null);
                                                                                              }}
                                                                                              placeholder="Código (ej: BIENVENIDA5)"
                                                                                              className="flex-1 min-w-0 min-h-[46px] py-3 px-3.5 md:py-2.5 text-base md:text-sm font-mono uppercase bg-white border border-cirqa-negro/15 rounded-xl focus:outline-none focus:border-cirqa-negro transition-colors"
                                                                                            />
                                                                                            <button
                                                                                              type="button"
                                                                                              onClick={handleApplyCoupon}
                                                                                              disabled={isValidatingCoupon || !couponInput.trim()}
                                                                                              className="min-h-[46px] px-4 py-3 md:py-2.5 bg-cirqa-negro hover:bg-black text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                                                                                            >
                                                                                              {isValidatingCoupon ? (
                                                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                                              ) : (
                                                                                                'Aplicar'
                                                                                              )}
                                                                                            </button>
                                                                                          </div>
                                                                                          {couponError && (
                                                                                            <p className="text-[11px] text-red-600 font-medium flex items-center gap-1 pt-0.5">
                                                                                              <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                                                                              <span>{couponError}</span>
                                                                                            </p>
                                                                                          )}
                                                                                        </form>
                                                                                      ) : (
                                                                                        <div className="flex items-center justify-between gap-2">
                                                                                          <div className="flex items-center gap-2.5 min-w-0">
                                                                                            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs flex-shrink-0">
                                                                                              %
                                                                                            </div>
                                                                                            <div className="min-w-0">
                                                                                              <div className="flex items-center gap-1.5 flex-wrap">
                                                                                                <span className="font-mono font-bold text-xs text-emerald-950 tracking-wider">
                                                                                                  {appliedCoupon.code}
                                                                                                </span>
                                                                                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                                                                                                  Aplicado
                                                                                                </span>
                                                                                              </div>
                                                                                              {appliedCoupon.description ? (
                                                                                                <p className="text-[10px] text-emerald-700 font-light mt-0.5 truncate">
                                                                                                  {appliedCoupon.description}
                                                                                                </p>
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
                                                                                            className="text-[11px] text-red-600 hover:text-red-800 font-semibold cursor-pointer px-2 py-1 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                                                                          >
                                                                                            Quitar
                                                                                          </button>
                                                                                        </div>
                                                                                      )}
                                                                                    </div>
                                                                                    {/* ========================================================= */}
                                                                                    {/* 4. CUPÓN COLAPSABLE + DESGLOSE DETALLADO                  */}
                                                                                    {/* ========================================================= */}
                                                                                    <div className="space-y-3 pt-3 border-t border-cirqa-negro/10">
                                                                                      {/* Acordeón colapsable de Cupón de Descuento */}
                                                                                      <div className="rounded-2xl bg-[#FBFBFA] border border-cirqa-negro/10 overflow-hidden">
                                                                                        {appliedCoupon ? (
                                                                                          <div className="p-3.5 flex items-center justify-between gap-2">
                                                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                                              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs flex-shrink-0">
                                                                                                %
                                                                                              </div>
                                                                                              <div className="min-w-0">
                                                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                                                  <span className="font-mono font-bold text-xs text-emerald-950 tracking-wider">
                                                                                                    {appliedCoupon.code}
                                                                                                  </span>
                                                                                                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                                                                                                    Aplicado
                                                                                                  </span>
                                                                                                </div>
                                                                                                {appliedCoupon.description ? (
                                                                                                  <p className="text-[10px] text-emerald-700 font-light mt-0.5 truncate">
                                                                                                    {appliedCoupon.description}
                                                                                                  </p>
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
                                                                                              className="text-[11px] text-red-600 hover:text-red-800 font-semibold cursor-pointer px-2 py-1 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                                                                            >
                                                                                              Quitar
                                                                                            </button>
                                                                                          </div>
                                                                                        ) : !isCouponOpen && !couponError ? (
                                                                                          <button
                                                                                            type="button"
                                                                                            onClick={() => setIsCouponOpen(true)}
                                                                                            className="w-full px-3.5 py-3 flex items-center justify-between gap-2 text-left hover:bg-black/[0.02] transition-colors cursor-pointer"
                                                                                          >
                                                                                            <span className="text-xs font-medium text-cirqa-negro/80 flex items-center gap-2">
                                                                                              <Percent className="w-3.5 h-3.5 text-cirqa-primario flex-shrink-0" />
                                                                                              <span>¿Tenés un código de descuento? Tocá para ingresarlo</span>
                                                                                            </span>
                                                                                            <ChevronDown className="w-4 h-4 text-cirqa-negro/50 flex-shrink-0" />
                                                                                          </button>
                                                                                        ) : (
                                                                                          <form onSubmit={handleApplyCoupon} className="p-3.5 space-y-2.5">
                                                                                            <div className="flex items-center justify-between gap-2">
                                                                                              <label className="text-[11px] font-semibold text-cirqa-negro/80 flex items-center gap-1.5">
                                                                                                <Percent className="w-3.5 h-3.5 text-cirqa-primario" />
                                                                                                ¿Tenés un código de descuento?
                                                                                              </label>
                                                                                              <button
                                                                                                type="button"
                                                                                                onClick={() => {
                                                                                                  setIsCouponOpen(false);
                                                                                                  setCouponError(null);
                                                                                                }}
                                                                                                className="text-[11px] text-cirqa-negro/50 hover:text-cirqa-negro flex items-center gap-1 cursor-pointer"
                                                                                              >
                                                                                                <span>Ocultar</span>
                                                                                                <ChevronUp className="w-3.5 h-3.5" />
                                                                                              </button>
                                                                                            </div>
                                                                                            <div className="flex items-center gap-2">
                                                                                              <input
                                                                                                type="text"
                                                                                                value={couponInput}
                                                                                                onChange={(e) => {
                                                                                                  setCouponInput(e.target.value.toUpperCase());
                                                                                                  if (couponError) setCouponError(null);
                                                                                                }}
                                                                                                placeholder="Código (ej: BIENVENIDA5)"
                                                                                                className="flex-1 min-w-0 min-h-[46px] py-3 px-3.5 md:py-2.5 text-base md:text-sm font-mono uppercase bg-white border border-cirqa-negro/15 rounded-xl focus:outline-none focus:border-cirqa-negro transition-colors"
                                                                                              />
                                                                                              <button
                                                                                                type="button"
                                                                                                onClick={handleApplyCoupon}
                                                                                                disabled={isValidatingCoupon || !couponInput.trim()}
                                                                                                className="min-h-[46px] px-4 py-3 md:py-2.5 bg-cirqa-negro hover:bg-black text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                                                                                              >
                                                                                                {isValidatingCoupon ? (
                                                                                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                                                ) : (
                                                                                                  'Aplicar'
                                                                                                )}
                                                                                              </button>
                                                                                            </div>
                                                                                            {couponError && (
                                                                                              <p className="text-[11px] text-red-600 font-medium flex items-center gap-1 pt-0.5">
                                                                                                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                                                                                <span>{couponError}</span>
                                                                                              </p>
                                                                                            )}
                                                                                          </form>
                                                                                        )}
                                                                                      </div>
                                                                                      {/* ========================================================= */}
                                                                                      {/* 4. CUPÓN COLAPSABLE + DESGLOSE DETALLADO                  */}
                                                                                      {/* ========================================================= */}
                                                                                      <div className="space-y-3 pt-3 border-t border-cirqa-negro/10">
                                                                                        {/* Acordeón colapsable de Cupón de Descuento */}
                                                                                        <div className="rounded-2xl bg-[#FBFBFA] border border-cirqa-negro/10 overflow-hidden">
                                                                                          {appliedCoupon ? (
                                                                                            <div className="p-3.5 flex items-center justify-between gap-2">
                                                                                              <div className="flex items-center gap-2.5 min-w-0">
                                                                                                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs flex-shrink-0">
                                                                                                  %
                                                                                                </div>
                                                                                                <div className="min-w-0">
                                                                                                  <div className="flex items-center gap-1.5 flex-wrap">
                                                                                                    <span className="font-mono font-bold text-xs text-emerald-950 tracking-wider">
                                                                                                      {appliedCoupon.code}
                                                                                                    </span>
                                                                                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                                                                                                      Aplicado
                                                                                                    </span>
                                                                                                  </div>
                                                                                                  {appliedCoupon.description ? (
                                                                                                    <p className="text-[10px] text-emerald-700 font-light mt-0.5 truncate">
                                                                                                      {appliedCoupon.description}
                                                                                                    </p>
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
                                                                                                className="text-[11px] text-red-600 hover:text-red-800 font-semibold cursor-pointer px-2 py-1 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                                                                              >
                                                                                                Quitar
                                                                                              </button>
                                                                                            </div>
                                                                                          ) : !isCouponOpen && !couponError ? (
                                                                                            <button
                                                                                              type="button"
                                                                                              onClick={() => setIsCouponOpen(true)}
                                                                                              className="w-full px-3.5 py-3 flex items-center justify-between gap-2 text-left hover:bg-black/[0.02] transition-colors cursor-pointer"
                                                                                            >
                                                                                              <span className="text-xs font-medium text-cirqa-negro/80 flex items-center gap-2">
                                                                                                <Percent className="w-3.5 h-3.5 text-cirqa-primario flex-shrink-0" />
                                                                                                <span>¿Tenés un código de descuento? Tocá para ingresarlo</span>
                                                                                              </span>
                                                                                              <ChevronDown className="w-4 h-4 text-cirqa-negro/50 flex-shrink-0" />
                                                                                            </button>
                                                                                          ) : (
                                                                                            <form onSubmit={handleApplyCoupon} className="p-3.5 space-y-2.5">
                                                                                              <div className="flex items-center justify-between gap-2">
                                                                                                <label className="text-[11px] font-semibold text-cirqa-negro/80 flex items-center gap-1.5">
                                                                                                  <Percent className="w-3.5 h-3.5 text-cirqa-primario" />
                                                                                                  ¿Tenés un código de descuento?
                                                                                                </label>
                                                                                                <button
                                                                                                  type="button"
                                                                                                  onClick={() => {
                                                                                                    setIsCouponOpen(false);
                                                                                                    setCouponError(null);
                                                                                                  }}
                                                                                                  className="text-[11px] text-cirqa-negro/50 hover:text-cirqa-negro flex items-center gap-1 cursor-pointer"
                                                                                                >
                                                                                                  <span>Ocultar</span>
                                                                                                  <ChevronUp className="w-3.5 h-3.5" />
                                                                                                </button>
                                                                                              </div>
                                                                                              <div className="flex items-center gap-2">
                                                                                                <input
                                                                                                  type="text"
                                                                                                  value={couponInput}
                                                                                                  onChange={(e) => {
                                                                                                    setCouponInput(e.target.value.toUpperCase());
                                                                                                    if (couponError) setCouponError(null);
                                                                                                  }}
                                                                                                  placeholder="Código (ej: BIENVENIDA5)"
                                                                                                  className="flex-1 min-w-0 min-h-[46px] py-3 px-3.5 md:py-2.5 text-base md:text-sm font-mono uppercase bg-white border border-cirqa-negro/15 rounded-xl focus:outline-none focus:border-cirqa-negro transition-colors"
                                                                                                />
                                                                                                <button
                                                                                                  type="button"
                                                                                                  onClick={handleApplyCoupon}
                                                                                                  disabled={isValidatingCoupon || !couponInput.trim()}
                                                                                                  className="min-h-[46px] px-4 py-3 md:py-2.5 bg-cirqa-negro hover:bg-black text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                                                                                                >
                                                                                                  {isValidatingCoupon ? (
                                                                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                                                  ) : (
                                                                                                    'Aplicar'
                                                                                                  )}
                                                                                                </button>
                                                                                              </div>
                                                                                              {couponError && (
                                                                                                <p className="text-[11px] text-red-600 font-medium flex items-center gap-1 pt-0.5">
                                                                                                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                                                                                  <span>{couponError}</span>
                                                                                                </p>
                                                                                              )}
                                                                                            </form>
                                                                                          )}
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
                                                                                          {/* Desglose de Subtotal, Descuentos y Envío */}
                                                                                          <div className="p-3.5 rounded-2xl bg-[#FBFBFA] border border-cirqa-negro/10 space-y-2">
                                                                                            <div className="flex items-center justify-between text-xs text-cirqa-negro/70">
                                                                                              <span>Subtotal</span>
                                                                                              <span className="font-mono font-medium">
                                                                                                $ {subtotal.toLocaleString('es-AR')}
                                                                                              </span>
                                                                                            </div>
                                                                                            {/* Desglose de Subtotal, Descuentos y Envío */}
                                                                                            <div className="p-3.5 rounded-2xl bg-[#FBFBFA] border border-cirqa-negro/10 space-y-2">
                                                                                              <div className="flex items-center justify-between text-xs text-cirqa-negro/70">
                                                                                                <span>Subtotal</span>
                                                                                                <span className="font-mono font-medium">
                                                                                                  $ {subtotal.toLocaleString('es-AR')}
                                                                                                </span>
                                                                                              </div>
                                                                                              {/* Desglose de Subtotal, Descuentos y Envío */}
                                                                                              <div className="p-3.5 rounded-2xl bg-[#FBFBFA] border border-cirqa-negro/10 space-y-2">
                                                                                                <div className="flex items-center justify-between text-xs text-cirqa-negro/70">
                                                                                                  <span>Subtotal</span>
                                                                                                  <span className="font-mono font-medium">
                                                                                                    $ {subtotal.toLocaleString('es-AR')}
                                                                                                  </span>
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
                                                                                              {appliedCoupon && couponDiscount > 0 && (
                                                                                                <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
                                                                                                  <span className="flex items-center gap-1.5">
                                                                                                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                                                                                    <span>Cupón ({appliedCoupon.code})</span>
                                                                                                  </span>
                                                                                                  <span className="font-mono font-bold">
                                                                                                    -$ {couponDiscount.toLocaleString('es-AR')}
                                                                                                  </span>
                                                                                                </div>
                                                                                              )}
                                                                                              {appliedCoupon && couponDiscount > 0 && (
                                                                                                <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
                                                                                                  <span className="flex items-center gap-1.5">
                                                                                                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                                                                                    <span>Cupón ({appliedCoupon.code})</span>
                                                                                                  </span>
                                                                                                  <span className="font-mono font-bold">
                                                                                                    -$ {couponDiscount.toLocaleString('es-AR')}
                                                                                                  </span>
                                                                                                </div>
                                                                                              )}
                                                                                              {appliedCoupon && couponDiscount > 0 && (
                                                                                                <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
                                                                                                  <span className="flex items-center gap-1.5">
                                                                                                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                                                                                    <span>Cupón ({appliedCoupon.code})</span>
                                                                                                  </span>
                                                                                                  <span className="font-mono font-bold">
                                                                                                    -$ {couponDiscount.toLocaleString('es-AR')}
                                                                                                  </span>
                                                                                                </div>
                                                                                              )}

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
                                                                                    {isCyber && cyberDiscount > 0 && (
                                                                                      <div className="flex items-center justify-between text-xs text-cirqa-primario font-semibold">
                                                                                        <span className="flex items-center gap-1.5">
                                                                                          <Sparkles className="w-3.5 h-3.5 text-cirqa-primario flex-shrink-0" />
                                                                                          <span>Descuento Cyber Monday (20% OFF)</span>
                                                                                        </span>
                                                                                        <span className="font-mono font-bold">
                                                                                          -$ {cyberDiscount.toLocaleString('es-AR')}
                                                                                        </span>
                                                                                      </div>
                                                                                    )}
                                                                                    {isCyber && cyberDiscount > 0 && (
                                                                                      <div className="flex items-center justify-between text-xs text-cirqa-primario font-semibold">
                                                                                        <span className="flex items-center gap-1.5">
                                                                                          <Sparkles className="w-3.5 h-3.5 text-cirqa-primario flex-shrink-0" />
                                                                                          <span>Descuento Cyber Monday (20% OFF)</span>
                                                                                        </span>
                                                                                        <span className="font-mono font-bold">
                                                                                          -$ {cyberDiscount.toLocaleString('es-AR')}
                                                                                        </span>
                                                                                      </div>
                                                                                    )}
                                                                                    {isCyber && cyberDiscount > 0 && (
                                                                                      <div className="flex items-center justify-between text-xs text-cirqa-primario font-semibold">
                                                                                        <span className="flex items-center gap-1.5">
                                                                                          <Sparkles className="w-3.5 h-3.5 text-cirqa-primario flex-shrink-0" />
                                                                                          <span>Descuento Cyber Monday (20% OFF)</span>
                                                                                        </span>
                                                                                        <span className="font-mono font-bold">
                                                                                          -$ {cyberDiscount.toLocaleString('es-AR')}
                                                                                        </span>
                                                                                      </div>
                                                                                    )}

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
                                                                                              {/* ========================================================= */}
                                                                                              {/* 4. CUPÓN Y DESGLOSE DE IMPORTES (DENTRO DEL SCROLL)       */}
                                                                                              {/* ========================================================= */}
                                                                                              <div className="space-y-3 pt-3 border-t border-cirqa-negro/10">
                                                                                                {/* Input / Badge de Cupón de Descuento */}
                                                                                                <div className="p-3 rounded-2xl bg-[#FBFBFA] border border-cirqa-negro/10">
                                                                                                  {!appliedCoupon ? (
                                                                                                    <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                                                                                                      <label className="text-[11px] font-semibold text-cirqa-negro/80 flex items-center gap-1.5">
                                                                                                        <Percent className="w-3.5 h-3.5 text-cirqa-primario" />
                                                                                                        ¿Tenés un código de descuento?
                                                                                                      </label>
                                                                                                      <div className="flex items-center gap-2">
                                                                                                        <input
                                                                                                          type="text"
                                                                                                          value={couponInput}
                                                                                                          onChange={(e) => {
                                                                                                            setCouponInput(e.target.value.toUpperCase());
                                                                                                            if (couponError) setCouponError(null);
                                                                                                          }}
                                                                                                          placeholder="Código (ej: BIENVENIDA5)"
                                                                                                          className="flex-1 min-w-0 px-3 py-2 text-base sm:text-xs font-mono uppercase bg-white border border-cirqa-negro/15 rounded-xl focus:outline-none focus:border-cirqa-negro transition-colors"
                                                                                                        />
                                                                                                        <button
                                                                                                          type="button"
                                                                                                          onClick={handleApplyCoupon}
                                                                                                          disabled={isValidatingCoupon || !couponInput.trim()}
                                                                                                          className="px-3.5 py-2.5 sm:py-2 bg-cirqa-negro hover:bg-black text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                                                                                                        >
                                                                                                          {isValidatingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Aplicar'}
                                                                                                        </button>
                                                                                                      </div>
                                                                                                      {couponError && (
                                                                                                        <p className="text-[11px] text-red-600 font-medium flex items-center gap-1 pt-0.5">
                                                                                                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                                                                                          <span>{couponError}</span>
                                                                                                        </p>
                                                                                                      )}
                                                                                                    </form>
                                                                                                  ) : (
                                                                                                    <div className="flex items-center justify-between gap-2">
                                                                                                      <div className="flex items-center gap-2.5 min-w-0">
                                                                                                        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs flex-shrink-0">
                                                                                                          %
                                                                                                        </div>
                                                                                                        <div className="min-w-0">
                                                                                                          <div className="flex items-center gap-1.5 flex-wrap">
                                                                                                            <span className="font-mono font-bold text-xs text-emerald-950 tracking-wider">
                                                                                                              {appliedCoupon.code}
                                                                                                            </span>
                                                                                                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                                                                                                              Aplicado
                                                                                                            </span>
                                                                                                          </div>
                                                                                                          {appliedCoupon.description ? (
                                                                                                            <p className="text-[10px] text-emerald-700 font-light mt-0.5 truncate">{appliedCoupon.description}</p>
                                                                                                          ) : (
                                                                                                            <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                                                                                                              Descuento de ${couponDiscount.toLocaleString('es-AR')}
                                                                                                            </p>
                                                                                                          )}
                                                                                                        </div>
                                                                                                      </div>
                                                                                                      <button
                                                                                                        type="button"
                                                                                                        onClick={handleApplyCoupon}
                                                                                                        disabled={isValidatingCoupon || !couponInput.trim()}
                                                                                                        className="px-4 py-2 bg-cirqa-negro hover:bg-black text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                                                                                                        onClick={handleRemoveCoupon}
                                                                                                        className="text-[11px] text-red-600 hover:text-red-800 font-semibold cursor-pointer px-2 py-1 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                                                                                      >
                                                                                                        {isValidatingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Aplicar'}
                                                                                                        Quitar
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
                )}
                                                                                                </div>
                                                                                                {paymentMethod === 'transfer' && transferDiscount > 0 && (
                                                                                                  <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
                                                                                                    <span className="flex items-center gap-1.5">
                                                                                                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                                                                                      <span>Descuento Transferencia (15% OFF)</span>
                                                                                                    </span>
                                                                                                    <span className="font-mono font-bold">
                                                                                                      -$ {transferDiscount.toLocaleString('es-AR')}
                                                                                                    </span>
                                                                                                  </div>
                                                                                                )}
                                                                                                {paymentMethod === 'transfer' && transferDiscount > 0 && (
                                                                                                  <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
                                                                                                    <span className="flex items-center gap-1.5">
                                                                                                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                                                                                      <span>Descuento Transferencia (15% OFF)</span>
                                                                                                    </span>
                                                                                                    <span className="font-mono font-bold">
                                                                                                      -$ {transferDiscount.toLocaleString('es-AR')}
                                                                                                    </span>
                                                                                                  </div>
                                                                                                )}
                                                                                                {paymentMethod === 'transfer' && transferDiscount > 0 && (
                                                                                                  <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
                                                                                                    <span className="flex items-center gap-1.5">
                                                                                                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                                                                                      <span>Descuento Transferencia (15% OFF)</span>
                                                                                                    </span>
                                                                                                    <span className="font-mono font-bold">
                                                                                                      -$ {transferDiscount.toLocaleString('es-AR')}
                                                                                                    </span>
                                                                                                  </div>
                                                                                                )}

                                                                                                {/* Desglose de Subtotal, Descuentos y Envío */}
                                                                                                <div className="p-3.5 rounded-2xl bg-[#FBFBFA] border border-cirqa-negro/10 space-y-2">
                                                                                                  <div className="flex items-center justify-between text-xs text-cirqa-negro/70">
                                                                                                    <span>Subtotal</span>
                                                                                                    <span className="font-mono font-medium">$ {subtotal.toLocaleString('es-AR')}</span>
                                                                                                  </div>
              )}
                                                                                                </div>
                                                                                                <div className="flex items-center justify-between gap-2 text-xs text-cirqa-negro/70 pt-1.5 border-t border-cirqa-negro/5">
                                                                                                  <span className="flex items-center gap-1.5 min-w-0">
                                                                                                    <Truck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                                                                                    <span className="truncate">
                                                                                                      {selectedShippingOption
                                                                                                        ? selectedShippingOption.name
                                                                                                        : 'Envío a todo el país'}
                                                                                                    </span>
                                                                                                  </span>
                                                                                                  <span className="text-[11px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex-shrink-0">
                                                                                                    GRATIS $0
                                                                                                  </span>
                                                                                                </div>
                                                                                              </div>
                                                                                              <div className="flex items-center justify-between gap-2 text-xs text-cirqa-negro/70 pt-1.5 border-t border-cirqa-negro/5">
                                                                                                <span className="flex items-center gap-1.5 min-w-0">
                                                                                                  <Truck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                                                                                  <span className="truncate">
                                                                                                    {selectedShippingOption
                                                                                                      ? selectedShippingOption.name
                                                                                                      : 'Envío a todo el país'}
                                                                                                  </span>
                                                                                                </span>
                                                                                                <span className="text-[11px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex-shrink-0">
                                                                                                  GRATIS $0
                                                                                                </span>
                                                                                              </div>
                                                                                            </div>
                                                                                            <div className="flex items-center justify-between gap-2 text-xs text-cirqa-negro/70 pt-1.5 border-t border-cirqa-negro/5">
                                                                                              <span className="flex items-center gap-1.5 min-w-0">
                                                                                                <Truck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                                                                                <span className="truncate">
                                                                                                  {selectedShippingOption
                                                                                                    ? selectedShippingOption.name
                                                                                                    : 'Envío a todo el país'}
                                                                                                </span>
                                                                                              </span>
                                                                                              <span className="text-[11px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex-shrink-0">
                                                                                                GRATIS $0
                                                                                              </span>
                                                                                            </div>
                                                                                          </div>

                                                        {/* Subtotal Regular */}
                                                                                        <div className="flex items-center justify-between text-xs text-cirqa-negro/70">
                                                                                          <span>Subtotal</span>
                                                                                          <span className="font-mono font-medium">$ {subtotal.toLocaleString('es-AR')}</span>
                                                                                        </div>
                                                                                        {appliedCoupon && couponDiscount > 0 && (
                                                                                          <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
                                                                                            <span className="flex items-center gap-1.5">
                                                                                              <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                                                                              <span>Cupón ({appliedCoupon.code})</span>
                                                                                            </span>
                                                                                            <span className="font-mono font-bold">
                                                                                              -$ {couponDiscount.toLocaleString('es-AR')}
                                                                                            </span>
                                                                                          </div>
                                                                                        )}
                                                                                        {/* Garantías */}
                                                                                        <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 pt-1 text-[10px] text-cirqa-negro/50">
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
                                                                                      {/* Garantías */}
                                                                                      <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 pt-1 text-[10px] text-cirqa-negro/50">
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
                                                                                    {isCyber && cyberDiscount > 0 && (
                                                                                      <div className="flex items-center justify-between text-xs text-cirqa-primario font-semibold">
                                                                                        <span className="flex items-center gap-1.5">
                                                                                          <Sparkles className="w-3.5 h-3.5 text-cirqa-primario flex-shrink-0" />
                                                                                          <span>Descuento Cyber Monday (20% OFF)</span>
                                                                                        </span>
                                                                                        <span className="font-mono font-bold">
                                                                                          -$ {cyberDiscount.toLocaleString('es-AR')}
                                                                                        </span>
                                                                                      </div>
                                                                                    )}
                                                                                    {/* ========================================================= */}
                                                                                    {/* 5. BLOQUE FINAL DE COMPRA (En flujo natural en mobile;    */}
                                                                                    {/*    sticky solo desde md: para no bloquear pulgar táctil)  */}
                                                                                    {/* ========================================================= */}
                                                                                    <div
                                                                                      className="-mx-4 sm:-mx-6 px-4 sm:px-6 pt-3 pb-3 border-t border-cirqa-negro/10 bg-[#FBFBFA] space-y-2 md:sticky md:bottom-0 md:z-20 md:shadow-[0_-8px_20px_rgba(0,0,0,0.04)]"
                                                                                      style={{ paddingBottom: 'max(0.875rem, env(safe-area-inset-bottom, 0.875rem))' }}
                                                                                    >
                                                                                      {(hasValidationErrors || submissionError) && (
                                                                                        <div className="px-3 py-1.5 rounded-xl bg-cirqa-carmin/10 border border-cirqa-carmin/25 text-cirqa-carmin text-[11px] font-medium flex items-center gap-2">
                                                                                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                                                                          <span className="leading-snug truncate">
                                                                                            {submissionError || 'Revisá los campos obligatorios marcados en rojo.'}
                                                                                          </span>
                                                                                        </div>
                                                                                      )}
                                                                                      {/* ========================================================= */}
                                                                                      {/* 5. BLOQUE FINAL DE COMPRA (En flujo natural en mobile;    */}
                                                                                      {/*    sticky solo desde md: para no bloquear pulgar táctil)  */}
                                                                                      {/* ========================================================= */}
                                                                                      <div
                                                                                        className="-mx-4 sm:-mx-6 px-4 sm:px-6 pt-3 pb-3 border-t border-cirqa-negro/10 bg-[#FBFBFA] space-y-2 md:sticky md:bottom-0 md:z-20 md:shadow-[0_-8px_20px_rgba(0,0,0,0.04)]"
                                                                                        style={{ paddingBottom: 'max(0.875rem, env(safe-area-inset-bottom, 0.875rem))' }}
                                                                                      >
                                                                                        {(hasValidationErrors || submissionError) && (
                                                                                          <div className="px-3 py-1.5 rounded-xl bg-cirqa-carmin/10 border border-cirqa-carmin/25 text-cirqa-carmin text-[11px] font-medium flex items-center gap-2">
                                                                                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                                                                            <span className="leading-snug truncate">
                                                                                              {submissionError || 'Revisá los campos obligatorios marcados en rojo.'}
                                                                                            </span>
                                                                                          </div>
                                                                                        )}

                                                                                        {/* Descuento 20% Cyber Monday */}
                                                                                        {isCyber && cyberDiscount > 0 && (
                                                                                          <div className="flex items-center justify-between text-xs text-cirqa-primario font-semibold">
                                                                                            <span className="flex items-center gap-1.5">
                                                                                              <Sparkles className="w-3.5 h-3.5 text-cirqa-primario" />
                                                                                              <span>Descuento Cyber Monday (20% OFF)</span>
                                                                                            </span>
                                                                                            <span className="font-mono font-bold">
                                                                                              -$ {cyberDiscount.toLocaleString('es-AR')}
                                                                                            </span>
                                                                                            {paymentMethod === 'transfer' && transferDiscount > 0 && (
                                                                                              <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
                                                                                                <span className="flex items-center gap-1.5">
                                                                                                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                                                                                  <span>Descuento Transferencia (15% OFF)</span>
                                                                                                </span>
                                                                                                <span className="font-mono font-bold">
                                                                                                  -$ {transferDiscount.toLocaleString('es-AR')}
                                                                                                </span>
                                                                                              </div>
                                                                                            )}
                                                                                            {/* Total Final en una línea compacta */}
                                                                                            <div className="flex items-center justify-between gap-2 text-sm sm:text-base font-medium text-cirqa-negro">
                                                                                              <div className="flex items-center gap-2 min-w-0">
                                                                                                <span className="font-bold whitespace-nowrap">Total a pagar</span>
                                                                                                {totalDiscount > 0 && (
                                                                                                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full truncate">
                                                                                                    Ahorrás ${totalDiscount.toLocaleString('es-AR')}
                                                                                                  </span>
                                                                                                )}
                                                                                              </div>
                                                                                              <span className="font-mono text-lg sm:text-xl font-bold text-cirqa-negro flex-shrink-0">
                                                                                                $ {total.toLocaleString('es-AR')}
                                                                                              </span>
                                                                                            </div>
                                                                                            {/* Total Final en una línea compacta */}
                                                                                            <div className="flex items-center justify-between gap-2 text-sm sm:text-base font-medium text-cirqa-negro">
                                                                                              <div className="flex items-center gap-2 min-w-0">
                                                                                                <span className="font-bold whitespace-nowrap">Total a pagar</span>
                                                                                                {totalDiscount > 0 && (
                                                                                                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full truncate">
                                                                                                    Ahorrás ${totalDiscount.toLocaleString('es-AR')}
                                                                                                  </span>
                                                                                                )}
                                                                                              </div>
                                                                                              <span className="font-mono text-lg sm:text-xl font-bold text-cirqa-negro flex-shrink-0">
                                                                                                $ {total.toLocaleString('es-AR')}
                                                                                              </span>
                                                                                            </div>

                                                                                            <div className="flex items-start justify-between gap-2 text-xs text-cirqa-negro/70 pt-1 border-t border-cirqa-negro/5">
                                                                                              <span className="flex items-center gap-1.5 min-w-0">
                                                                                                <Truck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                                                                                <span className="truncate">
                                                                                                  {selectedShippingOption ? selectedShippingOption.name : 'Envío a todo el país'}
                                                                                                </span>
                                                                                              </span>
                                                                                              <span className="text-[11px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex-shrink-0">
                                                                                                GRATIS $0
                                                                                              </span>
                                                                                            </div>
                                                                                          </div>
                                                                                        )}
                                                                                      </div>
                                                                                    </div>

                                                                                    {/* Descuento 15% Transferencia */}
                                                                                    {paymentMethod === 'transfer' && transferDiscount > 0 && (
                                                                                      <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
                                                                                        <span className="flex items-center gap-1.5">
                                                                                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                                                                          Descuento Transferencia (15% OFF)
                                                                                          {/* ========================================================= */}
                                                                                          {/* 5. FOOTER FIJO ULTRA-COMPACTO (Total + Botón Principal)   */}
                                                                                          {/* ========================================================= */}
                                                                                          <div
                                                                                            className="px-4 sm:px-6 pt-3 pb-3.5 border-t border-cirqa-negro/10 bg-[#FBFBFA] flex-shrink-0 space-y-2.5"
                                                                                            style={{ paddingBottom: 'max(0.875rem, env(safe-area-inset-bottom, 0.875rem))' }}
                                                                                          >
                                                                                            {/* Aviso visible junto al botón cuando hay error de validación o del servidor */}
                                                                                            {(hasValidationErrors || submissionError) && (
                                                                                              <div className="px-3 py-2 rounded-xl bg-cirqa-carmin/10 border border-cirqa-carmin/25 text-cirqa-carmin text-[11px] font-medium flex items-center gap-2">
                                                                                                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                                                                                <span className="leading-snug">
                                                                                                  {submissionError || 'Revisá los campos obligatorios marcados en rojo arriba.'}
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
                                                                                                <div className="flex items-center justify-between gap-2 text-sm sm:text-base font-medium text-cirqa-negro">
                                                                                                  <div className="min-w-0">
                                                                                                    <span className="block font-bold leading-tight">Total a pagar</span>
                                                                                                    {totalDiscount > 0 && (
                                                                                                      <span className="text-[10px] text-emerald-700 font-medium block">
                                                                                                        Ahorro total de ${totalDiscount.toLocaleString('es-AR')} aplicado
                                                                                                        <span className="text-[10px] text-emerald-700 font-medium block truncate">
                                                                                                          Ahorrás ${totalDiscount.toLocaleString('es-AR')} en esta compra
                                                                                                          {/* Garantías dentro del área scrolleable para mantener el footer fijo ultra-compacto */}
                                                                                                          <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 pt-1 text-[10px] text-cirqa-negro/50">
                                                                                                            <span className="flex items-center gap-1">
                                                                                                              <Lock className="w-3 h-3 text-emerald-600" />
                                                                                                              Pago Seguro SSL
                                                                                                            </span>
                                                                                                            {/* Botón Principal de Confirmación / Pago */}
                                                                                                            {paymentMethod === 'mercadopago' ? (
                                                                                                              <button
                                                                                                                type="button"
                                                                                                                onClick={handleSubmitCheckout}
                                                                                                                disabled={isSubmitting || activeItems.length === 0}
                                                                                                                className="w-full min-h-[48px] py-3.5 px-5 rounded-2xl bg-[#009EE3] hover:bg-[#0086C3] text-white font-semibold text-sm tracking-wide shadow-lg shadow-[#009EE3]/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                                                                                                              >
                                                                                                                {isSubmitting ? (
                                                                                                                  <>
                                                                                                                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin flex-shrink-0" />
                                                                                                                    <span>Conectando con Mercado Pago...</span>
                                                                                                                  </>
                                                                                                                ) : (
                                                                                                                  <>
                                                                                                                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-white/90 flex-shrink-0" />
                                                                                                                    <span>Pagar con Mercado Pago</span>
                                                                                                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                                                                                                                  </>
                                                                                                                )}
                                                                                                              </button>
                                                                                                            ) : (
                                                                                                              <button
                                                                                                                type="button"
                                                                                                                onClick={handleSubmitCheckout}
                                                                                                                disabled={isSubmitting || activeItems.length === 0}
                                                                                                                className="w-full min-h-[48px] py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm tracking-wide shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                                                                                                              >
                                                                                                                {isSubmitting ? (
                                                                                                                  <>
                                                                                                                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin flex-shrink-0" />
                                                                                                                    <span>Registrando orden...</span>
                                                                                                                  </>
                                                                                                                ) : (
                                                                                                                  <>
                                                                                                                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white/90 flex-shrink-0" />
                                                                                                                    <span>Confirmar con 15% OFF · Transferencia</span>
                                                                                                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                                                                                                                  </>
                                                                                                                )}
                                                                                                              </button>
                                                                                                            )}
                                                                                                            <span>•</span>
                                                                                                            <span>Atención Directa</span>
                                                                                                            <span>•</span>
                                                                                                            <span className="flex items-center gap-1">
                                                                                                              <ShieldCheck className="w-3 h-3 text-cirqa-primario" />
                                                                                                              Garantía Oficial CIRQA
                                                                                                            </span>
                                                                                                          </div>
                                                                                                        </div>
                                                                                                        <span className="font-mono text-xl font-bold text-cirqa-negro">
                                                                                                          <span className="font-mono text-lg sm:text-xl font-bold text-cirqa-negro flex-shrink-0">
                                                                                                            $ {total.toLocaleString('es-AR')}
                                                                                                          </span>
                                                                                                        </div>

                                                                                                        {/* BOTÓN MERCADO PAGO */}
                                                                                                        {paymentMethod === 'mercadopago' && (
                                                                                                          <button
                                                                                                            type="submit"
                                                                                                            form="checkout-form"
                                                                                                            onClick={handleSubmitCheckout}
                                                                                                            disabled={isSubmitting || activeItems.length === 0}
                                                                                                            className="w-full py-4 px-6 rounded-2xl bg-[#009EE3] hover:bg-[#0086C3] text-white font-semibold text-sm tracking-wide shadow-lg shadow-[#009EE3]/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                                                                                                            className="w-full py-3.5 sm:py-4 px-4 sm:px-6 rounded-2xl bg-[#009EE3] hover:bg-[#0086C3] text-white font-semibold text-xs sm:text-sm tracking-wide shadow-lg shadow-[#009EE3]/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                                                                                                          >
                                                                                                            {isSubmitting ? (
                                                                                                              <>
                                                                                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                                                                                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin flex-shrink-0" />
                                                                                                                <span>Conectando con Mercado Pago...</span>
                                                                                                              </>
                                                                                                            ) : (
                                                                                                              <>
                                                                                                                <CreditCard className="w-5 h-5 text-white/90" />
                                                                                                                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-white/90 flex-shrink-0" />
                                                                                                                <span>Pagar con Mercado Pago</span>
                                                                                                                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono">
                                                                                                                  <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-mono flex-shrink-0">
                                                                                                                    $ {total.toLocaleString('es-AR')}
                                                                                                                  </span>
                                                                                                                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                                                                                                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                                                                                                                </>
                                                                                                                {/* Botón Principal de Confirmación / Pago */}
                                                                                                                {paymentMethod === 'mercadopago' ? (
                                                                                                                  <button
                                                                                                                    type="button"
                                                                                                                    onClick={handleSubmitCheckout}
                                                                                                                    disabled={isSubmitting || activeItems.length === 0}
                                                                                                                    className="w-full min-h-[48px] py-3.5 px-5 rounded-2xl bg-[#009EE3] hover:bg-[#0086C3] text-white font-semibold text-sm tracking-wide shadow-lg shadow-[#009EE3]/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                                                                                                                  >
                                                                                                                    {isSubmitting ? (
                                                                                                                      <>
                                                                                                                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin flex-shrink-0" />
                                                                                                                        <span>Conectando con Mercado Pago...</span>
                                                                                                                      </>
                                                                                                                    ) : (
                                                                                                                      <>
                                                                                                                        <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-white/90 flex-shrink-0" />
                                                                                                                        <span>Pagar con Mercado Pago</span>
                                                                                                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                                                                                                                      </>
                                                                                                                    )}
                                                                                                                  </button>
                                                                                                                ) : (
                                                                                                                  <button
                                                                                                                    type="button"
                                                                                                                    onClick={handleSubmitCheckout}
                                                                                                                    disabled={isSubmitting || activeItems.length === 0}
                                                                                                                    className="w-full min-h-[48px] py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm tracking-wide shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                                                                                                                  >
                                                                                                                    {isSubmitting ? (
                                                                                                                      <>
                                                                                                                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin flex-shrink-0" />
                                                                                                                        <span>Registrando orden...</span>
                                                                                                                      </>
                                                                                                                    ) : (
                                                                                                                      <>
                                                                                                                        <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white/90 flex-shrink-0" />
                                                                                                                        <span>Confirmar con 15% OFF · Transferencia</span>
                                                                                                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                                                                                                                      </>
                                                                                                                    )}
                                                                                                                  </button>
                                                                                                                )}
                                                                                                              </button>
            )}
                                                                                                            {/* ========================================================= */}
                                                                                                            {/* 5. FOOTER FIJO ULTRA-COMPACTO (< 120px en mobile)         */}
                                                                                                            {/* ========================================================= */}
                                                                                                            <div
                                                                                                              className="px-4 sm:px-6 pt-2.5 pb-3 border-t border-cirqa-negro/10 bg-[#FBFBFA] flex-shrink-0 space-y-2"
                                                                                                              style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}
                                                                                                            >
                                                                                                              {(hasValidationErrors || submissionError) && (
                                                                                                                <div className="px-3 py-1.5 rounded-xl bg-cirqa-carmin/10 border border-cirqa-carmin/25 text-cirqa-carmin text-[11px] font-medium flex items-center gap-2">
                                                                                                                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                                                                                                  <span className="leading-snug truncate">
                                                                                                                    {submissionError || 'Revisá los campos obligatorios marcados en rojo.'}
                                                                                                                  </span>
                                                                                                                </div>
                                                                                                              )}

                                                                                                              {/* BOTÓN TRANSFERENCIA BANCARIA */}
                                                                                                              {paymentMethod === 'transfer' && (
                                                                                                                <button
                                                                                                                  type="submit"
                                                                                                                  form="checkout-form"
                                                                                                                  onClick={handleSubmitCheckout}
                                                                                                                  disabled={isSubmitting || activeItems.length === 0}
                                                                                                                  className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm tracking-wide shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                                                                                                                  className="w-full py-3.5 sm:py-4 px-4 sm:px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                                                                                                                >
                                                                                                                  {isSubmitting ? (
                                                                                                                    <>
                                                                                                                      <Loader2 className="w-5 h-5 animate-spin" />
                                                                                                                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin flex-shrink-0" />
                                                                                                                      <span>Registrando orden...</span>
                                                                                                                    </>
                                                                                                                  ) : (
                                                                                                                    <>
                                                                                                                      <MessageCircle className="w-5 h-5 text-white/90" />
                                                                                                                      <span>Confirmar con 15% OFF y Enviar por WhatsApp</span>
                                                                                                                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                                                                                                      <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white/90 flex-shrink-0" />
                                                                                                                      <span>Confirmar con 15% OFF · Transferencia</span>
                                                                                                                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                                                                                                                    </>
                                                                                                                  )}
                                                                                                                </button>
                                                                                                              )}
                                                                                                              {/* Total Final en una línea compacta */}
                                                                                                              <div className="flex items-center justify-between gap-2 text-sm sm:text-base font-medium text-cirqa-negro">
                                                                                                                <div className="flex items-center gap-2 min-w-0">
                                                                                                                  <span className="font-bold whitespace-nowrap">Total a pagar</span>
                                                                                                                  {totalDiscount > 0 && (
                                                                                                                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full truncate">
                                                                                                                      Ahorrás ${totalDiscount.toLocaleString('es-AR')}
                                                                                                                    </span>
                                                                                                                  )}
                                                                                                                </div>
                                                                                                                <span className="font-mono text-lg sm:text-xl font-bold text-cirqa-negro flex-shrink-0">
                                                                                                                  $ {total.toLocaleString('es-AR')}
                                                                                                                </span>
                                                                                                              </div>

                                                                                                              <div className="flex items-center justify-center gap-3 pt-1 text-[10px] text-cirqa-negro/50">
                                                                                                                <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[10px] text-cirqa-negro/50">
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
              {/* Botón Principal de Confirmación / Pago */}
                                                                                                        {paymentMethod === 'mercadopago' ? (
                                                                                                          <button
                                                                                                            type="button"
                                                                                                            onClick={handleSubmitCheckout}
                                                                                                            disabled={isSubmitting || activeItems.length === 0}
                                                                                                            className="w-full min-h-[48px] py-3.5 px-5 rounded-2xl bg-[#009EE3] hover:bg-[#0086C3] text-white font-semibold text-sm tracking-wide shadow-lg shadow-[#009EE3]/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                                                                                                          >
                                                                                                            {isSubmitting ? (
                                                                                                              <>
                                                                                                                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin flex-shrink-0" />
                                                                                                                <span>Conectando con Mercado Pago...</span>
                                                                                                              </>
                                                                                                            ) : (
                                                                                                              <>
                                                                                                                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-white/90 flex-shrink-0" />
                                                                                                                <span>Pagar con Mercado Pago</span>
                                                                                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                                                                                                              </>
                                                                                                            )}
                                                                                                          </button>
                                                                                                        ) : (
                                                                                                          <button
                                                                                                            type="button"
                                                                                                            onClick={handleSubmitCheckout}
                                                                                                            disabled={isSubmitting || activeItems.length === 0}
                                                                                                            className="w-full min-h-[48px] py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm tracking-wide shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                                                                                                          >
                                                                                                            {isSubmitting ? (
                                                                                                              <>
                                                                                                                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin flex-shrink-0" />
                                                                                                                <span>Registrando orden...</span>
                                                                                                              </>
                                                                                                            ) : (
                                                                                                              <>
                                                                                                                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white/90 flex-shrink-0" />
                                                                                                                <span>Confirmar con 15% OFF · Transferencia</span>
                                                                                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                                                                                                              </>
                                                                                                            )}
                                                                                                          </button>
                                                                                                        )}
                                                                                                      </div>
              </div>
                                                                                                </div>
                                                                                              </motion.div>
                                                                                            </div>
                                                                                          </div>
                                                                                      </div>
          </motion.div>
                                                                              </div>
      )}
                                                                            </AnimatePresence>
                                                                            );
                                                                          </AnimatePresence>
                                                                          );
                                                                        </AnimatePresence>
                                                                      );
                                                                    </AnimatePresence>
                                                                  );
}
