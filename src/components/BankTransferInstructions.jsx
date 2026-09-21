import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Copy,
  Check,
  CreditCard,
  Hash,
  Landmark,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { BANK_DETAILS } from '../data/bankDetails';
import TransferReceiptUpload from './TransferReceiptUpload';

/**
 * Componente interactivo para mostrar datos bancarios con copiado en un clic
 * y opción de adjuntar comprobante de pago.
 *
 * @param {Object} props
 * @param {string} [props.orderId] - ID de la orden en MongoDB
 * @param {number} [props.amount] - Monto total a transferir
 * @param {boolean} [props.showUploadForm=true] - Si debe mostrar el formulario de comprobante abajo
 * @param {Function} [props.onReceiptSuccess] - Callback cuando el comprobante se sube con éxito
 */
export default function BankTransferInstructions({
  orderId,
  amount,
  showUploadForm = true,
  onReceiptSuccess,
}) {
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Tarjeta de Datos Bancarios */}
      <div className="bg-neutral-950 border border-neutral-800/90 rounded-2xl p-6 shadow-2xl backdrop-blur-sm text-neutral-200">
        {/* Encabezado */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-neutral-800/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/50 border border-red-800/40 flex items-center justify-center text-red-500">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-wide">
                Transferencia Bancaria
              </h3>
              <p className="text-xs text-neutral-400">
                Banco {BANK_DETAILS.bank} • Acreditación manual
              </p>
            </div>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cuenta Oficial</span>
          </div>
        </div>

        {/* Monto sugerido si viene por prop */}
        {amount && (
          <div className="mb-5 p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Monto a transferir:</span>
            <span className="text-lg font-bold text-white font-mono">
              ${Number(amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {/* Campos de la cuenta bancaria */}
        <div className="space-y-3">
          {/* Razón Social */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/60">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-neutral-500" />
              <div>
                <span className="text-[11px] text-neutral-500 block uppercase font-mono">Titular</span>
                <span className="text-sm font-semibold text-white">{BANK_DETAILS.companyName}</span>
              </div>
            </div>
          </div>

          {/* CUIT */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/60">
            <div className="flex items-center gap-2.5">
              <Hash className="w-4 h-4 text-neutral-500" />
              <div>
                <span className="text-[11px] text-neutral-500 block uppercase font-mono">CUIT</span>
                <span className="text-sm font-mono text-neutral-200">{BANK_DETAILS.cuit}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleCopy('cuit', BANK_DETAILS.cuitRaw)}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 text-neutral-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
              title="Copiar CUIT"
            >
              {copiedKey === 'cuit' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>

          {/* Alias */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-red-950/20 border border-red-900/40">
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-4 h-4 text-red-400" />
              <div>
                <span className="text-[11px] text-red-400/80 block uppercase font-mono font-medium">
                  Alias CBU
                </span>
                <span className="text-sm font-bold text-white font-mono tracking-wider">
                  {BANK_DETAILS.alias}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleCopy('alias', BANK_DETAILS.alias)}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-md shadow-red-950"
              title="Copiar Alias"
            >
              {copiedKey === 'alias' ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Alias</span>
                </>
              )}
            </button>
          </div>

          {/* CBU */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/60">
            <div className="min-w-0 pr-2">
              <span className="text-[11px] text-neutral-500 block uppercase font-mono">CBU (22 dígitos)</span>
              <span className="text-xs sm:text-sm font-mono text-neutral-200 block truncate">
                {BANK_DETAILS.cbu}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy('cbu', BANK_DETAILS.cbu)}
              className="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 text-neutral-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
              title="Copiar CBU"
            >
              {copiedKey === 'cbu' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>

          {/* Tipo de Cuenta y Número */}
          <div className="p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/60 flex items-center justify-between text-xs">
            <div>
              <span className="text-[11px] text-neutral-500 block uppercase font-mono">Tipo y N° de Cuenta</span>
              <span className="font-mono text-neutral-300">
                {BANK_DETAILS.bank} • {BANK_DETAILS.accountNumber}
              </span>
            </div>
            <span className="text-neutral-500 text-[11px] font-mono">Pesos Arg ($)</span>
          </div>
        </div>

        {/* Instrucción importante */}
        <div className="mt-4 p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/80 flex items-start gap-2.5 text-xs text-neutral-400">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <span>
            Una vez realizada la transferencia desde tu home banking o app bancaria, adjuntá el comprobante abajo indicando tu número de orden.
          </span>
        </div>
      </div>

      {/* Formulario de carga de comprobante integrado */}
      {showUploadForm && (
        <TransferReceiptUpload
          orderId={orderId}
          onSuccess={onReceiptSuccess}
        />
      )}
    </div>
  );
}
