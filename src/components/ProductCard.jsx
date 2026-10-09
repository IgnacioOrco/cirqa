import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { formatMediaUrl } from '../services/api';
import {
  getPrimaryProductImage,
  getHoverProductImage,
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

  // Opciones de variantes o cristales circadianos
  const variantOptions =
    product.hasVariants && Array.isArray(product.variants) && product.variants.length > 0
      ? product.variants.map((v) => ({
          key: v.key,
          name: v.name,
          tag: v.subtitle || '',
          color: v.badgeColor || '#FFFFFF',
          priceModifier: Number(v.priceModifier) || 0,
        }))
      : FILTERS.map((f) => ({
          key: f.id,
          name: f.name,
          tag: f.tag,
          color: f.hexCode,
          priceModifier: 0,
        }));

  const activeVariantKey =
    externalVariantKey ||
    internalVariantKey ||
    product.lensDefault ||
    variantOptions[0]?.key ||
    'dia';

  const activeOptionObj =
    variantOptions.find((o) => matchVariantKey(o.key, activeVariantKey)) ||
    FILTERS.find((f) => matchVariantKey(f.id, activeVariantKey)) ||
    variantOptions[0] ||
    FILTERS[0];

  // Selección determinista de Portada y Hover para la variante activa del MISMO modelo
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
      className="bg-[#FAF9F5] rounded-3xl border border-cirqa-negro/10 overflow-hidden shadow-xs hover:shadow-xl hover:border-cirqa-negro/20 transition-all flex flex-col group cursor-pointer relative"
    >
      {/* Contenedor Visual de la Foto - Integración Limpia sin Cuadro */}
      <div className="aspect-[4/3] bg-transparent relative flex items-center justify-center overflow-hidden">
        {/* Resplandor ambiental adaptativo según cristal */}
        <div
          className="absolute inset-0 m-auto w-36 h-36 rounded-full blur-2xl opacity-20 pointer-events-none transition-colors duration-500"
          style={{ backgroundColor: glowColor }}
        />

        {/* Escenario de Imagen con Crossfade Suave - Eliminación Total de Cuadro */}
        <div className="relative w-full h-full flex items-center justify-center bg-transparent z-10">
          {/* Foto de Portada (Base) */}
          <img
            src={formatMediaUrl(primaryImg)}
            alt={`${product.name} - ${activeOptionObj?.name || 'CIRQA'}`}
            className={`w-full h-full object-contain p-2 mix-blend-multiply filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.06)] group-hover:scale-105 transition-all duration-300 select-none ${
              isHovered && hasDistinctHover ? 'opacity-0' : 'opacity-100'
            }`}
            style={{ mixBlendMode: 'multiply' }}
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/products/_DSC8649.webp';
            }}
          />

          {/* Foto Lateral / Perfil al Hover (Mismo Modelo y Variante) */}
          {hasDistinctHover && (
            <img
              src={formatMediaUrl(hoverImg)}
              alt={`${product.name} - Vista lateral`}
              className={`w-full h-full object-contain p-2 mix-blend-multiply filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.06)] group-hover:scale-105 transition-all duration-300 select-none absolute inset-0 m-auto ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ mixBlendMode: 'multiply' }}
              loading="lazy"
            />
          )}
        </div>

        {/* Badge Flotante Superior: Modelo & Forma */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5">
          <span className="font-mono text-[10px] bg-white/90 backdrop-blur-xs px-2.5 py-0.5 rounded-full font-semibold text-cirqa-negro/80 shadow-2xs border border-cirqa-negro/10">
            {product.modelCode || product.code}
          </span>
          {product.frameShape && (
            <span className="text-[9px] uppercase tracking-wider font-semibold text-cirqa-primario bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full border border-cirqa-negro/10">
              {product.frameShape}
            </span>
          )}
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
            {product.description || 'Ingeniería óptica y acetato bio aeroespacial.'}
          </p>
        </div>

        {/* Swatches de Cristales Circadianos / Variantes */}
        <div className="pt-2 border-t border-cirqa-negro/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-cirqa-negro/40 uppercase tracking-wider font-medium">
              Cristal:
            </span>
            <div className="flex items-center gap-1.5">
              {variantOptions.slice(0, 4).map((variant) => {
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
