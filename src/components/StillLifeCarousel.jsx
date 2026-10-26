import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

const SITUACIONES = [
  {
    id: 'dia',
    title: 'Día & Foco Continuo',
    momentLabel: 'MIENTRAS TRABAJÁS',
    time: '10:00 hs — Jornada Diurna',
    badgeFilter: 'FILTRO DÍA AMARILLO (84%)',
    modelImage: '/assets/situaciones-amarillo.webp',
    modelImageMobile: '/assets/situaciones-amarillo-mobile.webp',
    fallback: '/assets/SITUACIONES%20AMARILLO.jpg',
    accentColor: '#F3B93A',
    description: 'Tu herramienta diaria frente a monitores. Bloquea el 84% de la luz azul preservando la percepción natural del color para trabajar sin cefaleas ni cansancio ocular.',
    specs: ['84% Bloqueo Azul', 'Transmitancia 76.17%', '100% UV400'],
  },
  {
    id: 'transicion',
    title: 'Transición Gamer / Pantallas',
    momentLabel: 'CUANDO CAE EL SOL',
    time: '18:00 hs — Caída Solar',
    badgeFilter: 'FILTRO TRANSICIÓN NARANJA (95%)',
    modelImage: '/assets/situaciones-naranja.webp',
    modelImageMobile: '/assets/situaciones-naranja-mobile.webp',
    fallback: '/assets/SITUACIONES%20NARANJA.jpg',
    accentColor: '#E84A0F',
    description: 'Diseñados para sesiones continuas de pantallas durante el final de la tarde. Filtran el 95% de la luz azul en el rango crítico sin alterar la nitidez ni generar fatiga.',
    specs: ['95% Bloqueo Azul Crítico', 'Protección Retina', '100% UV400'],
  },
  {
    id: 'noche',
    title: 'Modo Noche · Melatonina & Reparación',
    momentLabel: 'ANTES DE IRTE A DORMIR',
    time: '21:30 hs — Desconexión Nocturna',
    badgeFilter: 'FILTRO NOCHE ROJO (100%)',
    modelImage: '/assets/situaciones-rojo.webp',
    modelImageMobile: '/assets/situaciones-rojo-mobile.webp',
    fallback: '/assets/SITUACIONES%20ROJO.jpg',
    accentColor: '#EF4444',
    description: 'En tu mesa de luz, listos para la última hora del día. Bloquean el espectro azul y verde de pantallas y luminarias, permitiendo el pico natural de melatonina y facilitando el sueño reparador.',
    specs: ['100% Bloqueo Azul y Verde', 'Inducción Melatonina', 'Sueño REM Profundo'],
  },
];

export default function StillLifeCarousel() {
  const containerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  const checkScroll = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

      // Calcular el slide activo en versión móvil
      const cardWidth = clientWidth * 0.88;
      if (cardWidth > 0) {
        const index = Math.round(scrollLeft / cardWidth);
        setActiveSlide(Math.min(SITUACIONES.length - 1, Math.max(0, index)));
      }
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction) => {
    if (containerRef.current) {
      const scrollAmount = containerRef.current.clientWidth * 0.88;
      containerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const scrollToSlide = (index) => {
    if (containerRef.current) {
      const cardWidth = containerRef.current.clientWidth * 0.88;
      containerRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth',
      });
      setActiveSlide(index);
    }
  };

  return (
    <section
      id="situaciones"
      className="py-20 sm:py-24 bg-cirqa-negro text-white relative overflow-hidden border-t border-white/10"
    >
      {/* Fallback anchor for existing links */}
      <div id="still-life" className="absolute -top-20" aria-hidden="true" />
      
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cirqa-ocaso/25 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 relative z-10">
        
        {/* 1. Títulos y Encabezado de la Sección Oficial */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-12">
          <div>
            <span className="text-[11px] font-mono tracking-[0.25em] text-cirqa-arena uppercase font-semibold block mb-2">
              OPTIMIZÁ TU CICLO
            </span>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-light text-white tracking-tight leading-tight">
              UNO PARA CADA MOMENTO DEL DÍA.
            </h2>
            <p className="text-xs sm:text-base text-white/70 font-light mt-2 sm:mt-3 tracking-wide">
              Mientras trabajás. Cuando cae el sol. Antes de irte a dormir.
            </p>
          </div>

          {/* Navigation Controls (visibles en mobile/tablet cuando hay desplazamiento horizontal) */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-white hover:bg-white hover:text-cirqa-negro disabled:opacity-30 transition-all shadow-sm cursor-pointer"
              aria-label="Anterior momento del día"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-white hover:bg-white hover:text-cirqa-negro disabled:opacity-30 transition-all shadow-sm cursor-pointer"
              aria-label="Siguiente momento del día"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2 & 4. Grilla Desktop (3 Columnas) / Carrusel Horizontal Mobile (Snap-x) */}
        <div className="relative -mx-5 px-5 sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0 mb-8 sm:mb-16">
          <div
            ref={containerRef}
            onScroll={checkScroll}
            className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 overflow-x-auto md:overflow-visible pt-2 pb-6 md:pb-0 scroll-px-5 snap-x snap-mandatory select-none"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {SITUACIONES.map((situation) => (
              <motion.div
                key={situation.id}
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="w-[88vw] sm:w-[380px] md:w-full flex-shrink-0 snap-center md:flex-shrink relative min-h-[530px] sm:min-h-[570px] md:h-[580px] lg:h-[620px] rounded-3xl overflow-hidden group shadow-2xl bg-[#111111] flex flex-col justify-between p-5 sm:p-7 border border-white/10 hover:border-white/25 transition-colors duration-500"
              >
                {/* 1. Fotografía Vertical de Campaña en Fondo Completo */}
                <picture className="absolute inset-0 w-full h-full block">
                  <source media="(max-width: 768px)" srcSet={situation.modelImageMobile} type="image/webp" />
                  <source srcSet={situation.modelImage} type="image/webp" />
                  <img 
                    src={situation.modelImage} 
                    alt={situation.title}
                    width="1200"
                    height="1600"
                    className="w-full h-full object-cover object-top md:object-center transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      if (situation.fallback) {
                        e.currentTarget.src = situation.fallback;
                      }
                    }}
                  />
                </picture>

                {/* 2. Capa de Gradiente Inmersiva para Legibilidad Óptima del Texto */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/75 via-48% to-black/25 pointer-events-none" />

                {/* 3. Cabecera Superior Flotante (Glassmorphism) */}
                <div className="relative z-10 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 w-full mb-4">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full backdrop-blur-md bg-black/50 border border-white/15 text-white/90 text-[11px] sm:text-xs font-mono">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{situation.time}</span>
                  </div>

                  <div
                    className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full backdrop-blur-md bg-black/50 border border-white/15 text-[10px] sm:text-xs font-semibold tracking-wide uppercase"
                    style={{ color: situation.accentColor || '#F59E0B' }}
                  >
                    {situation.badgeFilter}
                  </div>
                </div>

                {/* 4. Pie de Tarjeta: Contenido Editorial y Especificaciones (Texto Completo) */}
                <div className="relative z-10 flex flex-col gap-2.5 sm:gap-3 mt-auto pt-4">
                  {/* Momento de Uso */}
                  <span className="text-[10px] sm:text-[11px] font-mono tracking-widest uppercase text-cirqa-arena/90 font-semibold">
                    {situation.momentLabel}
                  </span>

                  {/* Título Principal de la Situación */}
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-light text-white tracking-tight leading-snug">
                    {situation.title}
                  </h3>

                  {/* Descripción del Beneficio Biológico - Texto COMPLETO sin cortes ni truncado */}
                  <p className="text-xs sm:text-sm text-white/90 font-light leading-relaxed">
                    {situation.description}
                  </p>

                  {/* Chips Técnicos de Laboratorio / Homologación */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-2 border-t border-white/10">
                    {situation.specs?.map((spec, i) => (
                      <span 
                        key={i} 
                        className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg backdrop-blur-md bg-white/10 border border-white/15 text-[10px] sm:text-[11px] font-mono text-white/90"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
            <div className="w-2 md:hidden flex-shrink-0 pointer-events-none" aria-hidden="true" />
          </div>

          {/* Indicadores de paginación por puntos en Celular */}
          <div className="flex md:hidden justify-center items-center gap-2 mt-4">
            {SITUACIONES.map((sit, idx) => (
              <button
                key={sit.id}
                type="button"
                onClick={() => scrollToSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeSlide === idx
                    ? 'w-6 bg-cirqa-arena'
                    : 'w-1.5 bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Ver situación ${sit.title}`}
              />
            ))}
          </div>
        </div>

        {/* Manifiesto Cita al Pie */}
        <div className="max-w-4xl mx-auto text-left sm:text-center py-10 px-8 bg-gradient-to-r from-cirqa-ocaso/80 via-cirqa-carmin/80 to-cirqa-primario/80 rounded-3xl border border-white/15 shadow-2xl space-y-4">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-white/80">
            La mayoría de los hogares le dicen a tu cerebro: <span className="text-cirqa-amarillo font-bold">¡SEGUÍ DESPIERTO!</span>
          </p>
          <div className="text-2xl sm:text-3xl md:text-4xl font-light text-white tracking-tight leading-tight space-y-1">
            <p>La solución no es la oscuridad absoluta.</p>
            <p className="font-semibold text-cirqa-arena">
              Es la luz correcta.<br className="hidden sm:inline" /> Cálida, ámbar, roja.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
