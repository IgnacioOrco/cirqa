import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { FILTERS } from '../data/filters';
import { getProductImage as getStudioProductImage } from '../data/productImages';
import { normalizeImageUrl } from '../utils/productImages';
import { useCart } from '../context/CartContext';

export default function ConfiguratorModal({
  isOpen,
  onClose,
  initialModel = null,
  initialFilter = null,
  onOpenPrescription,
}) {
  const { products } = useProducts({ all: false });
  const { openCheckout } = useCart();

  const [selectedModel, setSelectedModel] = useState(initialModel || null);
  const [selectedFilter, setSelectedFilter] = useState(initialFilter || FILTERS[1]); // Default Día (84%)
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeAngle, setActiveAngle] = useState('perspectiva'); // 'frente' | 'perspectiva' | 'cenital'
  const [selectedCustomImageIndex, setSelectedCustomImageIndex] = useState(0);

  // Sincronizar modelo inicial recibido como prop
  useEffect(() => {
    if (initialModel) {
      setSelectedModel(initialModel);
      setSelectedCustomImageIndex(0);
    } else if (!selectedModel && products.length > 0) {
      setSelectedModel(products[0]);
      setSelectedCustomImageIndex(0);
    }
  }, [initialModel, products]);

  // Sincronizar filtro inicial
  useEffect(() => {
    if (initialFilter) {
      setSelectedFilter(initialFilter);
    }
  }, [initialFilter]);

  if (!selectedModel && products.length > 0) {
    setSelectedModel(products[0]);
  }

  const currentModel = selectedModel || products[0] || {};
  const hasVariants = Boolean(
    currentModel.hasVariants &&
    Array.isArray(currentModel.variants) &&
    currentModel.variants.length > 0
  );
  const variantsList = hasVariants ? currentModel.variants : [];

  // Sincronizar variante seleccionada por defecto al cambiar de modelo
  useEffect(() => {
    if (hasVariants && variantsList.length > 0) {
      const defaultVar = variantsList.find((v) => v.isDefault) || variantsList[0];
      setSelectedVariant(defaultVar);
    } else {
      setSelectedVariant(null);
    }
  }, [currentModel?._id, currentModel?.id, hasVariants]);

  const customImages = Array.isArray(currentModel.images) ? currentModel.images : [];
  const hasCustomImages = customImages.length > 0 && customImages[0]?.url && !customImages[0]?.url.includes('_DSC');

  // Determinar la foto actual a mostrar con reactividad por variante
  const getCurrentPhoto = () => {
    // 1. Si hay una variante seleccionada, buscar foto vinculada a esa variante en product.images
    if (selectedVariant && Array.isArray(currentModel.images)) {
      const variantImg = currentModel.images.find(
        (img) => img && img.variantKey === selectedVariant.key && (img.url || img.imageUrl)
      );
      if (variantImg) {
        return normalizeImageUrl(variantImg.url || variantImg.imageUrl);
      }
    }

    // 2. Si es un modelo clásico de CIRQA con fotos de estudio circadianas:
    if (currentModel.classicKey) {
      const filterKey = selectedVariant ? selectedVariant.key : selectedFilter.id;
      return getStudioProductImage(currentModel.classicKey, filterKey, activeAngle);
    }

    // 3. Si tiene imágenes personalizadas cargadas:
    if (hasCustomImages) {
      const targetImg = customImages[selectedCustomImageIndex] || customImages[0];
      return normalizeImageUrl(targetImg?.url || currentModel.primaryImage);
    }

    // 4. Foto primaria del armazón o fallback
    return currentModel.primaryImage || '/products/_DSC8649.webp';
  };

  const currentPhoto = getCurrentPhoto();

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

  // Acción de compra directa: Abre el Checkout Pro de CIRQA con el armazón y variante configurados
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
              
              {/* Columna Izquierda: Escenario Visual del Producto */}
              <div className="lg:col-span-6 flex flex-col items-center justify-center bg-gradient-to-b from-[#FBFBFA] to-[#F3F1ED] rounded-3xl p-6 sm:p-8 border border-cirqa-negro/10 relative shadow-inner">
                
                {/* Selector de Ángulos / Galería clasificada */}
                {hasCustomImages ? (
                  <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 bg-white/90 backdrop-blur-md rounded-full border border-cirqa-negro/10 shadow-sm z-20 mb-4 max-w-full">
                    {customImages.map((img, idx) => {
                      const tagLabel =
                        img.tag === 'front'
                          ? 'Frente'
                          : img.tag === 'angle'
                          ? '3/4'
                          : img.tag === 'side'
                          ? 'Perfil'
                          : img.tag === 'detail'
                          ? 'Detalle'
                          : `Foto ${idx + 1}`;
                      return (
                        <button
                          key={img._id || idx}
                          onClick={() => setSelectedCustomImageIndex(idx)}
                          className={`px-3 py-1 text-[11px] font-medium rounded-full transition-all cursor-pointer ${
                            selectedCustomImageIndex === idx
                              ? 'bg-cirqa-negro text-white shadow-xs font-semibold'
                              : 'text-cirqa-negro/70 hover:text-cirqa-negro hover:bg-black/5'
                          }`}
                        >
                          {tagLabel}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 p-1 bg-white/90 backdrop-blur-md rounded-full border border-cirqa-negro/10 shadow-sm z-20 mb-4">
                    {[
                      { id: 'frente', label: 'Frente' },
                      { id: 'perspectiva', label: '3/4 Lateral' },
                      { id: 'cenital', label: 'Detalle' },
                    ].map((ang) => (
                      <button
                        key={ang.id}
                        onClick={() => setActiveAngle(ang.id)}
                        className={`px-3 py-1 text-[11px] font-medium rounded-full transition-all cursor-pointer ${
                          activeAngle === ang.id
                            ? 'bg-cirqa-negro text-white shadow-xs font-semibold'
                            : 'text-cirqa-negro/70 hover:text-cirqa-negro hover:bg-black/5'
                        }`}
                      >
                        {ang.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Resplandor ambiental adaptativo */}
                <div
                  className="absolute w-56 h-56 rounded-full blur-3xl opacity-20 transition-colors duration-500 pointer-events-none"
                  style={{ backgroundColor: glowColor }}
                />

                {/* Imagen del Producto con Crossfade */}
                <div className="w-full max-w-md h-52 sm:h-64 flex items-center justify-center relative z-10 p-2">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={`${currentModel.id}-${currentPhoto}-${selectedVariant?.key || selectedFilter.id}`}
                      src={currentPhoto}
                      alt={`${currentModel.name} ${selectedVariant ? selectedVariant.name : selectedFilter.name}`}
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="w-full h-full object-contain select-none filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.08)]"
                      style={{ mixBlendMode: 'multiply' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/products/_DSC8649.webp';
                      }}
                    />
                  </AnimatePresence>
                </div>

                {/* Dimensiones e información de confección */}
                <div className="mt-4 pt-4 border-t border-cirqa-negro/10 w-full flex items-center justify-between text-[11px] text-cirqa-negro/70 font-normal">
                  <span>Lente: {currentModel.lensWidth || 50}mm</span>
                  <span>Puente: {currentModel.bridgeWidth || 19}mm</span>
                  <span>Patilla: {currentModel.templeLength || 142}mm</span>
                  <span className="font-semibold text-cirqa-negro">{currentModel.frameShape}</span>
                </div>
              </div>

              {/* Columna Derecha: Controles de Configuración */}
              <div className="lg:col-span-6 space-y-6">
                
                {/* 1. Selector de Armazones */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-cirqa-negro/70">
                      1. Seleccionar Armazón
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-40 overflow-y-auto pr-1">
                    {products.map((model) => {
                      const isOutOfStock = model.stock === 0;
                      const isSelected = currentModel.id === model.id;
                      return (
                        <button
                          key={model.id}
                          disabled={isOutOfStock}
                          onClick={() => {
                            if (isOutOfStock) return;
                            setSelectedModel(model);
                            setSelectedCustomImageIndex(0);
                          }}
                          className={`py-2.5 px-1.5 text-center rounded-2xl border transition-all text-xs relative ${
                            isOutOfStock
                              ? 'border-cirqa-negro/10 bg-gray-50 text-cirqa-negro/40 cursor-not-allowed opacity-60'
                              : isSelected
                              ? 'border-cirqa-negro bg-cirqa-negro text-white font-semibold shadow-sm cursor-pointer'
                              : 'border-cirqa-negro/15 bg-white text-cirqa-negro hover:border-cirqa-negro/40 cursor-pointer'
                          }`}
                        >
                          <span className="block text-[10px] opacity-75 truncate">{model.modelCode || model.code}</span>
                          <span className="block font-medium truncate">{model.name.replace('Modelo ', '')}</span>
                          {isOutOfStock && (
                            <span className="block text-[9px] font-semibold text-cirqa-carmin mt-0.5">
                              Sin stock
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Selector Dinámico de Variantes (Solo si hasVariants es true y hay opciones) */}
                {hasVariants && variantsList.length > 0 && (
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-cirqa-negro/70 block mb-2">
                      {currentModel.variantAxisTitle || '2. Seleccionar Variante'}
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {variantsList.map((variant) => {
                        const isSelected = selectedVariant?.key === variant.key;
                        const modifier = Number(variant.priceModifier) || 0;
                        return (
                          <button
                            key={variant.key}
                            type="button"
                            onClick={() => setSelectedVariant(variant)}
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
                  </div>
                )}

                {/* Especificaciones y Advertencia Nocturna */}
                <div className="p-4 bg-cirqa-surface rounded-2xl border border-cirqa-negro/10 text-xs">
                  <div className="flex items-center justify-between text-cirqa-negro/80 font-normal">
                    <span>Protección: <strong>100% UV400 / Espectral</strong></span>
                    <span>Material: <strong>{currentModel.material || 'Acetato Bio'}</strong></span>
                  </div>
                  {(selectedVariant?.key === 'noche' || selectedVariant?.name?.toLowerCase().includes('noche') || selectedFilter?.id === 'noche') && (
                    <div className="mt-2 pt-2 border-t border-cirqa-negro/10 flex items-center gap-1.5 text-cirqa-carmin text-[11px] font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>No apto para conducir (Tv &lt; 15%) · Uso nocturno para descanso</span>
                    </div>
                  )}
                </div>

                {/* Acciones de Compra y Receta */}
                <div className="pt-2 space-y-2">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={isModelOutOfStock}
                      onClick={() => {
                        if (isModelOutOfStock) return;
                        onClose();
                        if (onOpenPrescription) {
                          onOpenPrescription(currentModel, selectedVariant || selectedFilter);
                        }
                      }}
                      className="w-1/2 border border-cirqa-negro/20 hover:border-cirqa-negro text-cirqa-negro font-bold text-xs tracking-wider uppercase py-3.5 rounded-full transition-all text-center disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Tengo Receta
                    </button>
                    
                    <button
                      type="button"
                      disabled={isModelOutOfStock}
                      onClick={handleDirectBuy}
                      className="w-1/2 bg-cirqa-negro text-white hover:bg-cirqa-negro/85 disabled:bg-gray-300 disabled:cursor-not-allowed font-bold text-xs tracking-wider uppercase py-3.5 rounded-full transition-all text-center shadow-sm cursor-pointer"
                    >
                      {isModelOutOfStock ? 'Sin stock' : calculatedPrice > 0 ? `Comprar ${formattedPrice}` : 'Consultar'}
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
