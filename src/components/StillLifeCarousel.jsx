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
    modelImage: '/assets/SITUACIONES AMARILLO.jpg',
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
    modelImage: '/assets/SITUACIONES NARANJA.jpg',
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
    modelImage: '/assets/SITUACIONES ROJO.jpg',
    accentColor: '#EF4444',
    description: 'En tu mesa de luz, listos para la última hora del día. Bloquean el espectro azul y verde de pantallas y luminarias, permitiendo el pico natural de melatonina y facilitando el sueño reparador.',
    specs: ['100% Bloqueo Azul y Verde', 'Inducción Melatonina', 'Sueño REM Profundo'],
  },
];

export default function StillLifeCarousel() {
  const containerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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
      const scrollAmount = containerRef.current.clientWidth * 0.85;
      containerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section
      id="situaciones"
      className="py-24 bg-cirqa-negro text-white relative overflow-hidden border-t border-white/10"
    >
      {/* Fallback anchor for existing links */}
      <div id="still-life" className="absolute -top-20" aria-hidden="true" />
      
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cirqa-ocaso/25 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* 1. Títulos y Encabezado de la Sección Oficial */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-[11px] font-mono tracking-[0.25em] text-cirqa-arena uppercase font-semibold block mb-2">
              OPTIMIZÁ TU CICLO
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white tracking-tight leading-tight">
              UNO PARA CADA MOMENTO DEL DÍA.
            </h2>
            <p className="text-sm sm:text-base text-white/70 font-light mt-3 tracking-wide">
              Mientras trabajás. Cuando cae el sol. Antes de irte a dormir.
            </p>
          </div>

          {/* Navigation Controls (visibles en mobile/tablet cuando hay desplazamiento horizontal) */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="w-10 h-10 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-white hover:bg-white hover:text-cirqa-negro disabled:opacity-30 transition-all shadow-sm cursor-pointer"
              aria-label="Anterior momento del día"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="w-10 h-10 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-white hover:bg-white hover:text-cirqa-negro disabled:opacity-30 transition-all shadow-sm cursor-pointer"
              aria-label="Siguiente momento del día"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2 & 4. Grilla Desktop (3 Columnas) / Carrusel Horizontal Mobile (Snap-x) */}
        <div className="relative -mx-6 px-6 sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0 mb-16">
          <div
            ref={containerRef}
            onScroll={checkScroll}
            className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 overflow-x-auto md:overflow-visible pt-2 pb-6 md:pb-0 scroll-px-6 snap-x snap-mandatory select-none"
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
                className="w-[85vw] sm:w-[380px] md:w-full flex-shrink-0 snap-center md:flex-shrink relative h-[500px] md:h-[580px] lg:h-[620px] rounded-3xl overflow-hidden group shadow-2xl bg-[#111111] flex flex-col justify-between p-6 sm:p-7 border border-white/10 hover:border-white/25 transition-colors duration-500"
              >
                {/* 1. Fotografía Vertical de Campaña en Fondo Completo */}
                <img 
                  src={situation.modelImage} 
                  alt={situation.title}
                  className="absolute inset-0 w-full h-full object-cover object-top md:object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />

                {/* 2. Capa de Gradiente Inmersiva para Legibilidad Óptima */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 via-55% to-black/20 pointer-events-none" />

                {/* 3. Cabecera Superior Flotante (Glassmorphism) */}
                <div className="relative z-10 flex items-center justify-between gap-2 w-full">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md bg-black/40 border border-white/15 text-white/90 text-xs font-mono">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{situation.time}</span>
                  </div>

                  <div
                    className="px-3 py-1.5 rounded-full backdrop-blur-md bg-black/40 border border-white/15 text-xs font-medium tracking-wide uppercase"
                    style={{ color: situation.accentColor || '#F59E0B' }}
                  >
                    {situation.badgeFilter}
                  </div>
                </div>

                {/* 4. Pie de Tarjeta: Contenido Editorial y Especificaciones */}
                <div className="relative z-10 flex flex-col gap-3">
                  {/* Momento de Uso */}
                  <span className="text-[11px] font-mono tracking-widest uppercase text-white/60 font-medium">
                    {situation.momentLabel}
                  </span>

                  {/* Título Principal de la Situación */}
                  <h3 className="text-2xl md:text-3xl font-light text-white tracking-tight leading-tight">
                    {situation.title}
                  </h3>

                  {/* Descripción del Beneficio Biológico */}
                  <p className="text-sm text-white/80 font-light leading-relaxed line-clamp-3">
                    {situation.description}
                  </p>

                  {/* Chips Técnicos de Laboratorio / Homologación */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                    {situation.specs?.map((spec, i) => (
                      <span 
                        key={i} 
                        className="px-2.5 py-1 rounded-lg backdrop-blur-sm bg-white/10 border border-white/10 text-[11px] font-mono text-white/90"
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
