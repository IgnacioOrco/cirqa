import React, { useState } from 'react';
import { Sparkles, ShieldCheck, Check, ArrowRight, Zap } from 'lucide-react';
import { isCyberMondayActive } from '../utils/cyberMonday';
import { getActiveProductVariants, getPrimaryProductImage, getVariantColor } from '../utils/productImages';
import { useCart } from '../context/CartContext';
import Image from './Image';

/**
 * Vista de Detalle de Producto (ProductDetail) de CIRQA
 * Con validación temporal automática para Cyber Monday (20% OFF global).
 */
export default function ProductDetail({ product = {}, onOpenPrescription }) {
  const { openCheckout } = useCart();
  const [selectedVariantKey, setSelectedVariantKey] = useState(null);

  const activeVariants = getActiveProductVariants(product);
  const currentVariantKey = selectedVariantKey || activeVariants[0]?.key || 'clear';
  const activeVariant = activeVariants.find((v) => v.key === currentVariantKey) || activeVariants[0] || null;

  // Lógica de validación de fecha y cálculo de precio Cyber Monday
  const isCyber = isCyberMondayActive();
  const basePrice = Number(product.price || product.basePrice || 0);
  const modifier = activeVariant?.priceModifier ? Number(activeVariant.priceModifier) : 0;
  const originalPrice = basePrice + modifier;
  const discountedPrice = Math.round(originalPrice * 0.8);
  const finalPrice = isCyber ? discountedPrice : originalPrice;

  const primaryImg = getPrimaryProductImage(product, currentVariantKey);

  const handleBuyNow = () => {
    openCheckout({
      productId: product._id || product.id,
      name: product.name,
      modelCode: product.modelCode || product.code || 'Q-001',
      price: originalPrice,
      image: primaryImg,
      variant: activeVariant,
      variantKey: currentVariantKey,
      variantName: activeVariant?.name,
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-cirqa-negro/10 p-6 md:p-10 shadow-sm max-w-4xl mx-auto my-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Imagen del Producto con Badges */}
        <div className="relative aspect-square bg-[#FAF9F6] rounded-2xl p-6 flex items-center justify-center border border-cirqa-negro/5 overflow-hidden">
          {/* Badge Flotante Cyber Monday */}
          {isCyber && (
            <div className="absolute top-4 left-4 z-20">
              <span className="font-mono text-xs bg-cirqa-primario text-white px-3 py-1 rounded-full font-bold shadow-sm uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                20% OFF CYBER
              </span>
            </div>
          )}

          <Image
            src={primaryImg}
            alt={product.name || 'Armazón CIRQA'}
            width={450}
            height={450}
            className="w-full h-full object-contain mix-blend-multiply"
          />
        </div>

        {/* Información y Configuración de Compra */}
        <div className="space-y-6">
          <div>
            <span className="font-mono text-xs font-semibold text-cirqa-primario bg-cirqa-primario/10 px-2.5 py-0.5 rounded-full border border-cirqa-primario/20">
              {product.modelCode || product.code || 'CIRQA-OPTIC'}
            </span>
            <h1 className="text-2xl md:text-3xl font-light text-cirqa-negro tracking-tight mt-2">
              {product.name || 'Armazón CIRQA'}
            </h1>
            <p className="text-xs text-cirqa-negro/60 mt-1 leading-relaxed">
              {product.description || 'Acetato de celulosa premium y cristales circadianos de alta definición con protección 100% UV400.'}
            </p>
          </div>

          {/* Bloque de Precio Cyber Monday */}
          <div className="p-4 bg-cirqa-surface rounded-2xl border border-cirqa-negro/10">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <div className="flex items-baseline gap-2">
                {isCyber ? (
                  <>
                    <span className="line-through text-gray-400 text-sm font-mono">
                      ${originalPrice.toLocaleString('es-AR')}
                    </span>
                    <span className="text-cirqa-primario font-bold font-mono text-2xl">
                      ${discountedPrice.toLocaleString('es-AR')}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-bold font-mono text-cirqa-negro">
                    ${originalPrice.toLocaleString('es-AR')}
                  </span>
                )}
              </div>

              {isCyber && (
                <span className="text-[10px] font-black uppercase tracking-wider text-white bg-cirqa-primario px-2.5 py-1 rounded-full shadow-xs">
                  20% OFF CYBER
                </span>
              )}
            </div>

            <div className="text-xs text-cirqa-negro/70 mt-2 space-y-1">
              <p className="font-medium text-emerald-700">
                15% OFF adicional pagando con Transferencia: <strong>${Math.round(finalPrice * 0.85).toLocaleString('es-AR')}</strong>
              </p>
              <p>
                o 6 cuotas sin interés de <strong>${Math.round(finalPrice / 6).toLocaleString('es-AR')}</strong>
              </p>
            </div>
          </div>

          {/* Selector de Cristales Circadianos */}
          {activeVariants.length > 0 && (
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-cirqa-negro/70 block mb-2">
                Cristal Circadiano:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {activeVariants.map((v) => {
                  const isSelected = v.key === currentVariantKey;
                  return (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => setSelectedVariantKey(v.key)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-cirqa-primario bg-cirqa-primario/5 shadow-2xs ring-1 ring-cirqa-primario/20'
                          : 'border-cirqa-negro/10 bg-white hover:border-cirqa-negro/30'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-black/15 flex-shrink-0"
                        style={{ backgroundColor: getVariantColor(v) }}
                      />
                      <span className="text-xs font-semibold text-cirqa-negro truncate">{v.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTA de Compra */}
          <button
            type="button"
            onClick={handleBuyNow}
            className="w-full bg-cirqa-negro hover:bg-cirqa-primario text-white font-bold text-xs uppercase tracking-wider py-4 rounded-full transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Comprar Ahora · ${finalPrice.toLocaleString('es-AR')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
