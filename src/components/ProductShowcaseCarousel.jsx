import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import { useProducts, ProductCardSkeleton } from '../hooks/useProducts';
import { FILTERS } from '../data/filters';
import { getProductImage as getStudioProductImage } from '../data/productImages';

export default function ProductShowcaseCarousel({ onSelectModel }) {
  const containerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Consumir productos dinámicos desde MongoDB
  const { products, loading, error, refetch } = useProducts({ all: false });

  // Estado local por tarjeta: filtro seleccionado, imagen activa / ángulo y hover
  const [cardStates, setCardStates] = useState({});
  const [hoveredCardId, setHoveredCardId] = useState(null);

  // Inicializar estados de tarjeta al cargar los productos
  useEffect(() => {
    if (products.length > 0) {
      setCardStates((prev) => {
        const next = { ...prev };
        products.forEach((p) => {
          if (!next[p.id]) {
            next[p.id] = {
              filterId: p.lensDefault || 'dia',
              angle: 'perspectiva',
              selectedImageUrl: null,
            };
          }
        });
        return next;
      });
    }
  }, [products]);

  const checkScroll = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [products, loading]);

  const scroll = (direction) => {
    if (containerRef.current) {
      const scrollAmount = containerRef.current.clientWidth * 0.75;
      containerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const setCardFilter = (productId, filterId) => {
    setCardStates((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        filterId,
      },
    }));
  };

  const setCardAngle = (productId, angle) => {
    setCardStates((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        angle,
        selectedImageUrl: null,
      },
    }));
  };

  const setCardSelectedImage = (productId, imageUrl) => {
    setCardStates((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        selectedImageUrl: imageUrl,
      },
    }));
  };

  /**
   * Resuelve la imagen a renderizar aplicando las Reglas de Mapeo Dinámico:
   * 1. Portada: isPrimary || primer elemento || image_url
   * 2. Hover: tag === 'front' o 2da imagen si el usuario pasa el mouse por la card
   * 3. Galería de miniaturas y ángulos de estudio
   */
  const resolveDisplayImage = (product) => {
    const state = cardStates[product.id] || {};
    const isHovered = hoveredCardId === product.id;

    // Si el usuario seleccionó una imagen específica de las miniaturas
    if (state.selectedImageUrl) {
      return state.selectedImageUrl;
    }

    const hasCustomImages = Array.isArray(product.images) && product.images.length > 0 && product.images[0]?.url && !product.images[0]?.url.includes('_DSC');

    // Caso A: El producto tiene imágenes dinámicas subidas en MongoDB
    if (hasCustomImages) {
      if (isHovered && product.hoverImage && product.hoverImage !== product.primaryImage) {
        return product.hoverImage;
      }
      return product.primaryImage;
    }

    // Caso B: Modelo clásico con simulación de filtros circadianos de estudio
    if (product.classicKey) {
      const filterId = state.filterId || product.lensDefault || 'dia';
      const angle = state.angle || (isHovered ? 'frente' : 'perspectiva');
      return getStudioProductImage(product.classicKey, filterId, angle);
    }

    // Caso C: Fallback a imagen primaria
    if (isHovered && product.hoverImage && product.hoverImage !== product.primaryImage) {
      return product.hoverImage;
    }
    return product.primaryImage || '/products/_DSC8649.webp';
  };

  return (
    <section id="pasarela-productos" className="py-24 bg-cirqa-surface/50 border-b border-cirqa-negro/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Encabezado de la Sección */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-cirqa-primario font-semibold block mb-2">
              Pasarela de Productos · Catálogo en Tiempo Real
            </span>
            <h2 className="text-3xl sm:text-4xl font-light text-cirqa-negro tracking-tight">
              Ingeniería Óptica y Diseño.
            </h2>
            <p className="text-xs sm:text-sm text-cirqa-negro/60 font-light mt-1">
              Explorá cada silueta sincronizada directamente con la base de datos y probá los cristales circadianos en fotografía real.
            </p>
          </div>
          
          {/* Controles de Navegación & Refresco */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="w-10 h-10 rounded-full border border-cirqa-negro/15 bg-white flex items-center justify-center text-cirqa-negro/70 hover:text-cirqa-negro hover:border-cirqa-negro transition-all shadow-sm"
              title="Sincronizar catálogo"
              aria-label="Refrescar catálogo"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="w-10 h-10 rounded-full border border-cirqa-negro/15 bg-white flex items-center justify-center text-cirqa-negro hover:border-cirqa-negro hover:bg-cirqa-negro hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-cirqa-negro transition-all shadow-sm"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="w-10 h-10 rounded-full border border-cirqa-negro/15 bg-white flex items-center justify-center text-cirqa-negro hover:border-cirqa-negro hover:bg-cirqa-negro hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-cirqa-negro transition-all shadow-sm"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carrusel de Productos con Snap y Hover Clearance */}
        <div className="relative -mx-6 px-6 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
          <div
            ref={containerRef}
            onScroll={checkScroll}
            className="flex gap-6 md:gap-8 overflow-x-auto pt-6 pb-12 scroll-px-6 sm:scroll-px-8 lg:scroll-px-12 snap-x snap-mandatory select-none"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {/* Estado de Carga: Skeletons elegantes */}
            {loading && products.length === 0 && (
              <>
                <ProductCardSkeleton />
                <ProductCardSkeleton />
                <ProductCardSkeleton />
                <ProductCardSkeleton />
              </>
            )}

            {/* Estado de Error si no hay productos disponibles */}
            {!loading && products.length === 0 && error && (
              <div className="w-full py-16 flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-10 h-10 text-cirqa-primario/60 mb-3" />
                <p className="text-sm font-medium text-cirqa-negro">No se pudo cargar el catálogo dinámico.</p>
                <button
                  onClick={() => refetch()}
                  className="mt-4 px-4 py-2 bg-cirqa-negro text-white text-xs uppercase tracking-wider rounded-full hover:bg-cirqa-negro/80 transition-colors"
                >
                  Reintentar conexión
                </button>
              </div>
            )}

            {/* Mapeo de Productos Dinámicos */}
            {products.map((product) => {
              const state = cardStates[product.id] || {};
              const currentFilterId = state.filterId || product.lensDefault || 'dia';
              const currentAngle = state.angle || 'perspectiva';
              const currentFilterObj = FILTERS.find((f) => f.id === currentFilterId) || FILTERS[0];
              const displayImg = resolveDisplayImage(product);
              const customImages = Array.isArray(product.images) ? product.images : [];
              const hasMultipleCustomImages = customImages.length > 1;

              return (
                <motion.div
                  key={product.id}
                  whileHover={{ y: -8 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  onMouseEnter={() => setHoveredCardId(product.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                  className="w-[300px] sm:w-[360px] md:w-[380px] flex-shrink-0 snap-start bg-white rounded-3xl p-6 sm:p-7 border border-cirqa-negro/10 hover:border-cirqa-negro/30 flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-2xl relative group z-10 hover:z-20 cursor-pointer"
                  onClick={() => onSelectModel && onSelectModel(product)}
                >
                  {/* Etiqueta Superior & Código de Modelo */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-cirqa-negro/50 font-light mb-3">
                      <span className="font-mono text-[11px] bg-cirqa-surface px-2.5 py-1 rounded-full font-medium text-cirqa-negro/70">
                        {product.modelCode || product.code}
                      </span>
                      <span className="text-[10px] tracking-wider text-cirqa-primario font-semibold uppercase">
                        {product.frameShape}
                      </span>
                    </div>

                    {/* Título & Descripción Dinámicos */}
                    <h3 className="text-lg font-medium text-cirqa-negro tracking-tight">
                      {product.name} <span className="font-light text-cirqa-negro/60 text-sm">· {product.title}</span>
                    </h3>
                    <p className="text-[11px] text-cirqa-negro/60 font-light line-clamp-1 mt-0.5">
                      {product.description}
                    </p>
                  </div>

                  {/* Escenario de Imagen con Fusión y Transición Suave */}
                  <div className="h-52 sm:h-56 flex flex-col items-center justify-center my-3 relative overflow-hidden rounded-2xl bg-[#FBFBFA]">
                    {/* Resplandor ambiental adaptativo */}
                    <div
                      className="absolute inset-0 m-auto w-40 h-40 rounded-full blur-3xl opacity-25 pointer-events-none transition-colors duration-500"
                      style={{ backgroundColor: currentFilterObj.hexCode }}
                    />

                    {/* Renderizado de la Imagen con AnimatePresence para Crossfade suave */}
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={displayImg}
                        src={displayImg}
                        alt={`${product.name} - CIRQA`}
                        initial={{ opacity: 0.4, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0.3, scale: 0.98 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="max-h-44 sm:max-h-48 w-full object-contain select-none filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.06)] relative z-10 p-2"
                        style={{ mixBlendMode: 'multiply' }}
                        loading="lazy"
                        onError={(e) => {
                          // Fallback si la imagen no carga
                          e.target.onerror = null;
                          e.target.src = '/products/_DSC8649.webp';
                        }}
                      />
                    </AnimatePresence>

                    {/* Controles flotantes en la imagen: Galería clasificada o Ángulos de estudio */}
                    {hasMultipleCustomImages ? (
                      // Mini selector de tags para fotos subidas
                      <div
                        className="absolute bottom-2 right-2 flex items-center gap-1 bg-white/95 backdrop-blur-md px-1.5 py-1 rounded-full border border-cirqa-negro/10 shadow-xs opacity-90 group-hover:opacity-100 transition-opacity z-20"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {customImages.slice(0, 3).map((img, idx) => (
                          <button
                            key={img._id || idx}
                            onClick={() => setCardSelectedImage(product.id, img.url)}
                            className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full transition-all ${
                              displayImg === img.url
                                ? 'bg-cirqa-negro text-white'
                                : 'text-cirqa-negro/60 hover:text-cirqa-negro'
                            }`}
                            title={`Foto: ${img.tag || `Vista ${idx + 1}`}`}
                          >
                            {img.tag === 'front' ? 'Frente' : img.tag === 'angle' ? '3/4' : img.tag === 'side' ? 'Perfil' : `V${idx + 1}`}
                          </button>
                        ))}
                      </div>
                    ) : product.classicKey ? (
                      // Selector de perspectiva clásico
                      <div
                        className="absolute bottom-2 right-2 flex items-center gap-1 bg-white/95 backdrop-blur-md px-1.5 py-1 rounded-full border border-cirqa-negro/10 shadow-xs opacity-90 group-hover:opacity-100 transition-opacity z-20"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setCardAngle(product.id, 'frente')}
                          className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full transition-all ${
                            currentAngle === 'frente' && !state.selectedImageUrl
                              ? 'bg-cirqa-negro text-white'
                              : 'text-cirqa-negro/60 hover:text-cirqa-negro'
                          }`}
                        >
                          Frente
                        </button>
                        <button
                          onClick={() => setCardAngle(product.id, 'perspectiva')}
                          className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full transition-all ${
                            currentAngle === 'perspectiva' && !state.selectedImageUrl
                              ? 'bg-cirqa-negro text-white'
                              : 'text-cirqa-negro/60 hover:text-cirqa-negro'
                          }`}
                        >
                          3/4
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {/* Selector interactivo de Filtros Circadianos */}
                  <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-cirqa-negro/60">
                        Cristal: <strong className="text-cirqa-negro font-semibold">{currentFilterObj.name}</strong>
                      </span>
                      <span className="text-[10px] font-mono text-cirqa-primario font-semibold">
                        {currentFilterObj.tag}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {FILTERS.map((filter) => {
                        const isSelected = currentFilterId === filter.id;
                        return (
                          <button
                            key={filter.id}
                            onClick={() => setCardFilter(product.id, filter.id)}
                            className={`py-1.5 px-1 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                              isSelected
                                ? 'border-cirqa-negro bg-cirqa-negro/5 shadow-xs font-semibold'
                                : 'border-cirqa-negro/10 hover:border-cirqa-negro/30 bg-white'
                            }`}
                            title={`Ver ${product.name} con cristal ${filter.name}`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full border shadow-xs"
                              style={{ backgroundColor: filter.hexCode, borderColor: `${filter.hexCode}99` }}
                            />
                            <span className="text-[9px] tracking-tight text-cirqa-negro/80 truncate w-full block">
                              {filter.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Especificaciones Ópticas y Físicas */}
                    <div className="pt-3 border-t border-cirqa-negro/5 text-[10px] text-cirqa-negro/60 font-light flex items-center justify-between">
                      <span>Lente: {product.lensWidth}mm</span>
                      <span>Puente: {product.bridgeWidth}mm</span>
                      <span>Patilla: {product.templeLength}mm</span>
                    </div>

                    {/* Pie de Tarjeta: Precio y Acción */}
                    <div className="flex items-center justify-between pt-2 border-t border-cirqa-negro/5">
                      <div>
                        {product.price > 0 ? (
                          <p className="text-sm font-semibold text-cirqa-negro">
                            {product.formattedPrice}
                          </p>
                        ) : (
                          <span className="text-[10px] font-semibold tracking-wider text-cirqa-primario uppercase block">
                            Pre-lanzamiento
                          </span>
                        )}
                        <span className="text-[10px] text-cirqa-negro/50 block font-light">
                          {product.stock > 0 ? `Stock: ${product.stock} u.` : 'Colección 2026'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectModel && onSelectModel(product)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase bg-cirqa-negro text-white hover:bg-cirqa-negro/80 transition-all px-4 py-2.5 rounded-full shadow-xs"
                      >
                        <span>CONFIGURAR</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Espaciador final para scroll fluido */}
            <div className="w-2 sm:w-6 flex-shrink-0 pointer-events-none" aria-hidden="true" />
          </div>
        </div>

      </div>
    </section>
  );
}
