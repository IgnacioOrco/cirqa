import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, ShieldCheck, Check, Sparkles, Layers, ZoomIn } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { FILTERS } from '../data/filters';
import { formatMediaUrl } from '../services/api';
import {
  normalizeImageUrl,
  getPrimaryProductImage,
  getHoverProductImage,
  matchVariantKey,
} from '../utils/productImages';
import { useCart } from '../context/CartContext';

export default function ConfiguratorModal({
  isOpen,
  onClose,
  initialModel = null,
  initialFilter = null,
  initialVariantKey = null,
  initialVariant = null,
  onOpenPrescription,
}) {
  const { products } = useProducts({ all: false });
  const { openCheckout } = useCart();

  const [selectedModel, setSelectedModel] = useState(initialModel || null);
  const [selectedFilter, setSelectedFilter] = useState(initialFilter || FILTERS[1]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // Cerrar lightbox con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isZoomOpen) {
        setIsZoomOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZoomOpen]);

  // Sincronizar modelo inicial recibido como prop
  useEffect(() => {
    if (initialModel) {
      setSelectedModel(initialModel);
    } else if (!selectedModel && products.length > 0) {
      setSelectedModel(products[0]);
    }
  }, [initialModel, products]);

  // Sincronizar filtro inicial o key de variante
  useEffect(() => {
    if (initialFilter) {
      setSelectedFilter(initialFilter);
    } else if (initialVariantKey) {
      const matchedFilter = FILTERS.find((f) => f.id === initialVariantKey);
      if (matchedFilter) {
        setSelectedFilter(matchedFilter);
      }
    }
  }, [initialFilter, initialVariantKey]);

  const currentModel = selectedModel || products[0] || {};
  const hasVariants = Boolean(
    currentModel.hasVariants &&
    Array.isArray(currentModel.variants) &&
    currentModel.variants.length > 0
  );
  const variantsList = hasVariants ? currentModel.variants : [];

  // Sincronizar variante seleccionada por defecto al cambiar de modelo o recibir initialVariantKey
  useEffect(() => {
    if (hasVariants && variantsList.length > 0) {
      if (initialVariantKey) {
        const found = variantsList.find((v) => matchVariantKey(v.key, initialVariantKey));
        if (found) {
          setSelectedVariant(found);
          return;
        }
      }
      if (initialVariant) {
        setSelectedVariant(initialVariant);
        return;
      }
      const defaultVar = variantsList.find((v) => v.isDefault) || variantsList[0];
      setSelectedVariant(defaultVar);
    } else {
      setSelectedVariant(null);
    }
  }, [currentModel?._id, currentModel?.id, hasVariants, initialVariantKey, initialVariant]);

  // Lista reactiva de fotos disponibles estrictamente para la variante activa (currentVariantImages)
  const currentVariantImages = React.useMemo(() => {
    const allImages = Array.isArray(currentModel.images) ? currentModel.images : [];
    const validImages = allImages.filter((img) => img && (img.url || img.imageUrl));

    const currentKey = selectedVariant ? selectedVariant.key : selectedFilter?.id;
    if (currentKey && validImages.length > 0) {
      const variantMatched = validImages.filter((img) => matchVariantKey(img.variantKey, currentKey));
      if (variantMatched.length > 0) {
        return variantMatched.map((img, idx) => ({
          ...img,
          _id: img._id || `var-img-${idx}`,
          url: normalizeImageUrl(img.url || img.imageUrl),
        }));
      }
    }

    // Si la variante no tiene fotos específicas, usar fotos neutrales o generales del producto
    if (validImages.length > 0) {
      const neutralImages = validImages.filter((img) => !img.variantKey);
      const chosen = neutralImages.length > 0 ? neutralImages : validImages;
      return chosen.map((img, idx) => ({
        ...img,
        _id: img._id || `gen-img-${idx}`,
        url: normalizeImageUrl(img.url || img.imageUrl),
      }));
    }

    const fallbackUrl = currentModel.image_url || getPrimaryProductImage(currentModel, selectedVariant?.key);
    return [{ _id: 'fallback-0', url: fallbackUrl, tag: 'front', isPrimary: true }];
  }, [currentModel, selectedVariant, selectedFilter]);

  // Sincronizar reactivamente la foto frontal (tag === 'front' o primera) al cambiar de variante
  useEffect(() => {
    if (currentVariantImages.length > 0) {
      const frontIdx = currentVariantImages.findIndex(
        (img) => img.tag === 'front' || Boolean(img.isPrimary)
      );
      setActiveImageIndex(frontIdx >= 0 ? frontIdx : 0);
    } else {
      setActiveImageIndex(0);
    }
  }, [selectedVariant?.key, selectedFilter?.id, currentVariantImages]);

  // Manejador de selección de variante con salto inmediato a la foto frontal
  const handleSelectVariant = (variant) => {
    setSelectedVariant(variant);
    const allImages = Array.isArray(currentModel.images) ? currentModel.images : [];
    const validImages = allImages.filter((img) => img && (img.url || img.imageUrl));
    const variantMatched = validImages.filter((img) => matchVariantKey(img.variantKey, variant.key));
    if (variantMatched.length > 0) {
      const frontIdx = variantMatched.findIndex((img) => img.tag === 'front' || Boolean(img.isPrimary));
      setActiveImageIndex(frontIdx >= 0 ? frontIdx : 0);
    } else {
      setActiveImageIndex(0);
    }
  };

  // Manejador de selección de filtro por defecto
  const handleSelectFilter = (filter) => {
    setSelectedFilter(filter);
    const allImages = Array.isArray(currentModel.images) ? currentModel.images : [];
    const validImages = allImages.filter((img) => img && (img.url || img.imageUrl));
    const filterMatched = validImages.filter((img) => matchVariantKey(img.variantKey, filter.id));
    if (filterMatched.length > 0) {
      const frontIdx = filterMatched.findIndex((img) => img.tag === 'front' || Boolean(img.isPrimary));
      setActiveImageIndex(frontIdx >= 0 ? frontIdx : 0);
    } else {
      setActiveImageIndex(0);
    }
  };

  // Foto actualmente activa para el visor
  const activeImageObj = currentVariantImages[activeImageIndex] || currentVariantImages[0] || {};
  const currentPhoto = activeImageObj.url
    ? formatMediaUrl(activeImageObj.url)
    : getPrimaryProductImage(currentModel, selectedVariant?.key);

  // Cálculo de precio reactivo
  const basePrice = Number(currentModel.price) || 0;
  const variantPriceModifier = selectedVariant ? Number(selectedVariant.priceModifier) || 0 : 0;
  const calculatedPrice = basePrice + variantPriceModifier;
  const formattedPrice = `$ ${calculatedPrice.toLocaleString('es-AR')}`;

  const isModelOutOfStock = currentModel.stock === 0;

  // Color de resplandor ambiental
  const glowColor =
    selectedVariant?.badgeColor ||
    selectedFilter?.hexCode ||
    '#F3B93A';

  // Acción de compra directa: Abre el Checkout Pro de CIRQA
  const handleDirectBuy = () => {
    if (isModelOutOfStock) return;
    onClose();
    openCheckout({
      productId: currentModel._id || currentModel.id,
      name: currentModel.name,
      modelCode: currentModel.modelCode || currentModel.code || 'Q-001',
      price: calculatedPrice,
      image: currentPhoto,
      variant: selectedVariant || null,
      variantKey: selectedVariant?.key || null,
      variantName: selectedVariant?.name || null,
      variantSubtitle: selectedVariant?.subtitle || null,
      badgeColor: selectedVariant?.badgeColor || '#FFFFFF',
      filter: selectedVariant
        ? {
            id: selectedVariant.key,
            name: selectedVariant.name,
            tag: selectedVariant.subtitle,
            hexCode: selectedVariant.badgeColor,
          }
        : selectedFilter,
      quantity: 1,
    });
  };

  const getTagLabel = (tag, idx) => {
    switch (tag) {
      case 'front':
        return 'Vista Frontal';
      case 'side':
      case 'hover':
        return 'Vista Lateral / Perfil';
      case 'angle':
        return 'Perspectiva';
      case 'model':
        return 'Puesto';
      case 'detail':
        return 'Detalle';
      default:
        return idx === 0 ? 'Vista Frontal' : idx === 1 ? 'Vista Lateral / Perfil' : `Ángulo ${idx + 1}`;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 md:p-10">
          {/* Backdrop con blur delicado */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-cirqa-negro/60 backdrop-blur-md"
          />

          {/* Contenedor del Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white rounded-3xl border border-cirqa-negro/10 shadow-2xl overflow-hidden z-10 my-auto"
          >
            {/* Header del Modal */}
            <div className="px-6 sm:px-8 py-5 border-b border-cirqa-negro/10 flex items-center justify-between bg-cirqa-surface flex-shrink-0">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-cirqa-primario font-semibold block">
                  Configurador de Lentes · Catálogo Oficial
                </span>
                <h3 className="text-xl sm:text-2xl font-light text-cirqa-negro tracking-tight mt-0.5">
                  Personalizá tu {currentModel.name || 'Armazón'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-cirqa-negro/60 hover:text-cirqa-negro rounded-full hover:bg-black/5 transition-colors focus:outline-none cursor-pointer"
                aria-label="Cerrar configurador"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cuerpo del Modal: 2 Columnas */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8 lg:p-10 items-center overflow-y-auto">
              
              {/* Columna Izquierda: Escenario Visual Limpio con Zoom */}
              <div className="lg:col-span-6 flex flex-col items-center justify-center bg-[#FAF9F5] rounded-3xl p-6 sm:p-8 border border-cirqa-negro/10 relative">
                
                {/* Resplandor ambiental adaptativo */}
                <div
                  className="absolute w-56 h-56 rounded-full blur-3xl opacity-20 transition-colors duration-500 pointer-events-none"
                  style={{ backgroundColor: glowColor }}
                />

                {/* Visor Principal con Integración Limpia e Interacción de Zoom */}
                <div
                  onClick={() => setIsZoomOpen(true)}
                  className="w-full max-w-md h-56 sm:h-64 flex items-center justify-center relative z-10 bg-transparent cursor-zoom-in group select-none"
                  title="Hacé clic para ampliar en alta resolución"
                >
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={`${currentModel.id || currentModel._id}-${currentPhoto}`}
                      src={currentPhoto}
                      alt={`${currentModel.name} - ${activeImageObj.tag || 'Vista'}`}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="w-full h-full object-contain p-2 mix-blend-multiply filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.06)] group-hover:scale-105 transition-all duration-300"
                      style={{ mixBlendMode: 'multiply' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/products/_DSC8649.webp';
                      }}
                    />
                  </AnimatePresence>

                  {/* Indicador sutil de Zoom en hover */}
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-[10px] px-2.5 py-1 rounded-full backdrop-blur-sm pointer-events-none flex items-center gap-1 font-mono shadow-xs">
                    <ZoomIn className="w-3 h-3" />
                    <span>Ampliar</span>
                  </div>
                </div>

                {/* 6. Miniaturas Visuales de Galería: 2 o 3 fotos de la variante activa con borde interactivo */}
                {currentVariantImages.length > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-3 z-10 flex-wrap max-w-full pb-1">
                    {currentVariantImages.slice(0, 3).map((img, idx) => {
                      const isSelected = activeImageIndex === idx;
                      return (
                        <button
                          key={img._id || `variant-thumb-${idx}`}
                          type="button"
                          onClick={() => setActiveImageIndex(idx)}
                          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl p-1.5 transition-all cursor-pointer flex items-center justify-center relative overflow-hidden ${
                            isSelected
                              ? 'border-2 border-cirqa-negro bg-white shadow-md scale-105 ring-2 ring-cirqa-negro/10'
                              : 'border border-cirqa-negro/15 bg-white/70 hover:border-cirqa-negro/40 hover:bg-white'
                          }`}
                          title={getTagLabel(img.tag, idx)}
                          aria-label={`Ver ángulo ${idx + 1}`}
                        >
                          <img
                            src={formatMediaUrl(img.url)}
                            alt={getTagLabel(img.tag, idx)}
                            className="w-full h-full object-contain mix-blend-multiply"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Dimensiones Ópticas Limpias (Sin texto redundante repetido) */}
                <div className="mt-4 pt-4 border-t border-cirqa-negro/10 w-full flex items-center justify-around text-[11px] text-cirqa-negro/70 font-normal">
                  <span>Lente: <strong className="text-cirqa-negro">{currentModel.lensWidth || 50}mm</strong></span>
                  <span>Puente: <strong className="text-cirqa-negro">{currentModel.bridgeWidth || 19}mm</strong></span>
                  <span>Patilla: <strong className="text-cirqa-negro">{currentModel.templeLength || 142}mm</strong></span>
                </div>
              </div>

              {/* Columna Derecha: Controles de Configuración Limpios */}
              <div className="lg:col-span-6 space-y-5">
                
                {/* 3. Bloque de Descripción Elegante del Armazón (MongoDB description) */}
                {(currentModel.description || currentModel.frameShape) && (
                  <div className="p-4 bg-[#FAF9F5] rounded-2xl border border-cirqa-negro/10">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase tracking-widest text-cirqa-negro/50 font-bold block">
                        Detalles del Diseño & Calce
                      </span>
                      {currentModel.modelCode && (
                        <span className="font-mono text-[10px] font-bold text-cirqa-primario">
                          {currentModel.modelCode}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-cirqa-negro/80 font-light leading-relaxed">
                      {currentModel.description || 'Armazón ergonómico de perfil depurado con balance óptico ideal para uso prolongado.'}
                    </p>
                  </div>
                )}

                {/* 2. Selector Dinámico de Cristales Circadianos / Variantes */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-cirqa-negro/70 block mb-2">
                    {currentModel.variantAxisTitle || 'Personalizá el Cristal Circadiano'}
                  </label>
                  
                  {hasVariants && variantsList.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      {variantsList.map((variant) => {
                        const isSelected = matchVariantKey(selectedVariant?.key, variant.key);
                        const modifier = Number(variant.priceModifier) || 0;
                        return (
                          <button
                            key={variant.key}
                            type="button"
                            onClick={() => handleSelectVariant(variant)}
                            className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                              isSelected
                                ? 'border-cirqa-primario bg-cirqa-primario/5 shadow-sm ring-1 ring-cirqa-primario/20'
                                : 'border-cirqa-negro/15 bg-white hover:border-cirqa-negro/30'
                            }`}
                          >
                            <div
                              className="w-3.5 h-3.5 rounded-full mt-0.5 flex-shrink-0 border"
                              style={{
                                backgroundColor: variant.badgeColor || '#FFFFFF',
                                borderColor: `${variant.badgeColor || '#000000'}88`,
                              }}
                            />
                            <div className="flex-grow min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-semibold text-cirqa-negro truncate">
                                  {variant.name}
                                </span>
                                {modifier > 0 && (
                                  <span className="text-[10px] font-mono text-cirqa-primario font-semibold flex-shrink-0">
                                    +${modifier.toLocaleString('es-AR')}
                                  </span>
                                )}
                              </div>
                              {variant.subtitle && (
                                <span className="text-[10px] text-cirqa-negro/60 block mt-0.5 truncate uppercase">
                                  {variant.subtitle}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* Filtros Circadianos por defecto */
                    <div className="grid grid-cols-2 gap-2.5">
                      {FILTERS.map((filter) => {
                        const isSelected = selectedFilter?.id === filter.id;
                        return (
                          <button
                            key={filter.id}
                            type="button"
                            onClick={() => handleSelectFilter(filter)}
                            className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                              isSelected
                                ? 'border-cirqa-primario bg-cirqa-primario/5 shadow-sm ring-1 ring-cirqa-primario/20'
                                : 'border-cirqa-negro/15 bg-white hover:border-cirqa-negro/30'
                            }`}
                          >
                            <div
                              className="w-3.5 h-3.5 rounded-full mt-0.5 flex-shrink-0 border"
                              style={{
                                backgroundColor: filter.hexCode || '#FFFFFF',
                                borderColor: `${filter.hexCode || '#000000'}88`,
                              }}
                            />
                            <div className="flex-grow min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-semibold text-cirqa-negro truncate">
                                  {filter.name}
                                </span>
                              </div>
                              {filter.tag && (
                                <span className="text-[10px] text-cirqa-negro/60 block mt-0.5 truncate uppercase">
                                  {filter.tag}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Corrección Oficial de Materiales y Protección */}
                <div className="p-4 bg-cirqa-surface rounded-2xl border border-cirqa-negro/10 text-xs space-y-2">
                  <div className="text-cirqa-negro/85 leading-snug">
                    <strong className="text-cirqa-negro font-bold">MATERIAL:</strong> Acetato de celulosa de alta densidad · TR-90 Ultraliviano · Aleación metálica flexible.
                  </div>
                  <div className="pt-2 border-t border-cirqa-negro/10 text-cirqa-negro/85 leading-snug">
                    <strong className="text-cirqa-negro font-bold">PROTECCIÓN:</strong> 100% UV400 con tratamiento Antirréflex multicapa en todas las variantes.
                  </div>
                  {(selectedVariant?.key === 'noche' || selectedVariant?.name?.toLowerCase().includes('noche') || selectedFilter?.id === 'noche') && (
                    <div className="mt-2 pt-2 border-t border-cirqa-negro/10 flex items-center gap-1.5 text-cirqa-carmin text-[11px] font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>No apto para conducir (Tv &lt; 15%) · Uso nocturno para descanso</span>
                    </div>
                  )}
                </div>

                {/* 4. Formas de Pago Visibles en el Configurador */}
                <div className="p-4 rounded-2xl bg-[#FBFBFA] border border-cirqa-negro/10 space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold font-mono text-cirqa-negro">
                      {formattedPrice}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      15% OFF TRANSFERENCIA
                    </span>
                  </div>
                  <div className="text-xs space-y-1 pt-1.5 border-t border-cirqa-negro/5">
                    <p className="text-cirqa-negro font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <span>6 cuotas sin interés de <strong>${Math.round(calculatedPrice / 6).toLocaleString('es-AR')}</strong></span>
                    </p>
                    <p className="text-emerald-700 font-medium">
                      o <strong>${Math.round(calculatedPrice * 0.85).toLocaleString('es-AR')}</strong> (15% OFF) pagando con Transferencia
                    </p>
                  </div>
                </div>

                {/* Acción Principal de Compra Directa */}
                <div className="pt-1">
                  <button
                    type="button"
                    disabled={isModelOutOfStock}
                    onClick={handleDirectBuy}
                    className="w-full bg-cirqa-negro hover:bg-cirqa-primario text-white disabled:bg-gray-300 disabled:cursor-not-allowed font-bold text-xs sm:text-sm tracking-wider uppercase py-4 rounded-full transition-all text-center shadow-lg hover:shadow-xl cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isModelOutOfStock ? 'Sin stock' : `Comprar · ${formattedPrice}`}</span>
                  </button>
                </div>

              </div>

            </div>

          </motion.div>

          {/* 5. Zoom de Imagen / Lightbox Interactivo en Pantalla Completa */}
          <AnimatePresence>
            {isZoomOpen && (
              <div
                onClick={() => setIsZoomOpen(false)}
                className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8 bg-black/95 backdrop-blur-md cursor-zoom-out"
              >
                <button
                  onClick={() => setIsZoomOpen(false)}
                  className="absolute top-6 right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer z-10"
                  aria-label="Cerrar zoom"
                >
                  <X className="w-6 h-6" />
                </button>

                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.2 }}
                  className="relative max-w-5xl max-h-[85vh] flex flex-col items-center justify-center select-none"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={currentPhoto}
                    alt={`${currentModel.name} - Alta Resolución`}
                    className="max-h-[75vh] max-w-full w-auto object-contain filter drop-shadow-[0_20px_50px_rgba(255,255,255,0.08)] rounded-2xl"
                  />
                  <div className="mt-4 text-center">
                    <h4 className="text-white text-base font-medium">
                      {currentModel.name} · {selectedVariant?.name || selectedFilter?.name}
                    </h4>
                    <span className="text-white/60 text-xs">
                      100% UV400 · Tratamiento Antirréflex Multicapa
                    </span>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
