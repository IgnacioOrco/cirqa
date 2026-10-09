import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';
import { useProducts, ProductCardSkeleton } from '../hooks/useProducts';
import { FILTERS } from '../data/filters';
import { getProductImage as getStudioProductImage } from '../data/productImages';
import { formatMediaUrl } from '../services/api';
import { resolveProductCardImage, getPrimaryProductImage, getHoverProductImage } from '../utils/productImages';

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
        filterId,
        variantKey: filterId,
      },
    }));
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
          
          {/* Controles de Navegación & Botón Ver Catálogo Completo */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/catalogo"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-cirqa-negro text-white hover:bg-cirqa-primario rounded-full text-xs font-semibold uppercase tracking-wider transition-all shadow-xs group cursor-pointer"
            >
              <span>Ver Catálogo Completo</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>

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
              const isHovered = hoveredCardId === product.id;

              // Determinar opciones de variantes o filtros circadianos
              const variantOptions = (product.hasVariants && product.variants?.length > 0)
                ? product.variants.map((v) => ({
                    key: v.key,
                    name: v.name,
                    tag: v.subtitle || '',
                    color: v.badgeColor || '#FFFFFF',
                  }))
                : FILTERS.map((f) => ({
                    key: f.id,
                    name: f.name,
                    tag: f.tag,
                    color: f.hexCode,
                  }));

              const currentSelectedKey = state.filterId || state.variantKey || product.lensDefault || (variantOptions[0]?.key || 'dia');
              const currentOptionObj =
                variantOptions.find((o) => o.key === currentSelectedKey) ||
                FILTERS.find((f) => f.id === currentSelectedKey) ||
                variantOptions[0] ||
                FILTERS[0];
              const glowColor = currentOptionObj?.color || '#F3B93A';

              // Imagen base determinista (portada o variante elegida) y foto lateral hover del MISMO modelo
              const primaryImg = getPrimaryProductImage(product, currentSelectedKey);
              const hoverImg = getHoverProductImage(product, primaryImg, currentSelectedKey);

              return (
                <motion.div
                  key={product.id}
                  whileHover={{ y: -8 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  onMouseEnter={() => setHoveredCardId(product.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                  className="w-[300px] sm:w-[360px] md:w-[380px] flex-shrink-0 snap-start bg-[#FAF9F5] rounded-3xl p-6 sm:p-7 border border-cirqa-negro/10 hover:border-cirqa-negro/30 flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-2xl relative group z-10 hover:z-20 cursor-pointer"
                  onClick={() => onSelectModel && onSelectModel(product, currentSelectedKey)}
                >
                  {/* Etiqueta Superior & Código de Modelo */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-cirqa-negro/50 font-light mb-3">
                      <span className="font-mono text-[11px] bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full font-medium text-cirqa-negro/70 shadow-2xs border border-cirqa-negro/10">
                        {product.modelCode || product.code}
                      </span>
                      <span className="text-[10px] tracking-wider text-cirqa-primario font-semibold uppercase bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full border border-cirqa-negro/10">
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

                  {/* Escenario de Imagen Limpio con Integración Visual sin Cuadro */}
                  <div className="h-52 sm:h-56 flex flex-col items-center justify-center my-3 relative overflow-hidden bg-transparent">
                    {/* Resplandor ambiental adaptativo */}
                    <div
                      className="absolute inset-0 m-auto w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-500"
                      style={{ backgroundColor: glowColor }}
                    />

                    {/* Contenedor relativo de imágenes con transición suave crossfade */}
                    <div className="relative w-full h-full flex items-center justify-center p-4 z-10">
                      {/* Imagen Base (Portada) */}
                      <img
                        src={formatMediaUrl(primaryImg)}
                        alt={`${product.name} - CIRQA`}
                        className={`w-full h-full object-contain p-4 select-none filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.06)] transition-all duration-300 ${
                          isHovered && hoverImg !== primaryImg ? 'opacity-0' : 'opacity-100'
                        }`}
                        style={{ mixBlendMode: 'multiply' }}
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/products/_DSC8649.webp';
                        }}
                      />

                      {/* Imagen Hover Alternativa (al pasar el cursor) */}
                      {hoverImg !== primaryImg && (
                        <img
                          src={formatMediaUrl(hoverImg)}
                          alt={`${product.name} Hover - CIRQA`}
                          className={`absolute inset-0 m-auto w-full h-full object-contain p-4 select-none filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.06)] transition-all transition-opacity duration-300 pointer-events-none ${
                            isHovered ? 'opacity-100' : 'opacity-0'
                          }`}
                          style={{ mixBlendMode: 'multiply' }}
                          loading="lazy"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/products/_DSC8649.webp';
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Selector interactivo de Filtros Circadianos o Variantes */}
                  <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-cirqa-negro/60">
                        {product.variantAxisTitle || 'Cristal'}:{' '}
                        <strong className="text-cirqa-negro font-semibold">{currentOptionObj?.name}</strong>
                      </span>
                      {currentOptionObj?.tag && (
                        <span className="text-[10px] font-mono text-cirqa-primario font-semibold">
                          {currentOptionObj.tag}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {variantOptions.map((opt) => {
                        const isSelected = currentSelectedKey === opt.key;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => setCardFilter(product.id, opt.key)}
                            className={`py-1.5 px-1 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                              isSelected
                                ? 'border-cirqa-negro bg-cirqa-negro/5 shadow-xs font-semibold ring-1 ring-cirqa-negro/20'
                                : 'border-cirqa-negro/10 hover:border-cirqa-negro/30 bg-white'
                            }`}
                            title={`Ver ${product.name} con ${opt.name}`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full border shadow-xs"
                              style={{ backgroundColor: opt.color, borderColor: `${opt.color}99` }}
                            />
                            <span className="text-[9px] tracking-tight text-cirqa-negro/80 truncate w-full block">
                              {opt.name}
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

                    {/* Pie de Tarjeta: Privacidad de Precio & CTA de Personalización */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-cirqa-negro/5">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-cirqa-primario block">
                          Ingeniería Óptica
                        </span>
                        <span className="text-[10px] text-cirqa-negro/50 block font-light">
                          {product.frameShape || 'Diseño Ergonómico'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectModel && onSelectModel(product, currentSelectedKey)}
                        className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold tracking-wider uppercase bg-cirqa-negro text-white hover:bg-cirqa-primario transition-all px-4 py-2.5 rounded-full shadow-xs cursor-pointer active:scale-95"
                      >
                        <span>Configurar</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Tarjeta Final: Acceso al Catálogo Completo */}
            <div className="flex-shrink-0 w-[240px] sm:w-[280px] snap-center flex flex-col justify-center items-center p-8 bg-white/70 hover:bg-white rounded-3xl border border-dashed border-cirqa-negro/20 text-center space-y-4 group transition-all shadow-2xs">
              <div className="w-12 h-12 rounded-full bg-cirqa-negro/5 group-hover:bg-cirqa-primario/10 flex items-center justify-center transition-colors">
                <ArrowRight className="w-5 h-5 text-cirqa-negro/70 group-hover:text-cirqa-primario transition-colors" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-cirqa-negro">
                  ¿Buscás más modelos?
                </h4>
                <p className="text-xs text-cirqa-negro/60 font-light mt-1">
                  Explorá todos los armazones y filtros de la colección oficial.
                </p>
              </div>
              <Link
                to="/catalogo"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-cirqa-negro text-white hover:bg-cirqa-primario rounded-full text-[11px] font-bold uppercase tracking-wider transition-all"
              >
                <span>Ver Catálogo</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Espaciador final para scroll fluido */}
            <div className="w-2 sm:w-6 flex-shrink-0 pointer-events-none" aria-hidden="true" />
          </div>
        </div>

        {/* Botón Central Inferior: Ver Catálogo Completo */}
        <div className="mt-8 flex justify-center">
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-cirqa-negro hover:bg-cirqa-primario text-white rounded-full text-xs font-semibold uppercase tracking-widest transition-all shadow-sm hover:shadow-md group cursor-pointer"
          >
            <span>Ver Catálogo Completo</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </section>
  );
}
