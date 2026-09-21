import React, { useState, useEffect, useRef } from 'react';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, ShieldCheck, Lock } from 'lucide-react';

/**
 * Componente PaymentBrick de Mercado Pago para Checkout seguro
 * 
 * @param {Object} props
 * @param {string} props.preferenceId - ID de la preferencia generada en el backend
 * @param {number} [props.amount] - Monto total a pagar (opcional si la preferencia lo define)
 * @param {string} [props.publicKey] - Public Key de Mercado Pago (por defecto desde VITE_MERCADOPAGO_PUBLIC_KEY)
 * @param {Function} [props.onPaymentSuccess] - Callback ejecutado cuando el pago se procesa exitosamente
 * @param {Function} [props.onPaymentError] - Callback al ocurrir un error durante el pago
 * @param {Function} [props.onReady] - Callback disparado cuando el Brick está completamente renderizado e interactivo
 */
export default function MercadoPagoPaymentBrick({
  preferenceId,
  amount,
  publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY,
  onPaymentSuccess,
  onPaymentError,
  onReady: externalOnReady,
}) {
  const [isSdkInitialized, setIsSdkInitialized] = useState(false);
  const [isBrickReady, setIsBrickReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const isMountedRef = useRef(true);

  // 1. Inicializar el SDK de Mercado Pago una sola vez
  useEffect(() => {
    isMountedRef.current = true;

    if (!publicKey) {
      setErrorMessage('Clave pública de Mercado Pago no configurada (VITE_MERCADOPAGO_PUBLIC_KEY).');
      return;
    }

    try {
      initMercadoPago(publicKey, { locale: 'es-AR' });
      setIsSdkInitialized(true);
    } catch (err) {
      console.error('[MercadoPago] Error inicializando SDK:', err);
      setErrorMessage('No se pudo inicializar la pasarela de pagos.');
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [publicKey]);

  // 2. Callback onReady del Payment Brick
  const handleOnReady = () => {
    if (!isMountedRef.current) return;
    console.log('[MercadoPago Brick] onReady: Pasarela lista e interactiva.');
    setIsBrickReady(true);
    if (externalOnReady) {
      externalOnReady();
    }
  };

  // 3. Callback onError del Payment Brick
  const handleOnError = (error) => {
    if (!isMountedRef.current) return;
    console.error('[MercadoPago Brick] onError:', error);
    setErrorMessage(error?.message || 'Ocurrió un inconveniente al cargar el formulario de pago.');
    if (onPaymentError) {
      onPaymentError(error);
    }
  };

  // 4. Callback onSubmit: Procesamiento del pago
  const handleSubmit = async (param) => {
    try {
      console.log('[MercadoPago Brick] onSubmit iniciado:', param);
      // Si usas procesamiento mediante backend custom, aquí enviarías param.formData
      if (onPaymentSuccess) {
        await onPaymentSuccess(param);
      }
    } catch (error) {
      console.error('[MercadoPago Brick] Error en procesamiento de onSubmit:', error);
      if (onPaymentError) {
        onPaymentError(error);
      }
    }
  };

  // 5. Configuración de personalización visual para diseño CIRQA
  const customization = {
    visual: {
      style: {
        theme: 'dark', // Opciones: 'default', 'dark', 'flat', 'bootstrap'
        customVariables: {
          baseColor: '#D90429', // Acento rojo CIRQA
          baseColorSecondary: '#E0A96D', // Acento maíz CIRQA
          outlinePrimaryColor: '#D90429',
          formBackgroundColor: '#0A0A0A',
          formInputsBorderColor: '#262626',
        },
      },
      hidePaymentButton: false,
    },
    paymentMethods: {
      ticket: 'all',
      bankTransfer: 'all',
      creditCard: 'all',
      debitCard: 'all',
      mercadoPago: 'all',
    },
  };

  const initialization = {
    preferenceId: preferenceId || undefined,
    amount: amount || undefined,
  };

  return (
    <div className="relative w-full max-w-xl mx-auto bg-neutral-950 border border-neutral-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-sm overflow-hidden text-neutral-200">
      {/* Encabezado con insignias de seguridad */}
      <div className="flex items-center justify-between pb-5 mb-5 border-b border-neutral-800/60">
        <div>
          <h3 className="text-lg font-semibold text-white tracking-wide">
            Pago Seguro
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Transacción encriptada de extremo a extremo
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-mono">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>SSL 256-bit</span>
        </div>
      </div>

      {/* Estado de Error */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 p-4 rounded-xl bg-red-950/40 border border-red-800/50 flex items-start gap-3 text-red-200 text-sm"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block text-red-300">Error en el módulo de pago</span>
            {errorMessage}
          </div>
        </motion.div>
      )}

      {/* Contenedor del Formulario y Skeleton / Spinner de Carga */}
      <div className="relative min-h-[380px]">
        {/* Spinner y Skeleton de Carga mientras onReady no se haya disparado */}
        <AnimatePresence>
          {(!isBrickReady || !isSdkInitialized) && !errorMessage && (
            <motion.div
              key="brick-loader"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-neutral-950/95 backdrop-blur-sm rounded-xl p-6"
            >
              <div className="relative flex items-center justify-center mb-4">
                <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
                <div className="absolute inset-0 rounded-full blur-md bg-red-600/20 animate-pulse" />
              </div>
              <p className="text-sm font-medium text-neutral-200">
                Iniciando pasarela de pago...
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                Cargando métodos de pago seguros de Mercado Pago
              </p>

              {/* Skeleton sutil simulando inputs */}
              <div className="w-full max-w-sm mt-6 space-y-3 opacity-30">
                <div className="h-10 bg-neutral-800 rounded-lg animate-pulse" />
                <div className="h-10 bg-neutral-800 rounded-lg animate-pulse delay-100" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-10 bg-neutral-800 rounded-lg animate-pulse delay-200" />
                  <div className="h-10 bg-neutral-800 rounded-lg animate-pulse delay-300" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Render del Brick oficial de Mercado Pago */}
        {isSdkInitialized && preferenceId && !errorMessage && (
          <div className={`transition-opacity duration-500 ${isBrickReady ? 'opacity-100' : 'opacity-0'}`}>
            <Payment
              initialization={initialization}
              customization={customization}
              onSubmit={handleSubmit}
              onReady={handleOnReady}
              onError={handleOnError}
            />
          </div>
        )}
      </div>

      {/* Footer de garantía */}
      <div className="mt-6 pt-4 border-t border-neutral-900 flex items-center justify-center gap-2 text-xs text-neutral-500">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>Pagos procesados de forma segura mediante Mercado Pago</span>
      </div>
    </div>
  );
}

