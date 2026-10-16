import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { formatMediaUrl } from '../services/api';
import {
  getPrimaryProductImage,
  getHoverProductImage,
  getImagesForVariant,
  getActiveProductVariants,
  matchVariantKey,
  DEFAULT_CIRCADIAN_VARIANTS,
} from '../utils/productImages';
import { FILTERS } from '../data/filters';

/**
 * Tarjeta de Producto de CIRQA
 * - Integración visual limpia: sin cuadros blancos duros, bordes artificiales ni fondos desconectados.
 * - Fondo suave off-white unificado con mix-blend-multiply para fundido perfecto de las fotos de estudio.
 * - Reactividad completa a swatches de variantes: al hacer clic, cambia la imagen a la variante elegida.
 * - Al hacer hover, muestra la foto lateral/perfil DEL MISMO MODELO Y VARIANTE.
 */
export default function ProductCard({
  product,
  onOpenConfigurator,
  selectedVariantKey: externalVariantKey = null,
  onVariantChange,
}) {
  const [internalVariantKey, setInternalVariantKey] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  // Opciones de variantes que cumplen la Regla de Oro (tienen al menos 1 foto propia asignada)
  const activeVariants = getActiveProductVariants(product);
  const variantOptions = activeVariants.map((v) => ({
    key: v.key,
    name: v.name,
    tag: v.subtitle || '',
    color: v.colorHex || v.badgeColor || '#FFFFFF',
    priceModifier: Number(v.priceModifier) || 0,
  }));

  const activeVariantKey =
    externalVariantKey ||
    internalVariantKey ||
    variantOptions[0]?.key ||
    'clear';

  const activeOptionObj =
    variantOptions.find((o) => matchVariantKey(o.key, activeVariantKey)) ||
    variantOptions[0] ||
    FILTERS[0];

  // Selección determinista de Portada y Hover para la variante activa del MISMO modelo usando getImagesForVariant
  const variantImages = getImagesForVariant(product, activeVariantKey);
  const primaryImg = getPrimaryProductImage(product, activeVariantKey);
  const hoverImg = getHoverProductImage(product, primaryImg, activeVariantKey);
  const hasDistinctHover = hoverImg && hoverImg !== primaryImg;

  const glowColor = activeOptionObj?.color || '#F3B93A';

  // Manejo de clic en swatch de cristal/variante
  const handleSwatchClick = (e, varKey) => {
    e.stopPropagation();
    setInternalVariantKey(varKey);
    if (onVariantChange) {
      onVariantChange(product.id || product._id, varKey);
    }
  };

  // Precio reactivo con modificador si aplica
  const basePrice = Number(product.price) || 0;
  const modifier = activeOptionObj?.priceModifier || 0;
  const finalPrice = basePrice + modifier;
  const formattedPrice = `$ ${finalPrice.toLocaleString('es-AR')}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpenConfigurator && onOpenConfigurator(product, activeVariantKey)}
      className="bg-white rounded-2xl border border-cirqa-negro/10 overflow-hidden shadow-sm hover:shadow-xl hover:border-cirqa-negro/20 transition-all flex flex-col group cursor-pointer relative"
    >
      {/* Contenedor Visual de la Foto - Integración Limpia con Fondo Blanco */}
      <div className="aspect-[4/3] bg-white relative flex items-center justify-center overflow-hidden">
        {/* Resplandor ambiental adaptativo según cristal */}
        <div
          className="absolute inset-0 m-auto w-36 h-36 rounded-full blur-2xl opacity-20 pointer-events-none transition-colors duration-500"
          style={{ backgroundColor: glowColor }}
        />

        {/* Escenario de Imagen con Crossfade Suave - Fondo Blanco Unificado */}
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-white z-10">
          {/* Foto de Portada (Base) */}
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={formatMediaUrl(primaryImg)}
              alt={`${product.name} - ${activeOptionObj?.name || 'CIRQA'}`}
              className={`w-full h-full object-contain p-2 mix-blend-multiply transform transition-all duration-500 ease-out group-hover:-translate-y-1.5 group-hover:scale-105 select-none ${
                isHovered && hasDistinctHover ? 'opacity-0' : 'opacity-100'
              }`}
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/placeholder-glass.svg';
              }}
            />

            {/* Foto Lateral / Perfil al Hover (Mismo Modelo y Variante) */}
            {hasDistinctHover && (
              <img
                src={formatMediaUrl(hoverImg)}
                alt={`${product.name} - Vista lateral`}
                className={`w-full h-full object-contain p-2 mix-blend-multiply transform transition-all duration-500 ease-out group-hover:-translate-y-1.5 group-hover:scale-105 select-none absolute inset-0 m-auto ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}
                loading="lazy"
              />
            )}
          </div>

          {/* Sombra de contacto orgánica para sensación de producto flotando */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-40 h-2.5 bg-black/10 rounded-[100%] blur-sm pointer-events-none transition-all duration-500 group-hover:w-44 group-hover:bg-black/12 group-hover:blur-md" />
          <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 w-24 h-1 bg-black/18 rounded-[100%] blur-xs pointer-events-none transition-all duration-500 group-hover:w-20 group-hover:opacity-60" />
        </div>

        {/* Badge Flotante Superior: Código de Modelo */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5">
          <span className="font-mono text-[10px] bg-white/95 backdrop-blur-xs px-2.5 py-0.5 rounded-full font-semibold text-cirqa-negro/80 shadow-2xs border border-cirqa-negro/10">
            {product.modelCode || product.code}
          </span>
        </div>
      </div>

      {/* Información del Producto */}
      <div className="p-5 pt-3 flex flex-col flex-grow justify-between gap-4">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-base font-semibold text-cirqa-negro tracking-tight group-hover:text-cirqa-primario transition-colors">
              {product.name}
            </h3>
            <span className="font-mono text-sm font-bold text-cirqa-negro flex-shrink-0">
              {formattedPrice}
            </span>
          </div>
          <p className="text-[11px] text-cirqa-negro/60 font-light line-clamp-1 mt-0.5">
            {product.description || 'Acetato de celulosa de alta densidad y protección 100% UV400.'}
          </p>
        </div>

        {/* Swatches de Cristales Circadianos / Variantes */}
        <div className="pt-2 border-t border-cirqa-negro/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-cirqa-negro/40 uppercase tracking-wider font-medium">
              Cristal:
            </span>
            <div className="flex items-center gap-1.5">
              {variantOptions.map((variant) => {
                const isSelected = matchVariantKey(activeVariantKey, variant.key);
                return (
                  <button
                    key={variant.key}
                    type="button"
                    onClick={(e) => handleSwatchClick(e, variant.key)}
                    title={`${variant.name} (${variant.tag || ''})`}
                    className={`w-5 h-5 rounded-full border transition-all cursor-pointer relative flex items-center justify-center ${
                      isSelected
                        ? 'ring-2 ring-cirqa-negro scale-110 shadow-xs'
                        : 'border-cirqa-negro/20 hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: variant.color || '#FFFFFF',
                      borderColor: `${variant.color || '#000000'}88`,
                    }}
                  />
                );
              })}
            </div>
          </div>

          <span className="text-[10px] font-medium text-cirqa-negro/70 uppercase tracking-wider">
            {activeOptionObj?.name || 'Personalizar'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
