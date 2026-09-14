import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowUpRight, Eye, Layers } from 'lucide-react';
import { MODELS } from '../data/models';
import { FILTERS } from '../data/filters';
import { getProductImage } from '../data/productImages';

export default function ProductShowcaseCarousel({ onSelectModel }) {
  const containerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Store active filter & angle state for each card independently
  const [cardStates, setCardStates] = useState(() => {
    const init = {};
    MODELS.forEach((m) => {
      init[m.id] = {
        filterId: m.lensDefault || 'dia',
        angle: 'perspectiva',
      };
    });
    return init;
  });

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
  }, []);

  const scroll = (direction) => {
    if (containerRef.current) {
      const scrollAmount = containerRef.current.clientWidth * 0.75;
      containerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const setCardFilter = (modelId, filterId) => {
    setCardStates((prev) => ({
      ...prev,
      [modelId]: {
        ...prev[modelId],
        filterId,
      },
    }));
  };

  const setCardAngle = (modelId, angle) => {
    setCardStates((prev) => ({
      ...prev,
      [modelId]: {
        ...prev[modelId],
        angle,
      },
    }));
  };

  return (
    <section id="pasarela-productos" className="py-24 bg-cirqa-surface/50 border-b border-cirqa-negro/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-cirqa-primario font-semibold block mb-2">
              Pasarela de Productos · Colección 2026
            </span>
            <h2 className="text-3xl sm:text-4xl font-light text-cirqa-negro tracking-tight">
              Ingeniería Óptica y Diseño.
            </h2>
            <p className="text-xs sm:text-sm text-cirqa-negro/60 font-light mt-1">
              Explorá cada silueta y probá los cristales circadianos en tiempo real con fotografía real de estudio.
            </p>
          </div>
          
          {/* Subtle Controls */}
          <div className="flex items-center gap-2">
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

        {/* Scroll Snap Carousel Track with fluid bleed, generous hover clearance and zero clipping */}
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
            {MODELS.map((model) => {
              const currentFilterId = cardStates[model.id]?.filterId || model.lensDefault || 'dia';
              const currentAngle = cardStates[model.id]?.angle || 'perspectiva';
              const imgSrc = getProductImage(model.id, currentFilterId, currentAngle);
              const currentFilterObj = FILTERS.find((f) => f.id === currentFilterId) || FILTERS[0];

              return (
                <motion.div
                  key={model.id}
                  whileHover={{ y: -8 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  className="w-[300px] sm:w-[360px] md:w-[380px] flex-shrink-0 snap-start bg-white rounded-3xl p-6 sm:p-7 border border-cirqa-negro/10 hover:border-cirqa-negro/30 flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-2xl relative group z-10 hover:z-20"
                >
                  {/* Top Badge & Code */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-cirqa-negro/50 font-light mb-3">
                      <span className="font-mono text-[11px] bg-cirqa-surface px-2.5 py-1 rounded-full font-medium text-cirqa-negro/70">
                        {model.code}
                      </span>
                      <span className="text-[10px] tracking-wider text-cirqa-primario font-semibold uppercase">
                        {model.frameShape}
                      </span>
                    </div>

                    {/* Header Title & Subtitle */}
                    <h3 className="text-lg font-medium text-cirqa-negro tracking-tight">
                      {model.name} <span className="font-light text-cirqa-negro/60 text-sm">· {model.title}</span>
                    </h3>
                    <p className="text-[11px] text-cirqa-negro/60 font-light line-clamp-1 mt-0.5">
                      {model.description}
                    </p>
                  </div>

                  {/* Real Product Image Showcase */}
                  <div className="h-52 sm:h-56 flex flex-col items-center justify-center my-3 relative overflow-hidden rounded-2xl bg-[#FBFBFA]">
                    {/* Subtle soft backdrop radial glow */}
                    <div
                      className="absolute inset-0 m-auto w-40 h-40 rounded-full blur-3xl opacity-25 pointer-events-none transition-colors duration-500"
                      style={{ backgroundColor: currentFilterObj.hexCode }}
                    />

                    {/* Image with Crossfade and Multiply Blend Mode for 100% seamless transparency */}
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={`${model.id}-${currentFilterId}-${currentAngle}`}
                        src={imgSrc}
                        alt={`${model.name} con cristal ${currentFilterObj.name}`}
                        initial={{ opacity: 0.3, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0.2, scale: 0.97 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="max-h-44 sm:max-h-48 w-full object-contain select-none filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.06)] relative z-10 p-2"
                        style={{ mixBlendMode: 'multiply' }}
                        loading="lazy"
                      />
                    </AnimatePresence>

                    {/* Angle Switcher (Frente / Perspectiva 3/4) */}
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-white/95 backdrop-blur-md px-1.5 py-1 rounded-full border border-cirqa-negro/10 shadow-xs opacity-90 group-hover:opacity-100 transition-opacity z-20">
                      <button
                        onClick={() => setCardAngle(model.id, 'frente')}
                        className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full transition-all ${
                          currentAngle === 'frente'
                            ? 'bg-cirqa-negro text-white'
                            : 'text-cirqa-negro/60 hover:text-cirqa-negro'
                        }`}
                      >
                        Frente
                      </button>
                      <button
                        onClick={() => setCardAngle(model.id, 'perspectiva')}
                        className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full transition-all ${
                          currentAngle === 'perspectiva'
                            ? 'bg-cirqa-negro text-white'
                            : 'text-cirqa-negro/60 hover:text-cirqa-negro'
                        }`}
                      >
                        3/4
                      </button>
                    </div>
                  </div>

                  {/* Interactive Lens Switcher Pills on Card */}
                  <div className="space-y-3">
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
                            onClick={() => setCardFilter(model.id, filter.id)}
                            className={`py-1.5 px-1 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                              isSelected
                                ? 'border-cirqa-negro bg-cirqa-negro/5 shadow-xs font-semibold'
                                : 'border-cirqa-negro/10 hover:border-cirqa-negro/30 bg-white'
                            }`}
                            title={`Ver ${model.name} con cristal ${filter.name}`}
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

                    {/* Specs Bullets */}
                    <div className="pt-3 border-t border-cirqa-negro/5 text-[10px] text-cirqa-negro/60 font-light flex items-center justify-between">
                      <span>Lente: {model.lensWidth}mm</span>
                      <span>Puente: {model.bridgeWidth}mm</span>
                      <span>Patilla: {model.templeLength}mm</span>
                    </div>

                    {/* Footer info & CTA: Modo Próximamente */}
                    <div className="flex items-center justify-between pt-2 border-t border-cirqa-negro/5">
                      <div>
                        {/* Precio temporalmente oculto para modo pre-lanzamiento */}
                        {/* <p className="text-sm font-semibold text-cirqa-negro">{model.formattedPrice}</p> */}
                        <span className="text-[10px] font-semibold tracking-wider text-cirqa-primario uppercase block">
                          Pre-lanzamiento
                        </span>
                        <span className="text-[10px] text-cirqa-negro/50 block font-light">
                          Colección 2026
                        </span>
                      </div>

                      {/* CTA Bloqueado temporalmente */}
                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase bg-cirqa-negro/20 text-cirqa-negro/50 cursor-not-allowed shadow-none px-4 py-2.5 rounded-full"
                        aria-disabled="true"
                      >
                        <span>PRÓXIMAMENTE</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {/* Trailing spacer so the last card has comfortable breathing room */}
            <div className="w-2 sm:w-6 flex-shrink-0 pointer-events-none" aria-hidden="true" />
          </div>
        </div>

      </div>
    </section>
  );
}
